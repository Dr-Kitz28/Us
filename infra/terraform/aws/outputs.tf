output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "eks_kubeconfig" {
  value = module.eks.kubeconfig
  description = "Kubeconfig to connect to the EKS cluster (may be a generated file path or JSON)."
}

output "rds_endpoint" {
  value = module.rds.endpoint
}
