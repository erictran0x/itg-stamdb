variable "opensearch_settings" {
  type = object({
    user = string
    pass = string
    url  = string
  })
}
