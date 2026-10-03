# AWS Three-Tier Architecture — ALB, ASG, S3, CloudFront

Evolution of the Part 1–2 learning stack ([`AWS Three Tier Basic`](https://github.com/mahisat/aws-basic-3-tier-architecture)): same Todo app and RDS MySQL, with production-oriented building blocks for **scalability**, **resilience**, and **simpler frontend delivery**.

## Documentation (Zero to Hero blog)

Step-by-step guides for Terraform, OIDC, and the original EC2-based stack are on **[Zero to Hero Terraform AWS](https://mahisat.github.io/terraform-aws-zero-to-hero/)** (GitHub Pages). Use this repo’s README for the **ALB + S3 + CloudFront** layout; follow the blog for shared concepts (VPC, RDS, IAM, GitHub Actions).

| Topic | Link |
|--------|------|
| Series home | [mahisat.github.io/terraform-aws-zero-to-hero](https://mahisat.github.io/terraform-aws-zero-to-hero/) |
| Part 1 — Terraform + AWS | [Three-tier with Terraform](https://mahisat.github.io/terraform-aws-zero-to-hero/posts/part-1-terraform-aws-three-tier/) |
| Part 2 — GitHub Actions + OIDC | [CI/CD without long-lived keys](https://mahisat.github.io/terraform-aws-zero-to-hero/posts/part-2-github-actions-oidc/) |
| Appendix — files deep dive | [Terraform & project files](https://mahisat.github.io/terraform-aws-zero-to-hero/reference/appendix-terraform-and-project-files/) |
| Linux commands | [Reference](https://mahisat.github.io/terraform-aws-zero-to-hero/reference/linux-commands-reference/) |

The blog lists **ALB / HTTPS / Multi-AZ** as coming soon; this repository is that production-oriented variant.

## How this differs from [AWS Three Tier Basic](https://github.com/mahisat/aws-basic-3-tier-architecture)

| Area | Part 1–2 ([AWS Three Tier Basic](https://github.com/mahisat/aws-basic-3-tier-architecture)) | This repo (`02-three-tier-with-ALB`) |
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

- Completed or skimmed [Part 1](https://mahisat.github.io/terraform-aws-zero-to-hero/posts/part-1-terraform-aws-three-tier/) and [Part 2](https://mahisat.github.io/terraform-aws-zero-to-hero/posts/part-2-github-actions-oidc/) (recommended)
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

**Terraform does not upload your React app** — it only creates the empty S3 bucket and CloudFront distribution. Upload static files once after apply:

```powershell
# Windows (from repo root; AWS CLI credentials required)
.\scripts\publish-frontend.ps1
```

```bash
# Linux / macOS / Git Bash
chmod +x scripts/publish-frontend.sh && ./scripts/publish-frontend.sh
```

Alternatively: run the **Deploy Frontend** GitHub Actions workflow, or set `upload_frontend_assets = true` in `terraform.tfvars` **after** `cd frontend && npm ci && npm run build`, then `terraform apply` again.

Open the **CloudFront URL** from `terraform output cloudfront_url` (expect errors until the bucket has `index.html`).

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

Part 2 secrets `EC2_PRIVATE_KEY`, `FRONTEND_EC2_PUBLIC_IP`, and `BACKEND_EC2_PRIVATE_IP` are **not used** in this architecture. OIDC setup is covered in [Part 2](https://mahisat.github.io/terraform-aws-zero-to-hero/posts/part-2-github-actions-oidc/).

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

This project is licensed under the [Apache License, Version 2.0](LICENSE). See the [LICENSE](LICENSE) file for the full text.