#!/usr/bin/env bash
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./bootstrap-remote-state.sh <bucket-name> <lock-table-name> [region]"
  exit 1
fi
BUCKET="$1"
LOCK_TABLE="$2"
REGION="${3:-us-east-1}"

pushd infra/terraform/bootstrap
terraform init
terraform apply -auto-approve -var "state_bucket=${BUCKET}" -var "lock_table=${LOCK_TABLE}" -var "region=${REGION}"
popd
