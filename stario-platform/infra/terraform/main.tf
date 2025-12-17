# Stario Platform - Terraform Infrastructure
# Supports AWS, but can be adapted for other clouds

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.24"
    }
  }

  backend "s3" {
    bucket         = "stario-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "stario-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Stario"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# =============================================================================
# VPC
# =============================================================================
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.4.0"

  name = "stario-${var.environment}"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  enable_nat_gateway     = true
  single_nat_gateway     = var.environment != "production"
  enable_dns_hostnames   = true
  enable_dns_support     = true

  tags = {
    "kubernetes.io/cluster/stario-${var.environment}" = "shared"
  }

  public_subnet_tags = {
    "kubernetes.io/cluster/stario-${var.environment}" = "shared"
    "kubernetes.io/role/elb"                          = 1
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/stario-${var.environment}" = "shared"
    "kubernetes.io/role/internal-elb"                 = 1
  }
}

# =============================================================================
# EKS Cluster
# =============================================================================
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.21.0"

  cluster_name    = "stario-${var.environment}"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    # General purpose nodes
    general = {
      name           = "general"
      instance_types = var.node_instance_types
      min_size       = var.node_min_size
      max_size       = var.node_max_size
      desired_size   = var.node_desired_size

      labels = {
        role = "general"
      }
    }

    # GPU nodes for AI workloads
    gpu = {
      name           = "gpu"
      instance_types = ["g4dn.xlarge"]
      min_size       = 0
      max_size       = 4
      desired_size   = var.environment == "production" ? 2 : 0

      labels = {
        role = "gpu"
        gpu  = "true"
      }

      taints = [
        {
          key    = "nvidia.com/gpu"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      ]
    }
  }

  # IRSA for AWS services
  enable_irsa = true
}

# =============================================================================
# RDS PostgreSQL
# =============================================================================
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.3.0"

  identifier = "stario-${var.environment}"

  engine               = "postgres"
  engine_version       = "15.4"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage

  db_name  = "stario"
  username = "stario"
  port     = 5432

  multi_az               = var.environment == "production"
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 7
  skip_final_snapshot     = var.environment != "production"
  deletion_protection     = var.environment == "production"

  performance_insights_enabled = var.environment == "production"

  parameters = [
    {
      name  = "log_statement"
      value = "all"
    }
  ]
}

resource "aws_security_group" "rds" {
  name_prefix = "stario-rds-${var.environment}"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
  }
}

# =============================================================================
# ElastiCache Redis
# =============================================================================
resource "aws_elasticache_subnet_group" "redis" {
  name       = "stario-redis-${var.environment}"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "stario-${var.environment}"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]
}

resource "aws_security_group" "redis" {
  name_prefix = "stario-redis-${var.environment}"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
  }
}

# =============================================================================
# S3 Buckets
# =============================================================================
resource "aws_s3_bucket" "uploads" {
  bucket = "stario-${var.environment}-uploads"
}

resource "aws_s3_bucket" "generated" {
  bucket = "stario-${var.environment}-generated"
}

resource "aws_s3_bucket" "assets" {
  bucket = "stario-${var.environment}-assets"
}

# Lifecycle rules for compliance
resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "ephemeral-cleanup"
    status = "Enabled"

    filter {
      prefix = "face-quiz/"
    }

    expiration {
      days = 1
    }
  }
}

# =============================================================================
# Outputs
# =============================================================================
output "vpc_id" {
  value = module.vpc.vpc_id
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  value = module.rds.db_instance_endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "s3_uploads_bucket" {
  value = aws_s3_bucket.uploads.bucket
}
