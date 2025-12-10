import { Box, Heading } from '@chakra-ui/react'
import { Tooltip } from '@/components/ui/tooltip'
import { createFileRoute } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react';

export const Route = createFileRoute('/about')({
  component: RouteComponent,
})

function ClickableTooltip({ content, children }: { content: string, children?: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Tooltip
      closeOnClick={false} content={content}
      openDelay={0} open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <a
        onClick={() => setIsOpen(!isOpen)}
        className='dotted-underline'>
        {children}
      </a>
    </Tooltip>
  );
}

function RouteComponent() {
  return (
    <Box w={{ base: '100%', md: '80%' }} mx="auto" textAlign="center" py={8}
      fontSize={{ base: 'md', md: 'lg', lg: 'xl' }}
      lineHeight={{ base: '1.6' }}
    >
      <Heading as="h1" size="3xl" mb={4}>
        Motivation
      </Heading>
      <p>
        As a Stepmania/ITG stamina stepartist, one of the few challenges they face is being
        able to&nbsp;
        <ClickableTooltip content="assign a number to">
          rate
        </ClickableTooltip>
        &nbsp;their charts correctly, or at least in a fair manner.
        Currently, the best way to do so is to cross-reference other charts of&nbsp;
        <ClickableTooltip content="basically how many measures of 16th notes before a break and how long the breaks are">
          similar stream breakdowns
        </ClickableTooltip>
        &nbsp;and rate their charts based on the other ones.
        However, these breakdowns aren't in one place, making this task a bit annoying.
        <br />
        The purpose of this site is to put the breakdowns of all&nbsp;
        <ClickableTooltip content="stuff in East Coast Stamina and Stamina RPG">
          known tournament stamina charts
        </ClickableTooltip>
        &nbsp;into one place, making it easier to cross-reference other charts.
      </p>
      <br />
      <Heading as="h1" size="3xl" mb={4}>
        Contact Info
      </Heading>
      <p>Email: <a href="mailto:erictran0x@gmail.com">erictran0x@gmail.com</a></p>
      <p><a href="https://github.com/erictran0x/itg-stamdb">GitHub repo</a></p>
    </Box>
  )
}
