import { Alert, Box, Spinner } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { Scatter } from 'react-chartjs-2';
import { type TooltipItem } from 'chart.js/auto';

interface DetailedSong {
  artist: string,
  bpm: number,
  credit: string,
  jumps_total: number,
  note_graph_points: number[],
  pattern_data: any,
  rating: number,
  steps_total: number,
  stream_breakdown: string
  stream_density: number,
  stream_total: number,
  title: string
}

function splitNoteGraphPointsBySections(note_graph_points: number[]) {
  // given an array of numbers from 0 - some number, split array into sections of values 16+ and 15-
  // ex: [16, 16, 16, 16, 15, 16, 16, 16] should be
  // [[(0, 16), (1, 16), (2, 16), (3, 16)], [(4, 15)], [(5, 16), (6, 16), (7, 16)]]
  const processed: Array<Array<[number, number]>> = [];
  let isStream = true;
  for (const [index, item] of note_graph_points.entries()) {
    if (processed.length === 0) {
      processed.push([]);
      isStream = item >= 16;
    } else {
      if ((isStream && item < 16) || (!isStream && item >= 16)) {
        processed.push([]);
        isStream = item >= 16;
      }
    }
    processed[processed.length - 1].push([index, item]);
  }
  const streams = [];
  const breaks = [];
  for (const section of processed) {
    if (section[0][1] >= 16) {
      streams.push(section);
    } else {
      if (section.length === 1) {
        section.push([section[0][0] + 1, 0]);
        section.unshift([section[0][0] - 1, 0]);
      }
      breaks.push(section);
    }
  }
  return [streams, breaks];
}

function getPatternsByIndex(pattern_data: Record<string, number[]>, index: number) {
  return Object.fromEntries(Object.entries(pattern_data).map(
    ([pattern, data]) => ([pattern, data[index]])));
}

function outputPatternAnalysis(pattern_data: any, stream_total: number) {
  const sum = (pattern_name: string) => {
    const value = Object.entries(pattern_data).filter(([k, _]) => k.startsWith(pattern_name)).map(([_, v]) => v).flat();
    return value.reduce((acc: any, curr) => acc + curr, 0) as number;
  }
  const mapPatterns = (mainPattern: string, suffixes: string[], shouldLower: boolean) => {
    return `${sum(mainPattern)} - ${suffixes
      .map((x: string) => `${sum(`${mainPattern}_${x}`)} ${shouldLower ? x.toLowerCase() : x}`)
      .join(', ')
      }`
  }
  return {
    candles: mapPatterns('CANDLE', ['LEFT', 'RIGHT'], true),
    candleDensity: `${((sum('CANDLE')) / stream_total).toFixed(2)} per measure`,
    anchors: mapPatterns('ANCHOR', ['LEFT', 'DOWN', 'UP', 'RIGHT'], true),
    boxes: mapPatterns('BOX', ['LD', 'LU', 'RD', 'RU', 'LR', 'UD'], false),
    doritos: mapPatterns('DORITO', ['LD', 'LU', 'RD', 'RU'], false),
    sweeps: mapPatterns('SWEEP', ['LD', 'LU', 'RD', 'RU'], false),
    triangles: mapPatterns('TRIANGLE', ['LDL', 'LUL', 'RDR', 'RUR'], false),
  }
}

function ChartInfoAndPatternAnalysis({ data }: { data: DetailedSong }) {
  const analysis = outputPatternAnalysis(data.pattern_data, data.stream_total);
  return (
    <Box as="code">
      <p>--- Chart Info ---</p>
      <p>Credit: {data.credit}</p>
      <p>Steps: {data.steps_total}</p>
      <p>Jumps: {data.jumps_total}</p>
      <br />
      <p>--- Pattern Analysis ---</p>
      <p>Candles: {analysis.candles}</p>
      <p>Candle Density: {analysis.candleDensity} per measure</p>
      <br />
      <p>Anchors: {analysis.anchors}</p>
      <p>Boxes: {analysis.boxes}</p>
      <p>Doritos: {analysis.doritos}</p>
      <p>Sweeps: {analysis.sweeps}</p>
      <p>Triangles: {analysis.triangles}</p>
    </Box>
  )
}

function DensityGraph({ pattern_data, note_graph_points }: { pattern_data: any, note_graph_points: number[] }) {
  const [streams, breaks] = splitNoteGraphPointsBySections(note_graph_points);
  const data = {
    datasets: [
      ...streams.map((points) => ({
        fill: 'origin',
        showLine: true,
        data: points.map(([x, y]) => ({ x, y })),
        backgroundColor: 'rgb(67, 147, 213)',
        pointRadius: 0
      })),
      ...breaks.map((points) => ({
        fill: 'origin',
        showLine: true,
        data: points.map(([x, y]) => ({ x, y })),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        pointRadius: 0
      })),
    ]
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          display: false
        }
      },
      y: {
        min: 0,
        ticks: {
          display: false
        }
      }
    },
    elements: {
      point: {
        pointRadius: 0,
      },
      line: {
        borderWidth: 0,
      }
    },
    animation: {
      duration: 0,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        displayColors: false,
        animation: {
          duration: 150,
        },
        callbacks: {
          title: (context: TooltipItem<any>[]) => {
            if (context.length === 0) return;
            return `Stream ${context[0].datasetIndex + 1}`;
          },
          label: (context: TooltipItem<any>) => {
            const index = context.datasetIndex;
            const analysis = outputPatternAnalysis(
              getPatternsByIndex(pattern_data, index), streams[index].length
            );
            return [
              `Total measures: ${streams[index].length} (bursts: ${streams[index].filter((x) => x[1] > 16).length})`,
              `Candles: ${analysis.candles} - ${analysis.candleDensity}`,
              `Boxes: ${analysis.boxes}`,
              `Anchors: ${analysis.anchors}`,
              `Doritos: ${analysis.doritos}`,
              `Sweeps: ${analysis.sweeps}`,
              `Triangles: ${analysis.triangles}`
            ]
          }
        },
        filter: (context: TooltipItem<any>) => {
          return context.datasetIndex < streams.length;
        }
      }
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
      axis: 'x'
    }
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', width: '100%', height: '200px' }}>
      <Scatter
        id='ok'
        data={data}
        /* @ts-ignore */
        options={options}
      />
    </div>
  );
}

export default function DetailedStaminaInfo({ hash }: { hash: string }) {
  const { data, isLoading, isError, error } = useQuery<DetailedSong>({
    queryKey: ['detailed', hash],
    queryFn: async () => {
      const response = await fetch(`https://itg-stamdb-output.s3.us-west-1.amazonaws.com/${hash}.json`);
      return await response.json();
    }
  });
  if (isLoading)
    return (
      <Alert.Root>
        <Alert.Indicator>
          <Spinner size="sm" />
        </Alert.Indicator>
        <Alert.Title>Loading, please wait...</Alert.Title>
      </Alert.Root>
    )
  if (isError)
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Title>{error.name}: {error.message}</Alert.Title>
      </Alert.Root>
    )
  if (data === undefined)
    return <div>there's nothing, go away</div>

  return <>
    <ChartInfoAndPatternAnalysis data={data} />
    <br />
    <DensityGraph pattern_data={data.pattern_data} note_graph_points={data.note_graph_points} />
  </>
}