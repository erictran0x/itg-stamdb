from pathlib import Path
import csv

import simfile
from simfile.timing import TimingData

import breakdown

PACK_DIRECTORY = 'C:\\Users\\Eric\\Desktop\\stepmania charts\\(2024-) Bracket Spectrum 2'

def get_chart_by_diff_name(sim: simfile.Simfile, diff_name):
    filtered = list(filter(lambda x: x.difficulty == diff_name, sim.charts))
    return filtered[0] if len(filtered) > 0 else None


def process_ssc_file(filepath):
    sim = simfile.open(filepath)
    timing_data = TimingData(sim)

    sn = get_chart_by_diff_name(sim, 'Beginner')
    se = get_chart_by_diff_name(sim, 'Easy')
    sm = get_chart_by_diff_name(sim, 'Medium')
    sh = get_chart_by_diff_name(sim, 'Hard')
    sx = get_chart_by_diff_name(sim, 'Challenge')

    sx_description = sx.description
    sx_stream_breakdown = breakdown.format_breakdown_to_string(breakdown.get_breakdown(sx, beat_scaling=1))

    return sim.artist, sim.title + (f' {sim.subtitle}' if len(sim.subtitle) > 0 else ''), \
        float(timing_data.bpms[0].value), \
        sx.meter if sx else '', \
        sh.meter if sh else '', \
        sm.meter if sm else '', \
        se.meter if sn else '', \
        sn.meter if sn else '', \
        sx_description, sx_stream_breakdown


if __name__ == '__main__':
    with open('output.csv', 'w', newline='', encoding='utf-8') as csvfile:
        csvwriter = csv.writer(csvfile)
        csvwriter.writerow([
            'Artist', 'Title', 'BPM', 'SX', 'SH', 'SM', 'SE', 'SN', 'SX Description', 'SX Stream Breakdown'
        ])
        for path in Path(PACK_DIRECTORY).rglob('*.ssc'):
            processed = list(map(lambda x: str(x), process_ssc_file(path)))
            csvwriter.writerow(processed)