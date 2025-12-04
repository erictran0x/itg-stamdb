from decimal import Decimal
from opensearchpy import OpenSearch, RequestsHttpConnection
from os import environ
import boto3
import json

HOST = environ['OPENSEARCH_HOST'].replace('https://', '')
USER = environ['OPENSEARCH_USER']
PASS = environ['OPENSEARCH_PASS']

INDEX_NAME = environ['OPENSEARCH_INDEX']
DYNAMODB_TABLE_NAME = environ['DYNAMODB_TABLE']

client = OpenSearch(
    hosts=[{'host': HOST, 'port': 443}],
    http_auth=(USER, PASS),
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection,
    pool_maxsize=20
)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

SEARCH_PARAM = 'search'

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
    query_params = event.get('queryStringParameters')
    if query_params is None or SEARCH_PARAM not in query_params or len(query_params) == 0:
        return {
            'isBase64Encoded': False,
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({ 'error': f'{SEARCH_PARAM} param not found' })
        }
    body = {
        'query': { 'match': {'title': {
            'query': query_params[SEARCH_PARAM]
        }}}
    }
    search_response = client.search(index=INDEX_NAME, body=body)
    print(f'{search_response=}')
    request_items = create_request_items(
        list(map(lambda x: x['_source']['chart_hash'], search_response['hits']['hits']))
    )
    print(f'{request_items=}')
    if request_items is None:
        return {
            'isBase64Encoded': False,
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({ 'response': { 'entries': [] } })
        }
    db_response = dynamodb.batch_get_item(RequestItems=request_items)
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