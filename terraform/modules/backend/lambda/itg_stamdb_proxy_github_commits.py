from os import environ
import urllib3
import json

GITHUB_TOKEN = environ['GITHUB_TOKEN']

http = urllib3.PoolManager()

def lambda_handler(event, context):
    resp = http.request(
        method='GET',
        url='https://api.github.com/repos/erictran0x/itg-stamdb/commits',
        headers={
            'Accept': 'application/vnd.github+json',
            'Authorization': f'Bearer {GITHUB_TOKEN}',
            'X-GitHub-Api-Version': '2022-11-28'
        })
    data = json.loads(resp.data.decode())
    if resp.status == 200:
        return {
            'isBase64Encoded': False,
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({ 'response': data })
        }
    else:
        return {
            'isBase64Encoded': False,
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({ 'error': data })
        }