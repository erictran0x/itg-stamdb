from urllib.parse import unquote
import json
from typing import TypedDict
import boto3

from simfile.notes import NoteData
from simfile.notes.count import *
from simfile.timing import TimingData
from simfile.types import Chart
import simfile

from os import environ
import re

from breakdown import BreakdownSectionType as BSType
import breakdown
import density
import hash
import patterns

DYNAMODB_TABLE = environ['DYNAMODB_TABLE']  # itg-stamdb-breakdowns

s3 = boto3.resource('s3')
dynamodb = boto3.client('dynamodb')

bucket = s3.Bucket(environ['S3_BUCKET_OUTPUT'])  # itg-stamdb-output

def convert_to_dynamodb_put_request(obj: dict):
    def typeof(x):
        if isinstance(x, str):
            return 'S'
        if isinstance(x, int | float):
            return 'N'
        return 'S'  # default for unhandled cases
    return {'PutRequest': {'Item': {
        key: {typeof(value): str(value)} for key, value in obj.items()
    }}}

class ChartStreamData(TypedDict):
    rating: int
    bpm: float
    stream_breakdown: str
    stream_density: float
    stream_total: int

def calculate_stream_data(chart: Chart, timing_data: TimingData) -> ChartStreamData:
    rating = int(chart.meter) if chart.meter is not None else 1
    bpm = float(timing_data.bpms[0].value) if len(timing_data.bpms) > 0 else 120  # TODO handle streams of multiple bpms
    for beat_scaling in [1, 1.25, 1.5, 2]:
        bd = breakdown.get_breakdown(chart, beat_scaling)
        totals = breakdown.count_totals(bd)

        # check if this is the ideal breakdown to use (more 16ths than others)
        if totals[BSType.STREAM16.name] > totals[BSType.STREAM20.name] and \
            totals[BSType.STREAM16.name] > totals[BSType.STREAM24.name] and \
            totals[BSType.STREAM16.name] > totals[BSType.STREAM32.name]:
            break
    bpm_scaled = bpm * beat_scaling
    stream_total = sum(map(lambda x: x['count'], filter(lambda x: x['type'].name != BSType.BREAK.name, bd)))
    measures_total = sum(map(lambda x: x['count'], bd))
    return {
        'rating': rating,
        'bpm': bpm_scaled,
        'stream_breakdown': breakdown.format_breakdown_to_string(bd),
        'stream_density': stream_total / measures_total if measures_total > 0 else 0,
        'stream_total': stream_total
    }

def process_simfile(content):
    rating_bpm_pattern = r'^\[(\d+)\] \[(\d+)\]\s'  # example: [17] [180] 
    sim = simfile.loads(content)
    title = re.sub(rating_bpm_pattern, '', sim.title)
    items = []
    chart: Chart
    for chart in sim.charts:
        timing_data = TimingData(sim, chart)
        processed_chart = calculate_stream_data(chart, timing_data)
        stream_note_data = breakdown.get_stream_note_data(chart)
        chart_hash = hash.generate_chart_hash(sim, chart)
        note_data = NoteData(chart)

        bucket.put_object(
            Key=f'{chart_hash}.json',
            Body=json.dumps({
                'title': title,
                'artist': sim.artist,
                **processed_chart,
                'credit': chart.description,
                'steps_total': count_steps(note_data),
                'jumps_total': count_jumps(note_data),
                'note_graph_points': density.get_density(sim, chart),
                'pattern_data': {
                    **{ pattern.name: patterns.count_patterns(stream_note_data, pattern) for pattern in patterns.PatternType },
                    **{ f'ANCHOR_{arrow}': count for arrow, count in patterns.count_anchors(stream_note_data).items() }
                }
            })
        )
        items.append(convert_to_dynamodb_put_request({
            'chart_hash': chart_hash,
            'title': title,
            'difficulty': int(chart.meter),
            **processed_chart
        }))
    print('batchwriteitem object:')
    print({DYNAMODB_TABLE: items})
    dynamodb.batch_write_item(RequestItems={DYNAMODB_TABLE: items})  # i assume items is small enough for every simfile - max 5 charts per simfile

def lambda_handler(event, context):
    for sqs_record in event['Records']:
        s3_notif = json.loads(sqs_record['body'])
        if 'Records' not in s3_notif:
            continue
        for s3_record in s3_notif['Records']:
            bucket_name = s3_record['s3']['bucket']['name']
            object_key = s3_record['s3']['object']['key'].replace('+', '%20')
            object_key = unquote(object_key)

            s3_object = s3.Object(bucket_name, object_key)
            response = s3_object.get()
            content = response['Body'].read().decode('utf-8')

            process_simfile(content)