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

resource "aws_s3_bucket_notification" "input_notification" {
	bucket = aws_s3_bucket.input_bucket.id

	# TODO create sqs queue
}