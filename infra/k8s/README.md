# Kubernetes skeleton for Uz (example)

This folder contains minimal Kubernetes manifests to deploy the Next.js app in-cluster.

Files provided:
- `deployments/nextjs-deployment.yaml` — Deployment manifest (image placeholder)
- `services/nextjs-service.yaml` — ClusterIP / NodePort service
- `ingress/nginx-ingress.yaml` — Ingress example (assumes nginx-ingress controller)

Notes:
- Replace `image` with your container image (registry, tag).
- Use `kubectl apply -f` to deploy each manifest.
- For production, add resource requests/limits, probes, secrets, configmaps, and Horizontal Pod Autoscaler.

TLS & Ingress notes

- The `ingress/nginx-ingress.yaml` provided is a simple example for an nginx ingress controller. For production on AWS, consider using the AWS Load Balancer Controller (ALB) or an Ingress controller integrated with your cloud provider.
- To provision TLS certificates automatically, install `cert-manager` in the cluster and configure a `ClusterIssuer`. An example `cert-manager` staging `ClusterIssuer` and TLS `Ingress` are included at `ingress/cert-manager-clusterissuer.yaml`.

Example deploy steps (Helm + cert-manager):

```bash
# install cert-manager
kubectl apply --validate=false -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.1/cert-manager.crds.yaml
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --version v1.13.1

# apply ClusterIssuer and ingress
kubectl apply -f infra/k8s/ingress/cert-manager-clusterissuer.yaml
kubectl apply -f infra/k8s/ingress/nginx-ingress.yaml
```
