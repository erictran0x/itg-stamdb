from enum import Enum
from functools import reduce
from typing import TypedDict

from simfile.notes import NoteData, NoteType
from simfile.notes.group import group_notes, SameBeatNotes
from simfile.sm import SMChart
from simfile.ssc import SSCChart

TAPPABLE_NOTES = frozenset([
    NoteType.TAP, NoteType.HOLD_HEAD, NoteType.ROLL_HEAD
])


type Breakdown = list[BreakdownSection]


class BreakdownSectionType(Enum):
    BREAK = ['(', ')']
    STREAM16 = ['', '']
    STREAM20 = ['~', '~']
    STREAM24 = ['/', '/']
    STREAM32 = ['*', '*']


class BreakdownSection(TypedDict):
    type: BreakdownSectionType
    count: int


class Stream(TypedDict):
    measure: int
    note_data: list[int]


def count_totals(breakdown: Breakdown) -> dict[str, int]:
    totals = list(map(
        lambda x: {x: sum(list(map(
            lambda y: y['count'],
            filter(lambda y: y['type'].name == x, breakdown)
        )))},
        BreakdownSectionType.__members__.keys()
    ))
    result = {}
    for total in totals:
        result.update(total)
    return result


def format_breakdown_to_string(breakdown: Breakdown) -> str:
    return ' '.join(
        # example: 13 (3) 13 ...
        list(map(
            lambda x: x['type'].value[0] + str(x['count']) + x['type'].value[1],
            # do not output breaks of 1 measure
            filter(lambda x: not (x['type'] == BreakdownSectionType.BREAK and x['count'] == 1), breakdown)
        ))
    )


def get_breakdown(chart: SMChart | SSCChart, beat_scaling: float = 1) -> Breakdown:
    note_data = NoteData(chart)
    group_iter = group_notes(
        note_data,
        include_note_types=TAPPABLE_NOTES,
        same_beat_notes=SameBeatNotes.JOIN_ALL
    )

    last_meas = 0
    num_notes_in_meas = [0]
    for group in group_iter:
        note = group[0]
        meas = (note.beat * beat_scaling) // 4  # 4 beats in a measure
        if meas > last_meas:
            num_notes_in_meas.extend([0] * (meas - last_meas))
            last_meas = meas
        num_notes_in_meas[-1] += 1

    breakdown: Breakdown = [
        {'type': BreakdownSectionType.BREAK, 'count': 0}  # the intro of the chart
    ]
    last_section_type = breakdown[-1]['type']
    for num_notes in num_notes_in_meas:
        if num_notes < 16:
            curr_section_type = BreakdownSectionType.BREAK
        elif num_notes < 20:
            curr_section_type = BreakdownSectionType.STREAM16
        elif num_notes < 24:
            curr_section_type = BreakdownSectionType.STREAM20
        elif num_notes < 32:
            curr_section_type = BreakdownSectionType.STREAM24
        else:
            curr_section_type = BreakdownSectionType.STREAM32
        if last_section_type != curr_section_type:
            breakdown.append({
                'type': curr_section_type,
                'count': 1
            })
            last_section_type = curr_section_type
        else:
            breakdown[-1]['count'] += 1

    # remove the intro and outro
    if len(breakdown) > 0 and breakdown[0]['type'] == BreakdownSectionType.BREAK:
        breakdown = breakdown[1:]
    if len(breakdown) > 0 and breakdown[-1]['type'] == BreakdownSectionType.BREAK:
        breakdown = breakdown[:-1]

    return breakdown


def get_stream_note_data(chart: SMChart | SSCChart) -> list[Stream]:
    note_data = NoteData(chart)
    group_iter = group_notes(
        note_data,
        include_note_types=TAPPABLE_NOTES,
        same_beat_notes=SameBeatNotes.JOIN_ALL
    )
    note_data_in_meas: list[Stream] = [{
        'measure': 0, 'note_data': []
    }]
    last_meas = 0
    for group in group_iter:
        note = reduce(
            lambda a, b: a | ((1 if b.note_type in TAPPABLE_NOTES else 0) << (3 - b.column)),
            group,
            0
        )
        meas = group[0].beat // 4  # 4 beats in a measure
        if meas > last_meas:
            # doesn't matter what measure is set to for the ones that are going to be empty
            # will be filtered out later anyway
            for _ in range(last_meas, meas):
                note_data_in_meas.append({'measure': meas, 'note_data': []})
            last_meas = meas
        note_data_in_meas[-1]['note_data'].append(note)
    note_data_in_meas = list(filter(lambda x: len(x['note_data']) >= 16, note_data_in_meas))
    for i in range(len(note_data_in_meas)-1, 0, -1):
        if note_data_in_meas[i]['measure'] - note_data_in_meas[i-1]['measure'] == 1:
            note_data_in_meas[i-1]['note_data'].extend(note_data_in_meas[i]['note_data'])
            del note_data_in_meas[i]
    return note_data_in_meas
