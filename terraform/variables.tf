variable "opensearch_user" {
  type = string
}

variable "opensearch_pass" {
  type      = string
  sensitive = true
}

variable "opensearch_url" {
  type = string
}
