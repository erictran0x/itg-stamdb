import { Heading, Box } from '@chakra-ui/react'
import {
  Table,
  TableContainer,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/table'

interface Song {
  chart_hash: string
  rating: number
  bpm: number
  title: string
  stream_total: number
  stream_density: number
  stream_breakdown: string
}

function StaminaChartTable({ data }: { data: any }) {
  return (
    <Box p={6}>
      <Heading as="h1" mb={6} textAlign="center">
        ITG Stamina Database
      </Heading>
      <Box display="flex" justifyContent="center">
        <TableContainer borderWidth="1px" borderColor="gray" borderRadius="md" overflowWrap="anywhere">
          <Table variant="striped" colorScheme="blue" layout="fixed">
            <Thead>
              <Tr>
                <Th px={20} py={20} borderBottomWidth={1} borderColor="gray">
                  <b>Rating</b>
                </Th>
                <Th px={20} py={20} borderBottomWidth={1} borderColor="gray">
                  <b>BPM</b>
                </Th>
                <Th px={20} py={20} borderBottomWidth={1} borderColor="gray"
                  flex="1" whiteSpace="normal" wordBreak="break-word" maxW="40vw">
                  <b>Title</b>
                </Th>
                <Th px={20} py={20} borderBottomWidth={1} borderColor="gray" isNumeric>
                  <b>Total 16ths</b>
                </Th>
                <Th px={20} py={20} borderBottomWidth={1} borderColor="gray" isNumeric>
                  <b>Density (%)</b>
                </Th>
                <Th px={20} py={20} borderBottomWidth={1} borderColor="gray"
                  flex="1" whiteSpace="normal" wordBreak="break-word" maxW="40vw">
                  <b>Stream Breakdown</b>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((song: Song) => (
                <Tr key={song.chart_hash}>
                  <Td px={20} py={20} borderColor="gray">
                    {song.rating}
                  </Td>
                  <Td px={20} py={20} borderColor="gray">
                    {song.bpm}
                  </Td>
                  <Td px={20} py={20} borderColor="gray"
                    flex="1" whiteSpace="normal" wordBreak="break-word" maxW="40vw">
                    {song.title}
                  </Td>
                  <Td px={20} py={20} borderColor="gray" isNumeric>
                    {song.stream_total}
                  </Td>
                  <Td px={20} py={20} borderColor="gray" isNumeric>
                    {Number(song.stream_density * 100).toFixed(2)}
                  </Td>
                  <Td px={20} py={20} borderColor="gray"
                    flex="1" whiteSpace="normal" wordBreak="break-word" maxW="40vw">
                    {song.stream_breakdown}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  )
}

export default StaminaChartTable