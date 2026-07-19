# GitHub Code City — Production Deployment Guide

## Quick Start

### Local Development

```bash
# Terminal 1: Frontend
npm install
npm run dev  # http://localhost:5173

# Terminal 2: Backend
cd backend
export ANTHROPIC_API_KEY="sk-..."
mvn clean package
mvn spring-boot:run  # http://localhost:8080
```

### Docker Compose (All-in-One)

```bash
# Set API key
export ANTHROPIC_API_KEY="sk-..."

# Start full stack
docker-compose up -d

# Access:
# Frontend: http://localhost:3000
# Backend: http://localhost:8080/api
# Redis: localhost:6379
```

**With cache & database**:
```bash
docker-compose --profile with-cache --profile with-database up -d
```

---

## Kubernetes Deployment (Production)

### Prerequisites

```bash
# 1. Kubernetes cluster (EKS, GKE, AKS, or self-hosted)
kubectl cluster-info

# 2. Docker registry (Docker Hub, ECR, GCR, etc.)
export REGISTRY=gcr.io/my-project
export IMAGE_TAG=v1.0.0

# 3. Ingress controller (nginx-ingress)
kubectl get deployment -n ingress-nginx

# 4. Cert manager (for TLS)
kubectl get deployment -n cert-manager
```

### Build & Push Images

```bash
# Backend image
docker build -t $REGISTRY/code-city-backend:$IMAGE_TAG \
             -f Dockerfile.backend .
docker push $REGISTRY/code-city-backend:$IMAGE_TAG

# Frontend image
docker build -t $REGISTRY/code-city-frontend:$IMAGE_TAG \
             -f Dockerfile.frontend .
docker push $REGISTRY/code-city-frontend:$IMAGE_TAG
```

### Deploy to Kubernetes

```bash
# Create namespace & secrets
kubectl create namespace code-city
kubectl -n code-city create secret generic code-city-secrets \
  --from-literal=anthropic-api-key="sk-..."

# Update image references in k8s-deployment.yaml
sed -i "s|code-city-backend:latest|$REGISTRY/code-city-backend:$IMAGE_TAG|g" \
    k8s-deployment.yaml
sed -i "s|code-city-frontend:latest|$REGISTRY/code-city-frontend:$IMAGE_TAG|g" \
    k8s-deployment.yaml

# Apply manifests
kubectl apply -f k8s-deployment.yaml

# Verify rollout
kubectl -n code-city rollout status deployment/code-city-backend
kubectl -n code-city rollout status deployment/code-city-frontend

# Get LoadBalancer IP
kubectl -n code-city get service code-city-frontend-svc
```

### Monitor Kubernetes Deployment

```bash
# Pods
kubectl -n code-city get pods -w

# Logs
kubectl -n code-city logs -f deployment/code-city-backend --all-containers
kubectl -n code-city logs -f deployment/code-city-frontend --all-containers

# Events
kubectl -n code-city get events --sort-by='.lastTimestamp'

# HPA status
kubectl -n code-city get hpa code-city-backend-hpa -w

# Resource usage
kubectl -n code-city top pods
kubectl -n code-city top nodes
```

---

## AWS EKS Deployment

### 1. Create EKS Cluster

```bash
eksctl create cluster \
  --name code-city-prod \
  --region us-east-1 \
  --nodegroup-name code-city-nodes \
  --node-type t3.xlarge \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10

# Get kubeconfig
aws eks update-kubeconfig --name code-city-prod --region us-east-1
```

### 2. Install Add-ons

```bash
# Metrics Server (for HPA)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=code-city-prod

# Cert Manager (for TLS)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
```

### 3. Create RDS Instance (Optional)

```bash
# PostgreSQL for analysis history
aws rds create-db-instance \
  --db-instance-identifier code-city-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username codecity \
  --master-user-password <strong-password> \
  --allocated-storage 20 \
  --publicly-accessible false

# Retrieve endpoint
aws rds describe-db-instances --db-instance-identifier code-city-postgres \
  --query 'DBInstances[0].Endpoint.Address'
```

### 4. Deploy Code City

```bash
# Push images to ECR
aws ecr create-repository --repository-name code-city-backend
aws ecr create-repository --repository-name code-city-frontend

# Build and push
docker build -f Dockerfile.backend -t code-city-backend:$VERSION .
docker tag code-city-backend:$VERSION \
  $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/code-city-backend:$VERSION
docker push $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/code-city-backend:$VERSION

# Apply Kubernetes manifests
kubectl apply -f k8s-deployment.yaml

# Create Route53 DNS record
aws route53 change-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --change-batch file://route53-change.json
```

---

## GCP GKE Deployment

### 1. Create GKE Cluster

```bash
gcloud container clusters create code-city-prod \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type n1-standard-2 \
  --enable-autoscaling \
  --min-nodes 3 \
  --max-nodes 10

# Get credentials
gcloud container clusters get-credentials code-city-prod --zone us-central1-a
```

### 2. Push to Google Container Registry

```bash
docker build -f Dockerfile.backend -t gcr.io/$PROJECT_ID/code-city-backend:$VERSION .
docker push gcr.io/$PROJECT_ID/code-city-backend:$VERSION

# Update k8s manifests
sed -i "s|code-city-backend:latest|gcr.io/$PROJECT_ID/code-city-backend:$VERSION|g" \
    k8s-deployment.yaml
```

### 3. Deploy

```bash
kubectl apply -f k8s-deployment.yaml

# Create Cloud Load Balancer
gcloud compute forwarding-rules create code-city-lb \
  --global \
  --load-balancing-scheme EXTERNAL \
  --address code-city-ip

# Map DNS
gcloud dns record-sets update code-city.example.com \
  --rrdatas="<LoadBalancer IP>" \
  --ttl=300 \
  --type=A \
  --zone=my-dns-zone
```

---

## Azure AKS Deployment

### 1. Create AKS Cluster

```bash
az aks create \
  --resource-group code-city-rg \
  --name code-city-prod \
  --node-count 3 \
  --vm-set-type VirtualMachineScaleSets \
  --enable-cluster-autoscaling \
  --min-count 3 \
  --max-count 10

# Get credentials
az aks get-credentials --resource-group code-city-rg --name code-city-prod
```

### 2. Push to Azure Container Registry

```bash
az acr create --resource-group code-city-rg \
  --name codecityregistry --sku Basic

az acr build --registry codecityregistry \
  --image code-city-backend:$VERSION \
  -f Dockerfile.backend .

# Get login server
az acr show --name codecityregistry --query loginServer
```

### 3. Deploy

```bash
# Update manifests with ACR registry
sed -i "s|code-city-backend:latest|codecityregistry.azurecr.io/code-city-backend:$VERSION|g" \
    k8s-deployment.yaml

kubectl apply -f k8s-deployment.yaml

# Get service endpoint
kubectl -n code-city get svc code-city-frontend-svc
```

---

## Health Checks & Monitoring

### Liveness & Readiness Probes

```yaml
# Already configured in k8s-deployment.yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 8080
  initialDelaySeconds: 40
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 8080
  initialDelaySeconds: 20
  periodSeconds: 5
```

### Prometheus Metrics

```yaml
# Add to k8s-deployment.yaml for monitoring
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: code-city-backend
  namespace: code-city
spec:
  selector:
    matchLabels:
      app: code-city-backend
  endpoints:
  - port: http
    path: /actuator/prometheus
    interval: 30s
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Code City Backend",
    "panels": [
      {
        "title": "Request Latency",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_requests_duration_seconds_bucket)"
          }
        ]
      },
      {
        "title": "Analysis Success Rate",
        "targets": [
          {
            "expr": "rate(analyze_total{status='success'}[5m])"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "targets": [
          {
            "expr": "jvm_memory_used_bytes"
          }
        ]
      }
    ]
  }
}
```

---

## Troubleshooting

### Backend won't start

```bash
# Check logs
kubectl -n code-city logs deployment/code-city-backend

# Common issues:
# - ANTHROPIC_API_KEY not set: kubectl edit secret code-city-secrets
# - Git not installed: Rebuild Docker image
# - Out of memory: Increase Xmx in JAVA_OPTS or pod limits
```

### Frontend shows "Using Mock Data"

```bash
# Verify backend is reachable
kubectl -n code-city port-forward svc/code-city-backend-svc 8080:8080
curl http://localhost:8080/api/health

# Check frontend environment variable
kubectl -n code-city describe deployment code-city-frontend
# VITE_API_BASE_URL should be http://code-city-backend-svc:8080/api
```

### High latency on large repos

```bash
# 1. Check backend resource usage
kubectl top pod -n code-city -l app=code-city-backend

# 2. Increase memory if needed
kubectl -n code-city set resources deployment code-city-backend \
  --limits=memory=2Gi,cpu=1500m \
  --requests=memory=1Gi,cpu=1000m

# 3. Check Kubernetes node resources
kubectl top nodes
kubectl describe nodes | grep -A 5 "Allocated resources"
```

### Pod crashes with OOMKilled

```bash
# Increase memory limit
kubectl -n code-city patch deployment code-city-backend \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","resources":{"limits":{"memory":"2Gi"}}}]}}}}'

# Or recreate with more memory
kubectl delete -f k8s-deployment.yaml
# Edit k8s-deployment.yaml to increase limits
kubectl apply -f k8s-deployment.yaml
```

---

## Rollback & Updates

### Rolling Update

```bash
# Update backend to new image
kubectl -n code-city set image deployment/code-city-backend \
  backend=$REGISTRY/code-city-backend:v1.1.0

# Monitor rollout
kubectl -n code-city rollout status deployment/code-city-backend

# View rollout history
kubectl -n code-city rollout history deployment/code-city-backend
```

### Rollback on Failure

```bash
# Automatic rollback on health check failure
# (readinessProbe will prevent traffic routing)

# Manual rollback
kubectl -n code-city rollout undo deployment/code-city-backend

# Rollback to specific revision
kubectl -n code-city rollout undo deployment/code-city-backend --to-revision=2
```

---

## Cost Optimization (AWS EKS)

```bash
# Use Spot instances for non-critical workloads
eksctl create nodegroup \
  --cluster code-city-prod \
  --name spot-nodes \
  --spot \
  --instance-types t3.large,t3a.large

# Helm chart for cost optimization
helm repo add stable https://charts.helm.sh/stable
helm install karpenter stable/karpenter \
  -n karpenter --create-namespace
```

---

## Production Checklist

- [ ] ANTHROPIC_API_KEY set in secrets
- [ ] Backend health checks passing
- [ ] Frontend can reach backend API
- [ ] TLS certificate configured
- [ ] HPA metrics working (kubectl top pods)
- [ ] Prometheus/Grafana monitoring active
- [ ] Log aggregation (ELK/CloudWatch) set up
- [ ] Rate limiting enabled
- [ ] Cache (Redis) configured
- [ ] Database backups scheduled
- [ ] Disaster recovery plan documented
- [ ] Load testing completed (>100 req/s)
- [ ] Security scanning (OWASP Top 10)
- [ ] Incident response runbook created

