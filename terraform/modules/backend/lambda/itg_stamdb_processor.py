from urllib.parse import unquote
import json
from typing import TypedDict
import boto3

from simfile.notes import NoteData
from simfile.notes.count import *
from simfile.timing import TimingData
from simfile.types import Simfile, Chart
import simfile

from os import environ
import re

from breakdown import BreakdownSectionType as BSType
import breakdown
import density
import hash
import patterns

import traceback

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
    beat_scaling = 1
    while True:
        bd = breakdown.get_breakdown(chart, beat_scaling)
        totals = breakdown.count_totals(bd)
        totals_no_break = list(filter(lambda x: x[0] != BSType.BREAK.name, totals.items()))

        # check if this is the ideal breakdown to use (more 16ths than others)
        stream_type_name = max(totals_no_break, key=lambda x: x[1])[0]
        if stream_type_name == BSType.STREAM24.name:
            beat_scaling = 1.5
        elif stream_type_name == BSType.STREAM32.name:
            beat_scaling = 2
        elif stream_type_name == BSType.STREAM20.name:
            beat_scaling = 1.25
        else:
            break
    stream_total = sum(map(lambda x: x['count'], filter(lambda x: x['type'].name != BSType.BREAK.name, bd)))
    measures_total = sum(map(lambda x: x['count'], bd))
    return {
        'rating': rating,
        'bpm': breakdown.get_adjusted_bpm(timing_data, chart, beat_scaling),
        'stream_breakdown': breakdown.format_breakdown_to_string(bd),
        'stream_density': stream_total / measures_total if measures_total > 0 else 0,
        'stream_total': stream_total
    }

def process_simfile(content):
    RATING_BPM_PATTERN = r'^\[(\d+)\] \[(\d+)\]\s'  # example: [17] [180]
    NON_EXPERT_DIFFICULTY_NAMES = {
        'Beginner': 'Novice',
        'Easy': 'Easy',
        'Medium': 'Medium',
        'Hard': 'Hard',
        'Edit': 'Edit'
    }

    sim = simfile.loads(content)
    title = f'{re.sub(RATING_BPM_PATTERN, '', sim.title)} {sim.subtitle}'.strip()
    def format_title(chart: Chart):
        if chart.difficulty in NON_EXPERT_DIFFICULTY_NAMES:
            return f'{title} ({NON_EXPERT_DIFFICULTY_NAMES[chart.difficulty]})'
        return title
    
    items = []
    chart: Chart
    for chart in sim.charts:
        if chart.stepstype != 'dance-single':  # parse 4-panel charts only
            continue
        timing_data = TimingData(sim, chart)
        processed_chart = calculate_stream_data(chart, timing_data)
        stream_note_data = breakdown.get_stream_note_data(chart)
        chart_hash = hash.generate_chart_hash(sim, chart)
        note_data = NoteData(chart)
        anchors = patterns.count_anchors(stream_note_data)
        anchor_result = {}
        for anchor in anchors:
            for arrow, count in anchor.items():
                arrow_key = f'ANCHOR_{arrow}'
                if arrow_key not in anchor_result:
                    anchor_result[arrow_key] = []
                anchor_result[arrow_key].append(count)
        bucket.put_object(
            Key=f'{chart_hash}.json',
            ContentType='application/json',
            Body=json.dumps({
                'title': format_title(chart),
                'artist': sim.artist,
                **processed_chart,
                'credit': chart.description,
                'steps_total': count_steps(note_data),
                'jumps_total': count_jumps(note_data),
                'note_graph_points': density.get_density(sim, chart),
                'note_count_per_measure': density.get_note_counts(chart),
                'pattern_data': {
                    **{ pattern.name: patterns.count_patterns(stream_note_data, pattern) for pattern in patterns.PatternType },
                    **anchor_result
                }
            })
        )
        item_to_add = {
            'chart_hash': chart_hash,
            'title': format_title(chart),
            **processed_chart
        }
        items.append(convert_to_dynamodb_put_request(item_to_add))
        print(f'Adding item:', item_to_add)
    dynamodb.batch_write_item(RequestItems={DYNAMODB_TABLE: items})  # i assume items is small enough for every simfile - max 5 charts per simfile

def lambda_handler(event, context):
    print(f'{len(event['Records'])} messages found')
    failed_messages = []
    for sqs_record in event['Records']:
        message_id = sqs_record['messageId']
        try:
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
        except Exception as e:
            print(f'ERROR processing message id {message_id}: {e} - {traceback.format_exc()}')
            failed_messages.append({ 'itemIdentifier': message_id })
    if len(failed_messages) > 0:
        print(f'{failed_messages=}')
        return { 'batchItemFailures': failed_messages }