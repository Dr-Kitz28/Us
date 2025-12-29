// Example S3 backend for Terraform remote state. Configure and enable in CI.
terraform {
  backend "s3" {
    bucket = "REPLACE_YOUR_BUCKET"
    key    = "infra/terraform.tfstate"
    region = "REPLACE_REGION"
    encrypt = true
  }
}
