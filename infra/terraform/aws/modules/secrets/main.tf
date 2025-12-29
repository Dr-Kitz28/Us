resource "random_password" "db_password" {
  length  = 16
  special = true
}

resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.project}-db-password"
}

resource "aws_secretsmanager_secret_version" "db_password_ver" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

output "db_password" {
  value     = random_password.db_password.result
  sensitive = true
}

output "secret_arn" {
  value = aws_secretsmanager_secret.db_password.arn
}
