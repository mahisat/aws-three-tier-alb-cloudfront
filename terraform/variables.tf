variable "project" {
  type        = string
  description = "Project name used for resource naming"
  default     = "my-project"
}

variable "region" {
  type        = string
  description = "AWS region"
  default     = "us-east-1"
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR block"
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  type        = string
  description = "Public subnet CIDR (AZ a) for ALB"
  default     = "10.0.1.0/24"
}

variable "public_subnet_cidr_2" {
  type        = string
  description = "Public subnet CIDR (AZ b) for ALB"
  default     = "10.0.4.0/24"
}

variable "private_subnet_cidr" {
  type        = string
  description = "Primary private subnet CIDR block"
  default     = "10.0.2.0/24"
}

variable "private_subnet_cidr_2" {
  type        = string
  description = "Secondary private subnet CIDR block (required for RDS subnet group and ASG)"
  default     = "10.0.3.0/24"
}

variable "db_name" {
  type        = string
  description = "MySQL database name"
  default     = "todo_app"
}

variable "db_username" {
  type        = string
  description = "MySQL master username"
  default     = "dbadmin"
}

variable "db_password" {
  type        = string
  description = "MySQL master password"
  sensitive   = true
}

variable "github_repo_url" {
  type        = string
  description = "Public GitHub repository URL cloned on backend EC2 instances at boot"
}

variable "backend_instance_type" {
  type        = string
  description = "EC2 instance type for backend ASG"
  default     = "t3.micro"
}

variable "asg_min_size" {
  type        = number
  description = "Minimum backend instances in the Auto Scaling Group"
  default     = 1
}

variable "asg_max_size" {
  type        = number
  description = "Maximum backend instances in the Auto Scaling Group"
  default     = 2
}

variable "asg_desired_capacity" {
  type        = number
  description = "Desired backend instances in the Auto Scaling Group"
  default     = 1
}

variable "upload_frontend_assets" {
  type        = bool
  description = "Upload built files from ../frontend/dist into the S3 bucket. Build first: cd frontend && npm ci && npm run build (with VITE_API_BASE_URL=/api)."
  default     = false
}
