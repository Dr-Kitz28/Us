variable "project" {
  type = string
}

variable "oidc_provider_arn" {
  type = string
}

variable "oidc_provider_url" {
  type = string
}

variable "sa_name" {
  type = string
}

variable "sa_namespace" {
  type = string
}

variable "secret_arn" {
  type = string
  default = ""
}

variable "create_k8s_sa_manifest" {
  type    = bool
  default = true
  description = "When true, module will emit a Kubernetes ServiceAccount manifest (YAML) and a kubectl annotate command as outputs. It does NOT apply the manifest."
}

variable "create_k8s_sa_apply" {
  type    = bool
  default = false
  description = "When true, Terraform will attempt to apply the ServiceAccount manifest using `kubectl apply` on the machine running `terraform apply`. Requires `kubectl` and a valid kubeconfig context."
}

variable "create_k8s_sa_native" {
  type    = bool
  default = false
  description = "When true, create the Kubernetes ServiceAccount resource using the Terraform Kubernetes provider (native). Requires the root module to configure the `kubernetes` provider via EKS data sources."
}

locals {
  issuer_host = replace(var.oidc_provider_url, "https://", "")
}

resource "aws_iam_role" "irsa_role" {
  name = "${var.project}-${var.sa_namespace}-${var.sa_name}-irsa"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Federated = var.oidc_provider_arn
        },
        Action = "sts:AssumeRoleWithWebIdentity",
        Condition = {
          StringEquals = {
            "${local.issuer_host}:sub" = "system:serviceaccount:${var.sa_namespace}:${var.sa_name}"
          }
        }
      }
    ]
  })
}

resource "aws_iam_policy" "irsa_secrets_policy" {
  name        = "${var.project}-${var.sa_namespace}-${var.sa_name}-secrets-read"
  description = "Allow reading Secrets Manager secret for service account"
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

resource "aws_iam_role_policy_attachment" "irsa_attach" {
  role       = aws_iam_role.irsa_role.name
  policy_arn = aws_iam_policy.irsa_secrets_policy.arn
}

output "irsa_role_arn" {
  value = aws_iam_role.irsa_role.arn
}

output "irsa_role_name" {
  value = aws_iam_role.irsa_role.name
}

output "sa_manifest" {
  value = var.create_k8s_sa_manifest ? <<-EOT : ""
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${var.sa_name}
  namespace: ${var.sa_namespace}
  annotations:
    eks.amazonaws.com/role-arn: ${aws_iam_role.irsa_role.arn}
EOT
  description = "YAML manifest for the Kubernetes ServiceAccount that binds to the IRSA role. Apply with `kubectl apply -f -`"
}

output "kubectl_annotate_cmd" {
  value = var.create_k8s_sa_manifest ? "kubectl annotate serviceaccount -n ${var.sa_namespace} ${var.sa_name} eks.amazonaws.com/role-arn=\"${aws_iam_role.irsa_role.arn}\" --overwrite" : ""
  description = "Command to annotate an existing service account with the IRSA role ARN."
}

locals {
  _sa_manifest = <<-YAML
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${var.sa_name}
  namespace: ${var.sa_namespace}
  annotations:
    eks.amazonaws.com/role-arn: ${aws_iam_role.irsa_role.arn}
YAML
}

resource "null_resource" "apply_sa" {
  count = var.create_k8s_sa_apply ? 1 : 0

  triggers = {
    sa_manifest = var.create_k8s_sa_manifest ? local._sa_manifest : ""
  }

  provisioner "local-exec" {
    command = <<-EOT
kubectl apply -f - <<'EOF'
${local._sa_manifest}
EOF
EOT
  }
}

resource "kubernetes_service_account" "irsa_sa" {
  count = var.create_k8s_sa_native ? 1 : 0

  metadata {
    name      = var.sa_name
    namespace = var.sa_namespace

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.irsa_role.arn
    }
  }

  depends_on = [aws_iam_role.irsa_role]
}

resource "local_file" "sa_yaml" {
  count = var.create_k8s_sa_native ? 1 : 0

  content  = local._sa_manifest
  filename = "${path.module}/sa-${var.sa_namespace}-${var.sa_name}.yaml"
}
