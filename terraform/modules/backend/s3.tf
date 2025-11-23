##############################
# INPUT BUCKET CONFIGURATION #
##############################

resource "aws_s3_bucket" "input_bucket" {
	bucket = "itg-stamdb-input"
}

resource "aws_s3_bucket_lifecycle_configuration" "input_lifecycle" {
	bucket = aws_s3_bucket.input_bucket.id

	rule {
		id 			= "ExpireAllInOneDay"
		status 	= "Enabled"

		expiration {
			days = 1
		}
	}
}

resource "aws_s3_bucket_notification" "input_notifications" {
  bucket = aws_s3_bucket.input_bucket.id

  dynamic "queue" {
    for_each = toset([".sm", ".ssc"])
    content {
      id = "add-to-queue-on-${queue.value}-file-upload"
      queue_arn     = aws_sqs_queue.input_queue.arn
      events        = ["s3:ObjectCreated:*"]
      filter_suffix = queue.value
    }
  }
}

###############################
# OUTPUT BUCKET CONFIGURATION #
###############################

resource "aws_s3_bucket" "output_bucket" {
  bucket = "itg-stamdb-output"
}

resource "aws_s3_bucket_public_access_block" "output_public_access" {
  bucket = aws_s3_bucket.output_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_versioning" "output_versioning" {
  bucket = aws_s3_bucket.output_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}