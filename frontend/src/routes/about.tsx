import { Alert, Box, Heading, Table } from '@chakra-ui/react'
import { Tooltip } from '@/components/ui/tooltip'
import { createFileRoute } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/about')({
  component: RouteComponent,
})

interface GitCommitResult {
  sha: string;
  commit: {
    author: {
      date: string
    };
    message: string;
  }
}

function GithubCommits() {
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['github-commits'],
    queryFn: async () => {
      const response = await fetch('https://d2xk0hpalqd86m.cloudfront.net/api/changelog');
      return await response.json();
    }
  })
  if (isLoading) return <div>loading</div>;
  if (isError) return (
    <Alert.Root status="error">
      <Alert.Indicator />
      <Alert.Title>{error.name}: {error.message}</Alert.Title>
    </Alert.Root>
  )
  return (
    <Box display="flex" justifyContent="center">
      <Table.Root size="lg" variant="outline">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader width="auto" whiteSpace="nowrap">Date</Table.ColumnHeader>
            <Table.ColumnHeader>Description</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.response.slice(0, 5).map((x: GitCommitResult) => (
            <Table.Row key={x.sha}>
              <Table.Cell width="auto" whiteSpace="nowrap">{new Date(x.commit.author.date).toLocaleString()}</Table.Cell>
              <Table.Cell>{x.commit.message}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  )
}

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
      <br />
      <Heading as="h1" size="3xl" mb={4}>
        Git Changelog (includes frontend + iac)
      </Heading>
      <GithubCommits />
    </Box>
  )
}
