resource "opensearch_index" "charts" {
  name = "charts"

  analysis_tokenizer = jsonencode({
    my_edge_ngram_tokenizer = {
      type        = "edge_ngram"
      min_gram    = 2
      max_gram    = 25
      token_chars = ["letter", "digit", "symbol"]
    }
  })

  analysis_analyzer = jsonencode({
    my_custom_analyzer = {
      tokenizer = "my_edge_ngram_tokenizer"
      filter    = ["lowercase"]
    }
  })

  number_of_shards   = "1"
  number_of_replicas = "1"

  mappings = jsonencode({
    properties = {
      chart_hash = {
        type = "text"
      }
      title = {
        type = "text"
        fields = {
          autocomplete = {
            type     = "text"
            analyzer = "my_custom_analyzer"
          }
        }
      }
    }
  })
}
