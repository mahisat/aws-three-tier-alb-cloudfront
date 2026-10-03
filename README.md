# AWS Three-Tier Architecture — ALB, ASG, S3, CloudFront

Evolution of the [Part 1 / Part 2](../01-3-tier-basic/) learning stack: same Todo app and RDS MySQL, with production-oriented building blocks for **scalability**, **resilience**, and **simpler frontend delivery**.

## How this differs from `01-3-tier-basic`

| Area | Part 1–2 (`01-3-tier-basic`) | This repo (`02-three-tier-with-ALB`) |
|------|------------------------------|--------------------------------------|
| Frontend | EC2 + nginx (SSH deploy) | **S3** static hosting + **CloudFront** (`/api` → ALB) |
| Backend | Single EC2 in private subnet | **ALB** + **Auto Scaling Group** (private subnets, 2 AZs) |
| API exposure | nginx reverse proxy on frontend EC2 | CloudFront path `/api/*` → ALB → instances |
| CI/CD frontend | SSH + `npm build` on EC2 | **OIDC** → `s3 sync` + CloudFront invalidation |
| CI/CD backend | SSM to one instance | SSM to **all in-service** ASG instances |
| Database | RDS MySQL | **Unchanged** (same Terraform pattern) |

## Architecture

```text
Internet → CloudFront (HTTPS)
              ├─ default: S3 (React static assets)
              └─ /api/*, /health → ALB (public subnets, 2 AZs)
                                        → ASG (private subnets, EC2 :5000)
                                        → RDS MySQL (private subnets)
Private outbound → NAT Gateway → Internet Gateway
```

## Repository structure

| Path | Description |
|------|-------------|
| [`terraform/`](terraform/) | VPC, ALB, ASG, S3, CloudFront, RDS, IAM policy JSON |
| [`frontend/`](frontend/) | React (Vite) SPA — build with `VITE_API_BASE_URL=/api` |
| [`backend/`](backend/) | Express + TypeScript API |
| [`.github/workflows/`](.github/workflows/) | Frontend (S3 + CloudFront) and backend (SSM + OIDC) deploy |

## Prerequisites

- AWS account and IAM permissions ([`terraform/IAM.md`](terraform/IAM.md), [`iam-terraform-least-privilege.json`](terraform/iam-terraform-least-privilege.json))
- [Terraform](https://www.terraform.io/downloads) >= 1.5
- Node.js 20+ for local dev
- **Public** GitHub repo URL in `terraform.tfvars` for backend `git clone` bootstrap

## Quick start — Terraform

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Edit github_repo_url, db_password, project

cd terraform
terraform init
terraform plan
terraform apply

terraform output cloudfront_url
terraform output alb_dns_name
```

Open the **CloudFront URL** from `terraform output cloudfront_url`. After apply, sync the first frontend build to S3 (see [`terraform/IAM.md`](terraform/IAM.md)) or run the GitHub Actions frontend workflow.

When finished: `terraform destroy`.

## Quick start — local dev

```bash
# Backend
cd backend && cp .env.example .env && npm install && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

## GitHub Actions

**Secrets** (repository → Settings → Secrets and variables → Actions):

| Secret | Source |
|--------|--------|
| `AWS_DEPLOY_ROLE_ARN` | IAM OIDC role with `iam-github-deploy-least-privilege.json` |
| `FRONTEND_S3_BUCKET` | `terraform output -raw frontend_s3_bucket` |
| `FRONTEND_CLOUDFRONT_DISTRIBUTION_ID` | `terraform output -raw cloudfront_distribution_id` |
| `FRONTEND_CLOUDFRONT_URL` | `terraform output -raw cloudfront_url` |

Update `BACKEND_INSTANCE_TAG` in [`.github/workflows/backend-deployment.yml`](.github/workflows/backend-deployment.yml) if you change `var.project` (default `my-project-backend-server`).

Part 2 secrets `EC2_PRIVATE_KEY`, `FRONTEND_EC2_PUBLIC_IP`, and `BACKEND_EC2_PRIVATE_IP` are **not used** in this architecture.

## Bootstrap / debug logs (backend EC2)

| Log | Purpose |
|-----|---------|
| `/var/log/cloud-init-output.log` | Launch template user_data |
| `/var/log/backend-setup.log` | Backend bootstrap |
| `journalctl -u todo-backend` | API service |

ALB target health: EC2 console → Target groups → **healthy** on `/health`.

Manual repair: [`terraform/install-backend-service.sh`](terraform/install-backend-service.sh) (run as root on a backend instance via SSM Session Manager).

## Cost warning

**NAT Gateway**, **CloudFront**, **ALB**, and **RDS** bill while resources exist. Destroy the stack when not learning.

## License

MIT (application). Adjust for your fork.
