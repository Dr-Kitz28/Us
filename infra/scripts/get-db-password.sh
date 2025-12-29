#!/usr/bin/env bash
# Usage: ./get-db-password.sh <secret-name-or-arn>
if [ -z "$1" ]; then
  echo "Usage: $0 <secret-name-or-arn>"
  exit 1
fi
SECRET_ID="$1"

# Requires AWS CLI v2 configured
aws secretsmanager get-secret-value --secret-id "$SECRET_ID" --query SecretString --output text
