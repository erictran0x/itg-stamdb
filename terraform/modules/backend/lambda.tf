locals {
  opensearch_index_name = "charts"

  dependencies = {
    opensearchpy             = null
    stamina-breakdown-parser = null
  }

  functions = { # layers and environment vars go here
    itg_stamdb_db_batchgetitem = {
      environment = {
        DYNAMODB_TABLE = aws_dynamodb_table.this.name
      }
    }
    itg_stamdb_db_itemcount = {
      environment = {
        DYNAMODB_TABLE = aws_dynamodb_table.this.name
      }
    }
    itg_stamdb_db_queryratingsortbpm = {
      environment = {
        DYNAMODB_TABLE = aws_dynamodb_table.this.name
      }
    }
    itg_stamdb_search_dbstream_trigger = {
      layers = ["opensearchpy"]
      environment = {
        OPENSEARCH_HOST  = var.opensearch_url
        OPENSEARCH_PORT  = 443
        OPENSEARCH_USER  = var.opensearch_user
        OPENSEARCH_PASS  = var.opensearch_pass
        OPENSEARCH_INDEX = local.opensearch_index_name
      }
    }
    itg_stamdb_search_query = {
      layers = ["opensearchpy"]
      environment = {
        OPENSEARCH_HOST  = var.opensearch_url
        OPENSEARCH_PORT  = 443
        OPENSEARCH_USER  = var.opensearch_user
        OPENSEARCH_PASS  = var.opensearch_pass
        OPENSEARCH_INDEX = local.opensearch_index_name
        DYNAMODB_TABLE   = aws_dynamodb_table.this.name
      }
    }
    itg_stamdb_processor = {
      layers  = ["stamina-breakdown-parser"]
      timeout = 60
      environment = {
        S3_BUCKET_OUTPUT = aws_s3_bucket.output.bucket
        FAILED_QUEUE_URL = aws_sqs_queue.failed.id
        DYNAMODB_TABLE   = aws_dynamodb_table.this.name
      }
    }
  }

  function_policies = {            # had to separate them because local.functions is determined dynamically
    itg_stamdb_db_batchgetitem = { # allow dynamodb reads
      name        = "ITGStamDBBatchGetItemPolicy"
      description = "Policy for Lambda function to perform batchgetitem"
      policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
          {
            Effect = "Allow"
            Action = [
              "dynamodb:BatchGetItem",
              "dynamodb:GetItem"
            ]
            Resource = aws_dynamodb_table.this.arn
          }
        ]
      })
    }
    itg_stamdb_db_itemcount = {
      name        = "ITGStamDBItemCountPolicy"
      description = "Policy for Lambda function to perform describe table for item count"
      policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
          {
            Effect = "Allow"
            Action = [
              "dynamodb:DescribeTable"
            ]
            Resource = aws_dynamodb_table.this.arn
          }
        ]
      })
    }
    itg_stamdb_db_queryratingsortbpm = { # allow dynamodb reads
      name        = "ITGStamDBQueryRatingSortBPMPolicy"
      description = "Policy for Lambda function to perform query"
      policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
          {
            Effect = "Allow"
            Action = [
              "dynamodb:Query"
            ]
            Resource = [
              aws_dynamodb_table.this.arn,
              "${aws_dynamodb_table.this.arn}/index/*"
            ]
          }
        ]
      })
    }
    itg_stamdb_search_dbstream_trigger = {
      name        = "ITGStamDBSearchTrigger"
      description = "Policy for Lambda function to get dynamodb stream data"
      policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
          {
            Effect = "Allow"
            Action = [
              "dynamodb:DescribeStream",
              "dynamodb:GetRecords",
              "dynamodb:GetShardIterator"
            ],
            Resource = aws_dynamodb_table.this.stream_arn
          },
          {
            Effect = "Allow"
            Action = [
              "dynamodb:ListStreams"
            ],
            Resource = "*"
          }
        ]
      })
    }
    itg_stamdb_search_query = { # allow dynamodb reads
      name        = "ITGStamDBSearchQuery"
      description = "Policy for Lambda function to perform batchgetitem"
      policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
          {
            Effect = "Allow"
            Action = [
              "dynamodb:BatchGetItem",
              "dynamodb:GetItem"
            ]
            Resource = aws_dynamodb_table.this.arn
          }
        ]
      })
    }
    itg_stamdb_processor = { # allow sqs read/writes, logs writes, s3 input reads, s3 output writes, dynamodb writes
      name        = "ITGStamDBProcessorPolicy"
      description = "Policy for Lambda function to access SQS queues and other things"
      policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
          {
            Effect = "Allow"
            Action = [
              "sqs:ReceiveMessage",
              "sqs:DeleteMessage",
              "sqs:GetQueueAttributes"
            ]
            Resource = [
              aws_sqs_queue.input.arn,
              aws_sqs_queue.failed.arn
            ]
          },
          {
            Effect = "Allow"
            Action = [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ]
            Resource = "arn:aws:logs:*:*:*"
          },
          {
            Effect = "Allow"
            Action = [
              "s3:GetObject",
              "s3:ListBucket"
            ]
            Resource = [
              aws_s3_bucket.input.arn,
              "${aws_s3_bucket.input.arn}/*"
            ]
          },
          {
            Effect = "Allow"
            Action = [
              "s3:PutObject"
            ]
            Resource = [
              aws_s3_bucket.output.arn,
              "${aws_s3_bucket.output.arn}/*"
            ]
          },
          {
            Effect = "Allow"
            Action = [
              "dynamodb:BatchWriteItem",
              "dynamodb:PutItem"
            ]
            Resource = aws_dynamodb_table.this.arn
          }
        ]
      })
    }
  }
}

data "archive_file" "lambda_functions" {
  for_each = local.functions

  type        = "zip"
  source_file = "${path.module}/lambda/${each.key}.py"
  output_path = "${path.module}/lambda/${each.key}-func.zip"
}

resource "aws_lambda_layer_version" "dependencies" {
  for_each = local.dependencies

  filename   = "${path.module}/lambda_layers/${each.key}.zip"
  layer_name = each.key

  compatible_runtimes = ["python3.13"]
  source_code_hash    = filebase64sha256("${path.module}/lambda_layers/${each.key}.zip")
}

resource "aws_lambda_function" "functions" {
  for_each = local.functions

  function_name = each.key
  role          = aws_iam_role.lambda_execs[each.key].arn
  handler       = "${each.key}.lambda_handler"
  runtime       = "python3.13"
  filename      = data.archive_file.lambda_functions[each.key].output_path
  layers        = [for name in lookup(each.value, "layers", []) : aws_lambda_layer_version.dependencies[name].arn]
  timeout       = lookup(each.value, "timeout", 3)

  source_code_hash = data.archive_file.lambda_functions[each.key].output_base64sha256

  environment {
    variables = lookup(each.value, "environment", {})
  }
}

resource "aws_iam_role" "lambda_execs" {
  for_each = local.functions

  name = "lambda_exec_role-${each.key}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "policies" {
  for_each = local.function_policies

  name        = each.value["name"]
  description = each.value["description"]
  policy      = each.value["policy"]
}

resource "aws_iam_role_policy_attachment" "customer_managed" {
  for_each = local.function_policies

  role       = aws_iam_role.lambda_execs[each.key].name
  policy_arn = aws_iam_policy.policies[each.key].arn
}

resource "aws_iam_role_policy_attachment" "basic_exec_roles" {
  for_each = local.function_policies

  role       = aws_iam_role.lambda_execs[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
