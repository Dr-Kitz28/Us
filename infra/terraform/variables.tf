variable "region" {
  description = "Cloud region"
  type        = string
  default     = "us-east-1"
}
variable "project" {
  description = "Project name"
  type        = string
  default     = "uz"
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
  type = string
  default = "uz-app-sa"
}

variable "app_service_account_namespace" {
  type = string
  default = "default"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "uz"
}
