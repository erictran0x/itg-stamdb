resource "aws_dynamodb_table" "this" {
  name = "itgstamdb-breakdowns"

  billing_mode  = "PAY_PER_REQUEST"

  hash_key = "chart_hash"

  stream_enabled    = true
  stream_view_type  = "NEW_IMAGE"

  global_secondary_index {
    name = "QueryRating_SortBpm"

    hash_key  = "rating"
    range_key = "bpm"
    projection_type = "ALL"
  }

  attribute {
    name = "chart_hash"
    type = "S"
  }

  attribute {
    name = "rating"
    type = "N"
  }

  attribute {
    name = "bpm"
    type = "N"
  }
}