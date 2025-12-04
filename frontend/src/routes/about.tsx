import { Box, Button, Heading } from '@chakra-ui/react'
import { Tooltip } from '@/components/ui/tooltip'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Box w={{ base: '100%', md: '80%' }} mx="auto" textAlign="center" py={8}
      fontSize={{ base: 'md', md: 'lg', lg: 'xl' }}
      lineHeight={{ base: '1.6', md: '1.9' }}
    >
      <Heading as="h1" size="3xl" mb={4}>
        Motivation
      </Heading>
      <p>
        As a Stepmania/ITG stamina stepartist, one of the few challenges they face is being
        able to&nbsp;
        <Tooltip content="assign a number to">
          <a className='dotted-underline'>rate</a>
        </Tooltip>
        &nbsp;their charts correctly, or at least in a fair manner.
        Currently, the best way to do so is to cross-reference other charts of&nbsp;
        <Tooltip content="basically how many measures of 16th notes before a break and how long the breaks are">
          <a className='dotted-underline'>similar stream breakdowns</a>
        </Tooltip>
        &nbsp;and rate their charts based on the other ones.
        However, these breakdowns aren't in one place, making this task a bit annoying.
        <br />
        The purpose of this site is to put the breakdowns of all&nbsp;
        <Tooltip content="stuff in East Coast Stamina and Stamina RPG">
          <a className='dotted-underline'>known tournament stamina charts</a>
        </Tooltip>
        &nbsp;into one place, making it easier to cross-reference other charts.
      </p>
      <br />
      <Heading as="h1" size="3xl" mb={4}>
        Contact Info
      </Heading>
      <p>Email: <a href="mailto:erictran0x@gmail.com">erictran0x@gmail.com</a></p>
      <p>GitHub repo</p> {/* TODO fill this in */}
    </Box>
  )
}
