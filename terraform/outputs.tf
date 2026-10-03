output "cloudfront_url" {
  description = "HTTPS URL for the Todo app (S3 static site + /api via ALB)"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (GitHub secret FRONTEND_CLOUDFRONT_DISTRIBUTION_ID)"
  value       = aws_cloudfront_distribution.frontend.id
}

output "frontend_s3_bucket" {
  description = "S3 bucket for built frontend assets (GitHub secret FRONTEND_S3_BUCKET)"
  value       = aws_s3_bucket.frontend.id
}

output "alb_dns_name" {
  description = "Public DNS name of the API Application Load Balancer (direct HTTP access for debugging)"
  value       = aws_lb.api.dns_name
}

output "backend_asg_name" {
  description = "Auto Scaling Group name for backend instances"
  value       = aws_autoscaling_group.backend.name
}

output "rds_endpoint" {
  description = "RDS MySQL connection endpoint (host:port)"
  value       = aws_db_instance.database.endpoint
  sensitive   = true
}

output "backend_instance_tag_name" {
  description = "EC2 Name tag on backend instances (used by GitHub Actions SSM deploy)"
  value       = "${var.project}-backend-server"
}
