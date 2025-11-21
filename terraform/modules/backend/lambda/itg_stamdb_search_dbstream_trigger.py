from opensearchpy import OpenSearch, RequestsHttpConnection
from os import environ

HOST = environ['OPENSEARCH_HOST']
USER = environ['OPENSEARCH_USER']
PASS = environ['OPENSEARCH_PASS']

INDEX_NAME = environ['OPENSEARCH_INDEX']

client = OpenSearch(
    hosts=[{'host': HOST, 'port': 443}],
    http_auth=(USER, PASS),
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection,
    pool_maxsize=20
)

def lambda_handler(event, context):
    for record in event['Records']:
        event_name = record['eventName']
        chart_hash = record['dynamodb']['Keys']['chart_hash']['S']
        if event_name in {'INSERT', 'MODIFY'}:
            new_image = record['dynamodb']['NewImage']
            title = new_image['title']['S']
            client.index(
                index=INDEX_NAME,
                body={'chart_hash': chart_hash, 'title': title},
                id=chart_hash,
                refresh=True
            )
        elif event_name == 'DELETE':
            client.delete(
                index=INDEX_NAME,
                id=chart_hash
            )