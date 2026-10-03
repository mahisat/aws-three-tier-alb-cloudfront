# Terraform IAM (least privilege)

This stack creates VPC, NAT, **Application Load Balancer**, **Auto Scaling Group** (backend), **S3 + CloudFront** (frontend), RDS MySQL, and an EC2 instance profile for SSM.

## Policies in this repo

| File | Use |
|------|-----|
| `iam-terraform-least-privilege.json` | IAM user or GitHub OIDC role for `terraform plan` / `terraform apply` |
| `iam-github-deploy-least-privilege.json` | GitHub OIDC role for **frontend** (S3 + CloudFront) and **backend** (SSM) deploy workflows |

Replace `my-project` and `YOUR_ACCOUNT_ID` in IAM resource ARNs if you change `var.project` or account.

## Terraform runner (`AWS_TERRAFORM_ROLE_ARN`)

Attach `iam-terraform-least-privilege.json` (adjust project prefix) plus:

- **Trust policy**: GitHub OIDC `token.actions.githubusercontent.com` for your repo/branch.
- **`iam:PassRole`**: scoped to `${project}-ec2-ssm-role` only (already in the JSON).

### Service actions (summary)

| AWS service | Why |
|-------------|-----|
| **EC2 (VPC)** | VPC, subnets (public ×2, private ×2), IGW, route tables, NAT gateway, EIP, security groups |
| **EC2 / Launch templates** | Backend launch template and ASG instances |
| **Elastic Load Balancing** | Internet-facing ALB, target group, listener |
| **Auto Scaling** | Backend ASG |
| **S3** | Private frontend bucket, bucket policy for CloudFront OAC |
| **CloudFront** | Distribution (S3 + ALB origins), OAC |
| **EC2 Describe** | AMI/AZ lookups |
| **RDS** | DB instance, DB subnet group, tags |
| **IAM** | Create/delete instance profile + role; attach `AmazonSSMManagedInstanceCore` |

No S3/DynamoDB permissions are included for **Terraform state** (local state). If you add a remote backend, extend the policy with scoped S3 and `dynamodb:PutItem` / `GetItem` / `DeleteItem` on the lock table.

## Deploy runner (`AWS_DEPLOY_ROLE_ARN`)

Attach `iam-github-deploy-least-privilege.json` to the same OIDC role used in Part 2, or create a dedicated deploy role.

Both workflows use **OIDC** — no long-lived AWS access keys. Frontend deploy no longer uses SSH.

Optional hardening: replace `"Resource": "*"` on `ssm:SendCommand` with specific instance ARNs or a tag condition on `aws:ResourceTag/Name`.

## After apply

1. `terraform output -raw frontend_s3_bucket` → GitHub secret `FRONTEND_S3_BUCKET`.
2. `terraform output -raw cloudfront_distribution_id` → `FRONTEND_CLOUDFRONT_DISTRIBUTION_ID`.
3. `terraform output -raw cloudfront_url` → `FRONTEND_CLOUDFRONT_URL` (include `https://`, no trailing slash).
4. `terraform output -raw backend_instance_tag_name` → set `BACKEND_INSTANCE_TAG` in `.github/workflows/backend-deployment.yml` env (or use a repo variable).
5. Configure OIDC trust + `AWS_DEPLOY_ROLE_ARN` secret (same pattern as Part 2).

Upload the initial frontend build once (or run the frontend workflow after secrets are set):

```bash
cd frontend && printf 'VITE_API_BASE_URL=/api\n' > .env.production && npm ci && npm run build
aws s3 sync dist/ s3://$(terraform output -raw frontend_s3_bucket)/ --delete
```
