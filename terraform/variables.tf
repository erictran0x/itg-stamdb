variable "opensearch_settings" {
  type = object({
    user = string
    pass = string
    url  = string
  })
  sensitive = true
}

variable "github_token" {
  type      = string
  sensitive = true
}
