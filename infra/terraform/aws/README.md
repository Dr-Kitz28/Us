# AWS Terraform module skeleton for Uz

This folder provides an example wiring for AWS resources used by `Uz`.

Structure:
- `main.tf` — root module wiring (VPC, EKS, RDS modules)
- `variables.tf` — inputs for the root module
- `outputs.tf` — useful outputs (cluster, db endpoints)
- `modules/` — placeholder modules: `vpc`, `eks`, `rds`

Notes:
- These are templates and not production-ready. For EKS, prefer using the community `terraform-aws-modules/eks/aws` module.
- Fill in required provider credentials and remote state backend before applying.
