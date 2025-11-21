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
            {'chart_hash': {'S': x}} for x in chart_hashes
        ],
        'ConsistentRead': False
    }} if len(chart_hashes) > 0 else None

def convert_dynamodb_record(dynamodb_image):
    if not dynamodb_image:
        return {}

    def _deserialize_attribute(attr_value):
        if 'S' in attr_value:
            return attr_value['S']
        elif 'N' in attr_value:
            val = attr_value['N']
            if '.' in val:
                return float(val)
            return int(val)
        elif 'BOOL' in attr_value:
            return attr_value['BOOL']
        elif 'NULL' in attr_value:
            return None
        elif 'L' in attr_value:
            return [_deserialize_attribute(v) for v in attr_value['L']]
        elif 'M' in attr_value:
            return {k: _deserialize_attribute(v) for k, v in attr_value['M'].items()}
        return None

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
    db_response = dynamodb.batch_get_item(create_request_items(chart_hashes))
    response = {}
    if 'Responses' in db_response and DYNAMODB_TABLE_NAME in db_response['Responses']:
        response['entries'] = list(map(
            convert_dynamodb_record,
            db_response['Responses'][DYNAMODB_TABLE_NAME]
        ))
    if 'UnprocessedKeys' in db_response and db_response['UnprocessedKeys']:
        response['unprocessed'] = list(map(
            lambda x: x['chart_hash']['S'],
            db_response['UnprocessedKeys'][DYNAMODB_TABLE_NAME]
        ))
    return {
        'isBase64Encoded': False,
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({ 'response': response })
    }