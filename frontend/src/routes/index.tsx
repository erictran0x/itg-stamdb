import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Box, Button, Container, Flex, Heading } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['count-songs'],
    queryFn: async () => {
      const response = await fetch('https://d2xk0hpalqd86m.cloudfront.net/api/count-songs');
      const json = await response.json();
      return json.response;
    }
  })
  return (
    <Flex h="calc(100vh - 48px - 3.5rem)" align="center" justify="center">
      <Container maxW="container.lg" py={4}>
        <Heading as="h1" size="4xl" textAlign="center" mb={8}>
          ITG Stamina Database
        </Heading>
        <Flex w="100%" justify="center" gap={12}>
          <Button onClick={() => navigate({ to: '/search_rating' } as any)} colorScheme="blue" size="lg">
            Search Songs
          </Button>
          <Button onClick={() => navigate({ to: '/about' } as any)} colorScheme="gray" size="lg">
            About This Site
          </Button>
        </Flex>
        <Box m={8}>
          {!isLoading ? (
            !isError ? `${data} songs available` : `error getting song count: ${error.message}`
          ) : 'getting song count...'}
        </Box>
      </Container>
    </Flex>
  )
}