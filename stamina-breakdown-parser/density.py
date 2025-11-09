from simfile import SMSimfile, SSCSimfile
from simfile.notes import NoteData
from simfile.notes.group import group_notes, SameBeatNotes
from simfile.sm import SMChart
from simfile.ssc import SSCChart
from simfile.timing import TimingData, BeatValue

from breakdown import TAPPABLE_NOTES


def get_density(simfile: SMSimfile | SSCSimfile, chart: SMChart | SSCChart):
    def get_curr_and_next_bpms() -> tuple[BeatValue, BeatValue]:
        curr_bpm = timing_data.bpms[curr_bpm_index]
        next_bpm = timing_data.bpms[curr_bpm_index + 1] if timing_data.bpms[curr_bpm_index + 1:] else None
        return curr_bpm, next_bpm

    timing_data = TimingData(simfile, chart)
    max_bpm_value = float(max(timing_data.bpms, key=lambda x: x.value).value)
    curr_bpm_index = 0

    note_data = NoteData(chart)
    group_iter = group_notes(
        note_data,
        include_note_types=TAPPABLE_NOTES,
        same_beat_notes=SameBeatNotes.JOIN_ALL
    )

    note_speed_per_measure: list[float] = [0]
    last_meas = 0
    for group in group_iter:
        note = group[0]
        curr_bpm, next_bpm = get_curr_and_next_bpms()
        if next_bpm is not None and note.beat >= next_bpm.beat:
            curr_bpm_index += 1
            curr_bpm, next_bpm = get_curr_and_next_bpms()
        meas = note.beat // 4  # 4 beats in a measure
        if meas > last_meas:
            note_speed_per_measure.extend([0] * (meas - last_meas))
            last_meas = meas
        note_speed_per_measure[-1] += (float(curr_bpm.value) / max_bpm_value)
    return note_speed_per_measure
