##############################
# INPUT BUCKET CONFIGURATION #
##############################

resource "aws_s3_bucket" "input" {
  bucket = "itg-stamdb-input"
}

resource "aws_s3_bucket_lifecycle_configuration" "input_lifecycle" {
  bucket = aws_s3_bucket.input.id

  rule {
    id     = "ExpireAllInOneDay"
    status = "Enabled"

    expiration {
      days = 1
    }
  }
}

resource "aws_s3_bucket_notification" "input_notifications" {
  bucket = aws_s3_bucket.input.id

  dynamic "queue" {
    for_each = toset([".sm", ".ssc"])
    content {
      id            = "add-to-queue-on-${queue.value}-file-upload"
      queue_arn     = aws_sqs_queue.input.arn
      events        = ["s3:ObjectCreated:*"]
      filter_suffix = queue.value
    }
  }
}

###############################
# OUTPUT BUCKET CONFIGURATION #
###############################

resource "aws_s3_bucket" "output" {
  bucket = "itg-stamdb-output"
}

resource "aws_s3_bucket_cors_configuration" "output_cors" {
  bucket = aws_s3_bucket.output.id

  cors_rule {
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
  }
}

resource "aws_s3_bucket_public_access_block" "output_public_access" {
  bucket = aws_s3_bucket.output.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "output_policy" {
  bucket = aws_s3_bucket.output.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Principal = "*"
        Resource = [
          aws_s3_bucket.output.arn,
          "${aws_s3_bucket.output.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_s3_bucket_versioning" "output_versioning" {
  bucket = aws_s3_bucket.output.id

  versioning_configuration {
    status = "Enabled"
  }
}
