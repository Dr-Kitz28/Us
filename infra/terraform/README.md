# Terraform skeleton (example)

This folder contains the Terraform skeleton for `Uz`. The repository is currently
configured to prefer AWS. The active root Terraform configuration wires the
AWS modules under `infra/terraform/aws` and the root `main.tf` references those
modules.

NOT for production as-is — replace provider and backend settings with your cloud account details.

Quick start (example using AWS):

```bash
# initialize
terraform init
# plan
terraform plan -var 'project=uz' -var 'region=us-east-1'
# apply
terraform apply -var 'project=uz' -var 'region=us-east-1'
```

Recommended next steps:
- Configure a remote state backend (see `backend.tf` example) and enable state locking (DynamoDB for S3).
- Review the community modules used in `aws/main.tf` (`vpc`, `eks`, `rds`) and tune inputs for your environment.
- Set GitHub Actions secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION` to enable CI plan runs. See `.github/workflows/terraform.yml` for the pipeline.

Bootstrap remote state

- Create the S3 bucket and DynamoDB lock table using the bootstrap module before running the main Terraform configuration. Example:

```bash
cd infra/terraform/bootstrap
terraform init
terraform apply -var 'state_bucket=your-unique-bucket-name' -var 'lock_table=your-lock-table-name' -var 'region=us-east-1'
```

- After creating the S3 bucket and lock table, update `infra/terraform/backend.tf` with the bucket and region (or pass them to `terraform init -backend-config` in CI).
 - After creating the S3 bucket and lock table, update `infra/terraform/backend.tf` with the bucket and region (or pass them to `terraform init -backend-config` in CI).

Bootstrap scripts

 - Use the included scripts to bootstrap remote state quickly:

PowerShell:

```powershell
./infra/scripts/bootstrap-remote-state.ps1 -BucketName your-unique-bucket -LockTableName your-lock-table -Region us-east-1
```

Bash:

```bash
./infra/scripts/bootstrap-remote-state.sh your-unique-bucket your-lock-table us-east-1
```

CI apply

 - The `.github/workflows/terraform-apply.yml` workflow provides a manual (workflow_dispatch) `terraform apply` run. Protect that workflow with a GitHub repository environment named `production` and require reviewers to approve runs.

IRSA (EKS service account IAM)

 - The Terraform EKS module exposes OIDC provider outputs which are used to create an IAM role bound to a Kubernetes service account (IRSA). The `infra/terraform/aws/modules/irsa` module creates the IAM role and attaches a Secrets Manager read policy so your workload can fetch the DB password securely.

 - By default the root Terraform module uses `app_service_account_name=uz-app-sa` and `app_service_account_namespace=default`. Customize these values in `infra/terraform/variables.tf` or pass via `-var`.

 - After `terraform apply` finishes, annotate or create the Kubernetes service account to use the IAM role (if using AWS IRSA, the `eks` module can manage IAM roles for service accounts; otherwise create a K8s service account and add the `eks.amazonaws.com/role-arn` annotation with the `irsa_role_arn` output).

Native ServiceAccount (optional)

 - The root module can manage the Kubernetes ServiceAccount natively using the `kubernetes` provider configured from the EKS data sources. To enable this, run `terraform apply` with:

	 - `-var 'create_k8s_service_account=true'`

 - When native mode is enabled Terraform will:
	 - create the IAM role and attach the Secrets Manager read policy
	 - create the `kubernetes_service_account` resource annotated with `eks.amazonaws.com/role-arn`
	 - write a copy of the generated manifest to `infra/terraform/aws/modules/irsa/sa-<namespace>-<name>.yaml`

 CI notes

 - The `kubernetes` provider must be able to reach the EKS API from the machine running `terraform apply` (CI runner or local). For GitHub Actions, use the official AWS EKS login/setup actions to obtain kubeconfig and ensure network access to the cluster.
 - Alternatively, keep `create_k8s_service_account=false` in CI and apply the manifest during your deployment pipeline using `kubectl apply -f` with a kubeconfig created from the EKS cluster.

CI Apply workflow (GitHub Actions)

 - Prerequisites: set these repository secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` (optional), and ensure your repo has an environment named `production` with required approvals.

 - To run the workflow from the GitHub UI: go to the Actions tab, pick "Terraform Apply with Kubeconfig" (or the `terraform.yml` apply workflow), click "Run workflow", set `confirm` to `true`, supply `cluster_name` and `region`, then run.

 - From the command line with `gh` CLI:

	 gh workflow run "Terraform Apply with Kubeconfig" --ref main -f confirm=true -f cluster_name=<your-cluster> -f region=<aws-region>

 - The workflow will:
	 - configure AWS credentials using repository secrets
	 - generate kubeconfig for the specified EKS cluster
	 - run `terraform apply` in `infra/terraform/aws` with `-var 'create_k8s_service_account=true'`
	 - verify the created ServiceAccount via `kubectl get sa`

 - Notes:
	 - The GitHub runner must be allowed to assume the AWS credentials you provide and reach the EKS API (public EKS endpoint or VPC access via runner configuration).
	 - If you prefer tighter control, keep `create_k8s_service_account=false` in CI and apply the generated manifest as part of your deployment step where kubeconfig is already configured.
