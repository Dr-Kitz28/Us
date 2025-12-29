# PowerShell script to bootstrap Terraform remote state (S3 + DynamoDB)
param(
  [string]$BucketName,
  [string]$LockTableName,
  [string]$Region = 'us-east-1'
)

if (-not $BucketName -or -not $LockTableName) {
  Write-Host "Usage: .\bootstrap-remote-state.ps1 -BucketName <bucket> -LockTableName <table> [-Region <region>]"
  exit 1
}

Push-Location infra/terraform/bootstrap
terraform init
terraform apply -auto-approve -var "state_bucket=$BucketName" -var "lock_table=$LockTableName" -var "region=$Region"
Pop-Location
