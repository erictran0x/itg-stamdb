from os import environ
import boto3
import json

DYNAMODB_TABLE_NAME = environ['DYNAMODB_TABLE']

dynamodb = boto3.client('dynamodb')

def lambda_handler(event, context):
    response = dynamodb.describe_table(TableName=DYNAMODB_TABLE_NAME)
    return {
        'isBase64Encoded': False,
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({ 'response': response['Table']['ItemCount'] })
    }