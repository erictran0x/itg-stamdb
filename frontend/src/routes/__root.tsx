import * as React from 'react'
import { Outlet, createRootRoute, useNavigate } from '@tanstack/react-router'
import { Box, Flex, Link, Text } from '@chakra-ui/react'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const navigate = useNavigate()
  return (
    <React.Fragment>
      <Box as="header" borderColor="gray.200">
        <Flex align="center" maxW="container.lg" mx="auto" mb={4}>
          <Flex align="center" gap={6}>
            <Link onClick={() => navigate({ to: '/' } as any)}>
              <Text fontWeight="bold">itg-stamdb</Text>
            </Link>
            <Flex gap={4}>
              <Link onClick={() => navigate({ to: '/search_rating' })}>Songs</Link>
              <Link onClick={() => navigate({ to: '/about' })}>About</Link>
            </Flex>
          </Flex>
        </Flex>
      </Box>
      <Outlet />
    </React.Fragment>
  )
}
