from io import TextIOWrapper
import sys
from pprint import pprint

import density
import hash
import breakdown
import simfile

import patterns
from patterns import PatternType


def load_from_stream():
    stream = TextIOWrapper(sys.stdin.buffer)
    sm = simfile.loads(stream.read())
    streams = breakdown.get_stream_note_data(sm.charts[0])
    beat_scalings = [1, 1.25, 1.5, 2]
    for beat_scaling in beat_scalings:
        bd = breakdown.get_breakdown(sm.charts[0], beat_scaling)
        print(breakdown.format_breakdown_to_string(bd))
        print(breakdown.count_totals(bd))
    print(list(map(lambda x: x['measure'], streams)))
    for pattern_type in PatternType:
        print(pattern_type.name, ':', patterns.count_patterns(
            streams, pattern_type
        ))
    print('Anchors :', patterns.count_anchors(streams))
    print(density.get_density(sm, sm.charts[0]))

if __name__ == '__main__':
    load_from_stream()