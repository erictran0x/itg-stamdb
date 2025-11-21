terraform {
	required_providers {
		aws = {
			source  = "hashicorp/aws"
			version = "~> 6.0"
		}

    bonsai = {
      source  = "omc/bonsai"
      version = "~> 1.0"
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

provider "bonsai" {
  alias = "this"
  api_key = var.bonsai_api_key
  api_token = var.bonsai_api_token
}

module "frontend" {
  source = "./modules/frontend"
}

module "backend" {
  source    = "./modules/backend"
  providers = {
    bonsai = bonsai.this
  }
  
  cloudfront_distribution_url = module.frontend.cloudfront_distribution_domain_name
}
