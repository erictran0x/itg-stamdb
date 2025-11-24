from decimal import Decimal
from os import environ
from boto3.dynamodb.conditions import Key
import boto3
import json

DYNAMODB_TABLE_NAME = environ['DYNAMODB_TABLE']

RATING_PARAM = 'rating'
BPM_FROM_PARAM = 'bpm_from'
BPM_TO_PARAM = 'bpm_to'
INDEX_NAME = 'QueryRating_SortBpm'

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            obj_str = str(obj)
            if '.' in obj_str:
                return float(obj_str)
            return int(obj_str)
        return json.JSONEncoder.default(self, obj)
    
def get_missing_params(query_params):
    required = { RATING_PARAM, BPM_FROM_PARAM }
    if query_params is None:
        return list(required)
    for param in query_params:
        if param not in required:
            continue
        required.remove(param)
    return list(required)

def lambda_handler(event, context):
    query_params = event.get('queryStringParameters')
    missing_params = get_missing_params(query_params)
    if len(missing_params) > 0:
        return {
            'isBase64Encoded': False,
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({ 'error': f'{', '.join(missing_params)} params not found' })
        }
    try:
        rating = int(query_params[RATING_PARAM])
        bpm_from = int(query_params[BPM_FROM_PARAM])
        bpm_to = int(query_params[BPM_TO_PARAM]) if BPM_TO_PARAM in query_params else bpm_from
    except ValueError as e:
        return {
            'isBase64Encoded': False,
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({ 'error': 'params are not numeric' })
        }
    db_response = table.query(
        IndexName=INDEX_NAME,
        KeyConditionExpression=Key('rating').eq(rating) & Key('bpm').between(bpm_from, bpm_to)
    )
    return {
        'isBase64Encoded': False,
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({ 'response': db_response.get('Items', []) }, cls=DecimalEncoder)
    }