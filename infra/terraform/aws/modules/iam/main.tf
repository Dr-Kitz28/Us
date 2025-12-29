resource "aws_iam_role" "app_role" {
  name = "${var.project}-app-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Principal = { Service = "ecs-tasks.amazonaws.com" } # adjust for your runtime (ecs, eks, etc.)
      Effect = "Allow"
      Sid    = ""
    }]
  })
}

resource "aws_iam_policy" "secrets_read_policy" {
  name        = "${var.project}-secrets-read"
  description = "Allow reading specific Secrets Manager secrets"
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ],
        Resource = var.secret_arn != "" ? [var.secret_arn] : ["*"]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_secrets_policy" {
  role       = aws_iam_role.app_role.name
  policy_arn = aws_iam_policy.secrets_read_policy.arn
}

output "app_role_arn" {
  value = aws_iam_role.app_role.arn
}

output "app_role_name" {
  value = aws_iam_role.app_role.name
}
