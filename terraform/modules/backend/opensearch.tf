resource "opensearch_index" "charts" {
  name = "charts"

  mappings = jsonencode({
    properties = {
      chart_hash = {
        type = "text"
      }
      title = {
        type = "text"
      }
    }
  })
}