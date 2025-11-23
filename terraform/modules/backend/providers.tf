terraform {
  required_providers {
    opensearch = {
      source  = "opensearch-project/opensearch"
      version = "~> 2.0"
    }
  }
}

provider "opensearch" {
  url = var.opensearch_url

  username = var.opensearch_user
  password = var.opensearch_pass
}