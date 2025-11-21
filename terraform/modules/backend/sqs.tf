resource "aws_sqs_queue" "input_queue" {
	name = "itg-stamdb-input-queue"

	visibility_timeout_seconds = 30
}

resource "aws_sqs_queue" "failed_queue" {
	name = "itg-stamdb-failed-queue"
}

resource "aws_sqs_queue_policy" "input_queue_policy" {
  queue_url = aws_sqs_queue.input_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.input_queue.arn
      Condition = {
        ArnLike = {
          "aws:SourceArn" = aws_s3_bucket.input_bucket.arn
        }
      }
    }]
  })
}

resource "aws_sqs_queue_redrive_policy" "failed_queue_policy" {
	queue_url = aws_sqs_queue.input_queue.id

	redrive_policy = jsonencode({
		maxReceiveCount     = 1
		deadLetterTargetArn = aws_sqs_queue.failed_queue.arn
	})
}

resource "aws_sqs_queue_redrive_allow_policy" "failed_queue_allow_policy" {
	queue_url = aws_sqs_queue.failed_queue.id

	redrive_allow_policy = jsonencode({
		redrivePermission = "byQueue"
		sourceQueueArns  	= [aws_sqs_queue.input_queue.arn]
	})
}