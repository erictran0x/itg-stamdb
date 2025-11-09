import hashlib

from simfile import SMSimfile, SSCSimfile
from simfile.sm import SMChart
from simfile.ssc import SSCChart
from simfile.timing import TimingData


def generate_chart_hash(simfile: SMSimfile | SSCSimfile, chart: SSCChart) -> str:
    data = minimize_chart_data(chart) + normalize_bpms(simfile, chart)
    hashed_data = hashlib.sha1(data.encode('utf-8'))
    hex_digest = hashed_data.hexdigest()
    return hex_digest[:16]


def minimize_chart_data(chart: SMChart | SSCChart) -> str:
    def minimize_measure(meas):
        minimal = False
        while not minimal and len(meas) % 2 == 0:
            all_zeros = True
            for i in range(1, len(meas), 2):
                if meas[i] != ''.ljust(len(meas[0]), '0'):
                    all_zeros = False
                    break
            if all_zeros:
                for i in range(1, len(meas) // 2 + 1):
                    del meas[i]
            else:
                minimal = True
        return meas

    notes = filter(
        lambda x: len(x) > 0,
        map(lambda x: x.strip(), chart.notes.split(','))
    )
    notes = map(lambda x: x.split('\n'), notes)
    notes = map(minimize_measure, notes)
    notes = list(map(lambda x: '\n'.join(x), notes))
    return '\n,\n'.join(notes)


def normalize_bpms(simfile: SMSimfile | SSCSimfile, chart: SSCChart = None) -> str:
    def round3(num):
        mult = 1000
        return (num * mult + 0.5 - (num * mult + 0.5) % 1) / mult

    timing_data = TimingData(simfile, chart)
    return ','.join(list(map(
        lambda x: f'{round3(x.beat):.3f}={round3(float(x.value)):.3f}',
        timing_data.bpms
    )))