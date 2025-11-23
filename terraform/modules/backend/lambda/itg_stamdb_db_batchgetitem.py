from decimal import Decimal
from os import environ
import boto3
import json

DYNAMODB_TABLE_NAME = environ['DYNAMODB_TABLE']
HASHES_BODY_KEY = 'chart_hashes'

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

def create_request_items(chart_hashes: list[str]):
    return { DYNAMODB_TABLE_NAME: {
        'Keys': [
            {'chart_hash': x} for x in chart_hashes
        ],
        'ConsistentRead': False
    }} if len(chart_hashes) > 0 else None

def convert_dynamodb_record(dynamodb_image):
    if not dynamodb_image:
        return {}

    def _deserialize_attribute(attr_value):
        if isinstance(attr_value, Decimal):
            attr_value = int(attr_value) if attr_value == attr_value.to_integral_value() else float(attr_value)
        return attr_value

    return {
        k: _deserialize_attribute(v)
        for k, v in dynamodb_image.items()
    }

def lambda_handler(event, context):
    body = json.loads(event['body'])
    if HASHES_BODY_KEY not in body:
        return {
            'isBase64Encoded': False,
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({ 'error': f'{HASHES_BODY_KEY} body key not found' })
        }
    chart_hashes = body[HASHES_BODY_KEY]
    db_response = dynamodb.batch_get_item(RequestItems=create_request_items(chart_hashes))
    response = {}
    if 'Responses' in db_response and DYNAMODB_TABLE_NAME in db_response['Responses']:
        response['entries'] = list(map(
            convert_dynamodb_record,
            db_response['Responses'][DYNAMODB_TABLE_NAME]
        ))
    if 'UnprocessedKeys' in db_response and db_response['UnprocessedKeys']:
        response['unprocessed'] = list(map(
            lambda x: x['chart_hash']['S'],
            db_response['UnprocessedKeys'][DYNAMODB_TABLE_NAME]['Keys']
        ))
    return {
        'isBase64Encoded': False,
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({ 'response': response })
    }