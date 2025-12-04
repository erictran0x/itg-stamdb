import PageMainDatabase from '@/components/PageMainDatabase';
import { Alert } from '@chakra-ui/react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { createFileRoute, getRouteApi, stripSearchParams } from '@tanstack/react-router'
import z from 'zod';

const searchSchema = z.object({
  rating: z.number().default(11),
  bpm_from: z.number().default(120),
  bpm_to: z.number().default(500),
  show_neighboring: z.boolean().default(true)
});

export const Route = createFileRoute('/search_rating')({
  validateSearch: searchSchema,
  search: {
    middlewares: [stripSearchParams(searchSchema.parse({}))]
  },
  component: RouteComponent,
})

export const routeApi = getRouteApi('/search_rating');

function RouteComponent() {
  const { rating, bpm_from, bpm_to, show_neighboring } = Route.useSearch();
  const queryParams = new URLSearchParams({
    rating: rating.toString(),
    bpm_from: bpm_from.toString(),
    bpm_to: bpm_to.toString(),
    show_neighboring: show_neighboring.toString()
  });
  const offsets = show_neighboring ? [-1, 0, 1] : [0];
  const queries = useQueries({
    queries: offsets.map((x) => ({
      queryKey: ['query', rating + x, bpm_from, bpm_to],
      queryFn: async () => {
        const newQueryParams = queryParams;
        newQueryParams.set('rating', (rating + x).toString())
        const response = await fetch(`https://d2xk0hpalqd86m.cloudfront.net/api/query?${queryParams.toString()}`);
        const json = await response.json();
        return json.response;
      }
    }))
  });

  if (queries.some(query => query.isLoading)) {
    return <div>Loading all data...</div>;
  }

  if (queries.some(query => query.isError)) {
    return queries
      .filter(query => query.isError)
      .map(({ error }) => (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Title>{error.name}: {error.message}</Alert.Title>
        </Alert.Root>
      ))
  }
  const data = queries.flatMap(query => query.data);
  console.log(data)
  return <PageMainDatabase data={data} />;
}
