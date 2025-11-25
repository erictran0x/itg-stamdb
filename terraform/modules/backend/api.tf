resource "aws_apigatewayv2_api" "this" {
  name = "itgstamdb-http-api"

  protocol_type = "HTTP"

  cors_configuration {
    allow_methods = ["GET", "POST"]
    allow_origins = ["*"]
  }
}

resource "aws_apigatewayv2_integration" "search_title" {
  api_id = aws_apigatewayv2_api.this.id

  integration_method = "POST"
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.functions["itg_stamdb_search_query"].invoke_arn

  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "query" {
  api_id = aws_apigatewayv2_api.this.id

  integration_method = "POST"
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.functions["itg_stamdb_db_queryratingsortbpm"].invoke_arn

  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "get_by_hashes" {
  api_id = aws_apigatewayv2_api.this.id

  integration_method = "POST"
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.functions["itg_stamdb_db_batchgetitem"].invoke_arn

  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "search_title" {
  api_id = aws_apigatewayv2_api.this.id

  route_key = "GET /search-title"
  target    = "integrations/${aws_apigatewayv2_integration.search_title.id}"
}

resource "aws_apigatewayv2_route" "query" {
  api_id = aws_apigatewayv2_api.this.id

  route_key = "GET /query"
  target    = "integrations/${aws_apigatewayv2_integration.query.id}"
}

resource "aws_apigatewayv2_route" "get_by_hashes" {
  api_id = aws_apigatewayv2_api.this.id

  route_key = "POST /get-by-hashes"
  target    = "integrations/${aws_apigatewayv2_integration.get_by_hashes.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id = aws_apigatewayv2_api.this.id

  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "permissions" {
  for_each = toset([
    "itg_stamdb_db_batchgetitem",
    "itg_stamdb_db_queryratingsortbpm",
    "itg_stamdb_search_query"
  ])

  source_arn = "${aws_apigatewayv2_api.this.execution_arn}/*/*"

  statement_id  = "AllowExecutionFromAPIGateway-${each.value}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.functions[each.value].function_name
  principal     = "apigateway.amazonaws.com"
}

output "api" {
  value = {
    endpoint = split("://", aws_apigatewayv2_api.this.api_endpoint)[1]
    name     = aws_apigatewayv2_stage.default.name
  }
}
