import { Box, Table, Text } from '@chakra-ui/react'
import { useState, type PropsWithChildren } from 'react'
import DetailedStaminaInfo from '../DetailedStaminaInfo'

interface Song {
  chart_hash: string
  rating: number
  bpm: number
  title: string
  stream_total: number
  stream_density: number
  stream_breakdown: string
}

function ToggleableRow({ song, children }: PropsWithChildren<{ song: Song }>) {
  const [toggled, setToggled] = useState(false);
  return (<>
    <Table.Row onClick={() => setToggled(!toggled)}>
      <Table.Cell width="md">
        <Text display={{ base: 'block', md: 'none' }}>
          [{song.rating}] [{Math.round(song.bpm)}]
        </Text>
        {song.title}
      </Table.Cell>
      <Table.Cell display={{ base: 'none', md: 'table-cell' }}>{song.rating}</Table.Cell>
      <Table.Cell display={{ base: 'none', md: 'table-cell' }}>{Math.round(song.bpm)}</Table.Cell>
      <Table.Cell display={{ base: 'none', md: 'table-cell' }}>{song.stream_total}</Table.Cell>
      <Table.Cell display={{ base: 'none', md: 'table-cell' }}>{(song.stream_density * 100).toFixed(2)}</Table.Cell>
      <Table.Cell width="sm">
        {song.stream_breakdown}
        <Text display={{ base: 'block', md: 'none' }} fontStyle="italic">
          {song.stream_total} total, {(song.stream_density * 100).toFixed(2)}%
        </Text>
      </Table.Cell>
    </Table.Row>
    {toggled && (
      <Table.Row data-disabled={true}>
        <Table.Cell colSpan={6}>
          {children}
        </Table.Cell>
      </Table.Row>
    )}
  </>)
}

export default function StaminaChartTable({ data }: { data: any }) {
  return (
    <Box display="flex" justifyContent="center">
      <Table.Root size="lg" variant="outline" interactive>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Title</Table.ColumnHeader>
            <Table.ColumnHeader display={{ base: 'none', md: 'table-cell' }}>Rating</Table.ColumnHeader>
            <Table.ColumnHeader display={{ base: 'none', md: 'table-cell' }}>BPM</Table.ColumnHeader>
            <Table.ColumnHeader display={{ base: 'none', md: 'table-cell' }}>16ths</Table.ColumnHeader>
            <Table.ColumnHeader display={{ base: 'none', md: 'table-cell' }}>Density (%)</Table.ColumnHeader>
            <Table.ColumnHeader>Breakdown</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.map((song: Song) => (
            <ToggleableRow key={song.chart_hash} song={song}>
              <DetailedStaminaInfo hash={song.chart_hash} />
            </ToggleableRow>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  )
}