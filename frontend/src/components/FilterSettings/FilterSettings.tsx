import React, { useState } from 'react'
import { Box, Grid, Input, Button, Text, Accordion, Span, Checkbox } from '@chakra-ui/react'
import { routeApi as routeApiRating } from '@/routes/search_rating';
import { routeApi as routeApiTitle } from '@/routes/search_title';
import { useNavigate } from '@tanstack/react-router';

interface FilterSettingsProps {
  rating?: number;
  bpm_from?: number;
  bpm_to?: number;
  show_neighboring?: boolean;
  search?: string;
}

function FilterSettings() {
  let searchParams: FilterSettingsProps = {};
  try {
    searchParams = routeApiRating.useSearch();
  } catch {
    searchParams = routeApiTitle.useSearch();
  }
  const [rating, setRating] = useState<number>(searchParams?.rating || 11)
  const [bpmFrom, setBpmFrom] = useState<number>(searchParams?.bpm_from || 120)
  const [bpmTo, setBpmTo] = useState<number>(searchParams?.bpm_to || 500)
  const [showNeighboring, setShowNeighboring] = useState<boolean>(searchParams?.show_neighboring || true)
  const [title, setTitle] = useState<string>(searchParams?.search || '')

  const navigate = useNavigate();
  const handleSubmitA = async (e: React.FormEvent) => {
    e.preventDefault();
    await navigate({
      to: '/search_rating',
      search: {
        rating, bpm_from: bpmFrom, bpm_to: bpmTo, show_neighboring: showNeighboring
      }
    });
  };

  const handleSubmitB = async (e: React.FormEvent) => {
    e.preventDefault()
    await navigate({
      to: '/search_title',
      search: {
        search: title
      }
    });
  }

  return (
    <Accordion.Root collapsible mb={6}>
      <Accordion.Item value='1'>
        <Accordion.ItemTrigger>
          <Span flex={1}>More Options:</Span>
          <Accordion.ItemIndicator />
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          <Accordion.ItemBody>
            <Box>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr', lg: '1fr 1fr' }} gap={6} mb={4}>
                <Box as="form" onSubmit={handleSubmitA} borderWidth={{ base: 0, md: '1px' }} borderRadius={{ md: 'md' }} p={{ md: 4 }}>
                  <Box mb={4}>
                    <Text mb={2} textAlign="left">Rating:</Text>
                    <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={2}>
                      <Input
                        type="number"
                        min={11}
                        max={43}
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        aria-label="Rating"
                        borderWidth="1px"
                        borderColor="gray.500"
                      />
                      <Checkbox.Root
                        checked={showNeighboring}
                        onCheckedChange={(e) => setShowNeighboring(!!e.checked)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label>Search for neighboring ratings</Checkbox.Label>
                      </Checkbox.Root>
                    </Grid>
                  </Box>
                  <Box mb={4}>
                    <Text mb={2} textAlign="left">BPM Range (from/to):</Text>
                    <Grid templateColumns="1fr 1fr" gap={2}>
                      <Input
                        type="number"
                        min={120}
                        max={500}
                        value={bpmFrom}
                        onChange={(e) => setBpmFrom(Number(e.currentTarget.value))}
                        aria-label="BPM From"
                        placeholder="From"
                        borderWidth="1px"
                        borderColor="gray.500"
                      />
                      <Input
                        type="number"
                        min={120}
                        max={500}
                        value={bpmTo}
                        onChange={(e) => setBpmTo(Number(e.currentTarget.value))}
                        aria-label="BPM To"
                        placeholder="To"
                        borderWidth="1px"
                        borderColor="gray.500"
                      />
                    </Grid>
                    <Text fontSize="sm" color="gray.500">Current: {bpmFrom} - {bpmTo} BPM</Text>
                  </Box>
                  <Button type="submit" bg="bg.subtle" variant="outline" w="100%">Search by Rating and BPM Range</Button>
                </Box>
                <Box as="form" onSubmit={handleSubmitB} borderWidth={{ base: 0, md: '1px' }} borderRadius={{ md: 'md' }} p={{ md: 4 }}>
                  <Text mb={2} textAlign="left">Song Title:</Text>
                  <Input
                    flex={1}
                    placeholder="Enter title..."
                    value={title}
                    required
                    onChange={(e) => setTitle(e.target.value)}
                    aria-label="Title"
                    borderWidth="1px"
                    borderColor="gray.500"
                    mr={4}
                    mb={4}
                  />
                  <Button type="submit" bg="bg.subtle" variant="outline" w="100%">Search by Song Title</Button>
                </Box>
              </Grid>
            </Box>
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>
  )
}

export default FilterSettings