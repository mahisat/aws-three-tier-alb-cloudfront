resource "aws_launch_template" "backend" {
  name_prefix   = "${var.project}-backend-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = var.backend_instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_ssm.name
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.backend_server_security_group.id]
  }

  user_data = base64encode(templatefile("${path.module}/backend-setup.sh", {
    github_repo  = var.github_repo_url
    db_endpoint  = aws_db_instance.database.address
    db_name      = var.db_name
    db_user      = var.db_username
    db_password  = var.db_password
    systemd_unit = file("${path.module}/todo-backend.service")
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project}-backend-server"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "backend" {
  name                      = "${var.project}-backend-asg"
  vpc_zone_identifier       = [aws_subnet.private_subnet.id, aws_subnet.private_subnet_2.id]
  target_group_arns         = [aws_lb_target_group.backend.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity

  launch_template {
    id      = aws_launch_template.backend.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.project}-backend-asg"
    propagate_at_launch = false
  }

  depends_on = [aws_db_instance.database]
}
