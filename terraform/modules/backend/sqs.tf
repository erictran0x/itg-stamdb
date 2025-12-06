resource "aws_sqs_queue" "input" {
  name = "itg-stamdb-input-queue"

  visibility_timeout_seconds = 240
}

resource "aws_sqs_queue" "failed" {
  name = "itg-stamdb-failed-queue"
}

resource "aws_sqs_queue_policy" "input_policy" {
  queue_url = aws_sqs_queue.input.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.input.arn
      Condition = {
        ArnLike = {
          "aws:SourceArn" = aws_s3_bucket.input.arn
        }
      }
    }]
  })
}

resource "aws_lambda_event_source_mapping" "input_trigger" {
  event_source_arn = aws_sqs_queue.input.arn
  function_name    = aws_lambda_function.functions["itg_stamdb_processor"].arn

  batch_size              = 10
  function_response_types = ["ReportBatchItemFailures"]

  maximum_batching_window_in_seconds = 10
}

resource "aws_sqs_queue_redrive_policy" "failed_policy" {
  queue_url = aws_sqs_queue.input.id

  redrive_policy = jsonencode({
    maxReceiveCount     = 5
    deadLetterTargetArn = aws_sqs_queue.failed.arn
  })
}

resource "aws_sqs_queue_redrive_allow_policy" "failed_allow_policy" {
  queue_url = aws_sqs_queue.failed.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [aws_sqs_queue.input.arn]
  })
}
