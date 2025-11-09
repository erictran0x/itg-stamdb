locals {
  function_name = "itg_stamdb_processor"
}

data "archive_file" "lambda_function" {
  type        = "zip"
  source_file = "${path.module}/lambda/${local.function_name}.py"
  output_path = "${path.module}/lambda/${local.function_name}-func.zip"
}

resource "aws_lambda_function" "processor" {
	function_name = "${local.function_name}"
	role          = aws_iam_role.lambda_exec.arn
	handler       = "${local.function_name}.lambda_handler"
	runtime       = "python3.13"
	filename      = data.archive_file.lambda_function.output_path

	source_code_hash = data.archive_file.lambda_function.output_base64sha256

	environment {
		variables = {
			INPUT_BUCKET = aws_s3_bucket.input_bucket.bucket
			FAILED_QUEUE_URL = aws_sqs_queue.failed_queue.id
		}
	}
}

resource "aws_iam_role" "lambda_exec" {
  name = "lambda_exec_role-${local.function_name}"
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

resource "aws_iam_policy" "processor_policy" {
  name        = "ITGStamDBProcessorPolicy"
  description = "Policy for Lambda function to access SQS queues and other things"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Effect   = "Allow"
        Resource = [
          aws_sqs_queue.input_queue.arn,
          aws_sqs_queue.failed_queue.arn
        ]
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.input_bucket.arn,
          "${aws_s3_bucket.input_bucket.arn}/*"
        ]
      }
    ]
  })
}