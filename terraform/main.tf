terraform {
	required_providers {
		aws = {
			source  = "hashicorp/aws"
			version = "~> 4.0"
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