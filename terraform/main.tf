terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
  backend "s3" {
    bucket = "terraform-states-erictran"
    key    = "itg-stamdb/terraform.tfstate"
    region = "us-west-1"

    assume_role = {
      role_arn = "arn:aws:iam::058264485635:role/terraform"
    }
  }
}

provider "aws" {
  alias  = "us_west_1"
  region = "us-west-1"
}

module "frontend" {
  source = "./modules/frontend"

  api = module.backend.api
}

module "backend" {
  source = "./modules/backend"

  opensearch_settings = var.opensearch_settings
  github_token        = var.github_token
}
