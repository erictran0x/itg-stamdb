import { Alert, Box, Spinner } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"

interface DetailedSong {
  artist: string,
  bpm: number,
  credit: string,
  jumps_total: number,
  note_graph_points: [number],
  pattern_data: any,
  rating: number,
  steps_total: number,
  stream_breakdown: string
  stream_density: number,
  stream_total: number,
  title: string
}

export default function DetailedStaminaInfo({ hash }: { hash: string }) {
  const { data, isLoading, isError, error } = useQuery({
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
  console.log(data)
  const patterns = data.pattern_data;
  const sum = (pattern_name: string) => {
    const value = Object.entries(patterns).filter(([k, _]) => k.startsWith(pattern_name)).map(([_, v]) => v).flat();
    console.log(value)
    return value.reduce((acc: any, curr) => acc + curr, 0) as number;
  }
  const mapPatterns = (mainPattern: string, suffixes: string[], shouldLower: boolean) => {
    return `${sum(mainPattern)} - ${suffixes
      .map((x: string) => `${sum(`${mainPattern}_${x}`)} ${shouldLower ? x.toLowerCase() : x}`)
      .join(', ')
      }`
  }
  return (
    <Box as="code">
      <p>--- Chart Info ---</p>
      <p>Credit: {data.credit}</p>
      <p>Steps: {data.steps_total}</p>
      <p>Jumps: {data.jumps_total}</p>
      <br />
      <p>--- Pattern Analysis ---</p>
      <p>Candles: {mapPatterns('CANDLE', ['LEFT', 'RIGHT'], true)}</p>
      <p>Candle Density: {((sum('CANDLE')) / data.stream_total).toFixed(2)} per measure</p>
      <br />
      <p>Anchors: {mapPatterns('ANCHOR', ['L', 'D', 'U', 'R'], false)}</p>
      <p>Boxes: {mapPatterns('BOX', ['LD', 'LU', 'RD', 'RU', 'LR', 'UD'], false)}</p>
      <p>Doritos: {mapPatterns('DORITO', ['LD', 'LU', 'RD', 'RU'], false)}</p>
      <p>Sweeps: {mapPatterns('SWEEP', ['LD', 'LU', 'RD', 'RU'], false)}</p>
      <p>Triangles: {mapPatterns('TRIANGLE', ['LDL', 'LUL', 'RDR', 'RUR'], false)}</p>
    </Box>
  )
}