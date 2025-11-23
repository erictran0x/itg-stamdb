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
}

module "backend" {
  source    = "./modules/backend"
  
  cloudfront_distribution_url = module.frontend.cloudfront_distribution_domain_name

  opensearch_url = var.opensearch_url
  opensearch_user = var.opensearch_user
  opensearch_pass = var.opensearch_pass
}
