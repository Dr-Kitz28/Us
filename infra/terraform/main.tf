terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# Example: wire modules - replace with real module sources or implementations
module "vpc" {
  source = "./aws/modules/vpc"
  project = var.project
  cidr = var.vpc_cidr
}

module "eks" {
  source = "./aws/modules/eks"
  project = var.project
  cluster_name = var.cluster_name
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
}

module "rds" {
  source = "./aws/modules/rds"
  project = var.project
  db_name = var.db_name
  db_username = var.db_username
  db_password = var.db_password
  subnet_ids = module.vpc.db_subnets
}
