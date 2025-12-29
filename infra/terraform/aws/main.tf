terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0"
    }
    local = {
      source  = "hashicorp/local"
      version = ">= 2.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# EKS cluster data sources used to configure the Kubernetes provider
data "aws_eks_cluster" "cluster" {
  name = module.eks.cluster_id
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_id
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
  load_config_file       = false
}

# Use community modules for production-grade defaults
# VPC
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 3.0"

  name = "${var.project}-vpc"
  cidr = var.vpc_cidr

  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
}

# EKS cluster (uses community module)
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.27"
  subnets         = module.vpc.private_subnets
  vpc_id          = module.vpc.vpc_id

  node_groups = {
    on_demand = {
      desired_capacity = 2
      max_capacity     = 3
      min_capacity     = 1
      instance_type    = "t3.medium"
    }
  }
}

# Managed RDS (Postgres) via community module
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 7.0"

  identifier = "${var.project}-db"
  engine     = "postgres"
  engine_version = "15"
  instance_class  = "db.t3.medium"

  name     = var.db_name
  username = var.db_username
  password = var.db_password != "" ? var.db_password : (module.secrets != null ? module.secrets.db_password : "")

  subnet_ids = module.vpc.db_subnets
  publicly_accessible = false
  skip_final_snapshot = true
}

# Secrets module: creates DB password in Secrets Manager when db_password not provided
module "secrets" {
  source  = "./modules/secrets"
  project = var.project
  # Only create when db_password var is empty — caller can choose to ignore
}

# IAM resources for the application to access Secrets Manager
module "iam" {
  source    = "./modules/iam"
  project   = var.project
  secret_arn = try(module.secrets.secret_arn, "")
}

# IRSA: create IAM role for Kubernetes service account to access Secrets Manager
module "irsa" {
  source = "./modules/irsa"
  project = var.project
  oidc_provider_arn = try(module.eks.oidc_provider_arn, "")
  oidc_provider_url = try(module.eks.cluster_oidc_issuer_url, try(module.eks.cluster_oidc_issuer, ""))
  sa_name = var.app_service_account_name
  sa_namespace = var.app_service_account_namespace
  secret_arn = try(module.secrets.secret_arn, "")
  create_k8s_sa_apply = var.create_k8s_service_account
  create_k8s_sa_native = var.create_k8s_service_account
  # ensure IRSA SA resources are created after EKS cluster
  depends_on = [module.eks]
}
