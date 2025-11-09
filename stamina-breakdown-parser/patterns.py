from enum import Enum
from functools import reduce
from typing import TypedDict, Literal

from breakdown import Stream

class Arrow(Enum):
    L = 0b_1000
    D = 0b_0100
    U = 0b_0010
    R = 0b_0001

type ArrowKey = Literal[*[x.name for x in Arrow]]


def convert_arrows_to_bitmask(*arrows):
    bitmasks = list(map(
        lambda x: reduce(
            lambda a, b: a << 4 | getattr(Arrow, b).value,
            map(lambda y: y, [c for c in x]),
            0
        ),
        arrows
    ))
    return bitmasks


class PatternType(Enum):
    CANDLE_LEFT = convert_arrows_to_bitmask('ULD', 'DLU')
    CANDLE_RIGHT = convert_arrows_to_bitmask('URD', 'DRU')

    BOX_LR = convert_arrows_to_bitmask('LRLR', 'RLRL')
    BOX_UD = convert_arrows_to_bitmask('UDUD', 'DUDU')
    BOX_LU = convert_arrows_to_bitmask('LULU', 'ULUL')
    BOX_LD = convert_arrows_to_bitmask('LDLD', 'DLDL')
    BOX_RU = convert_arrows_to_bitmask('RURU', 'URUR')
    BOX_RD = convert_arrows_to_bitmask('RDRD', 'DRDR')

    TRIANGLE_LDL = convert_arrows_to_bitmask('LDL')
    TRIANGLE_LUL = convert_arrows_to_bitmask('LUL')
    TRIANGLE_RDR = convert_arrows_to_bitmask('RDR')
    TRIANGLE_RUR = convert_arrows_to_bitmask('RUR')

    DORITO_LD = convert_arrows_to_bitmask('LDUDL')
    DORITO_LU = convert_arrows_to_bitmask('LUDUL')
    DORITO_RD = convert_arrows_to_bitmask('RDUDR')
    DORITO_RU = convert_arrows_to_bitmask('RUDUR')

    SWEEP_LD = convert_arrows_to_bitmask('LUDRDUL')
    SWEEP_LU = convert_arrows_to_bitmask('LDURUDL')
    SWEEP_RD = convert_arrows_to_bitmask('RUDLDUR')
    SWEEP_RU = convert_arrows_to_bitmask('RDULUDR')


def count_patterns(streams: list[Stream], pattern_type: PatternType) -> list[int]:
    note_length = 4
    max_int = 2 ** 32 - 1  # sliding window size of 32/4=8
    def helper(stream: Stream) -> int:
        result = 0
        note_data = stream['note_data']
        window = 0
        for note in note_data:
            window <<= note_length
            window |= note
            window &= max_int
            found_pattern = any((window & x) == x for x in pattern_type.value)
            if found_pattern:
                result += 1
        return result
    return list(map(helper, streams))

def count_anchors(streams: list[Stream]) -> dict[ArrowKey, int]:
    def helper(note_data: list[int], arrow: Arrow):
        # need every tripling of every other note
        triplings = zip(note_data, note_data[2:], note_data[4:])
        return sum([
            1 for [a, b, c] in triplings
            if (a & arrow.value) > 0 and (b & arrow.value) > 0 and (c & arrow.value) > 0
        ])
    result = {}
    for stream in streams:
        note_data = stream['note_data']
        for arrow in Arrow:
            if arrow.name not in result:
                result[arrow.name] = 0
            result[arrow.name] += helper(note_data, arrow)
    return result

