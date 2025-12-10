terraform {
  required_providers {
    opensearch = {
      source  = "opensearch-project/opensearch"
      version = "~> 2.0"
    }
  }
}

provider "opensearch" {
  url = var.opensearch_settings.url

  username = var.opensearch_settings.user
  password = var.opensearch_settings.pass
}
