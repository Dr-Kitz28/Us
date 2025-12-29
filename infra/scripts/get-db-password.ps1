param(
  [Parameter(Mandatory=$true)]
  [string]$SecretId
)

# Requires AWS Tools for PowerShell or AWS CLI available
try {
  $out = aws secretsmanager get-secret-value --secret-id $SecretId --query SecretString --output text 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to fetch secret: $out"
    exit 1
  }
  Write-Output $out
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
