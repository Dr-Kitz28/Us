variable "region" {
  type = string
  default = "us-east-1"
}

variable "project" {
  type = string
  default = "uz"
}

variable "vpc_cidr" {
  type = string
  default = "10.0.0.0/16"
}

variable "cluster_name" {
  type = string
  default = "uz-cluster"
}

variable "db_name" {
  type = string
  default = "uzdb"
}

variable "db_username" {
  type = string
  default = "uz_admin"
}

variable "db_password" {
  type = string
  description = "Database password — fetch from secrets manager in CI/production"
}

variable "app_service_account_name" {
  type    = string
  default = "uz-app-sa"
  description = "Kubernetes service account name to bind with IRSA"
}

variable "app_service_account_namespace" {
  type    = string
  default = "default"
  description = "Kubernetes namespace for the service account"
}

variable "create_k8s_service_account" {
  type    = bool
  default = false
  description = "When true, Terraform will create a kubernetes_service_account annotated with the IRSA role. Requires a configured kubernetes provider (EKS)."
}
