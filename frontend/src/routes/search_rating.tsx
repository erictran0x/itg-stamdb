import PageMainDatabase from '@/components/PageMainDatabase';
import { Alert } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, getRouteApi, stripSearchParams } from '@tanstack/react-router'
import z from 'zod';

const defaultParams = {
  rating: 11,
  bpm_from: 120,
  bpm_to: 500
};

const searchSchema = z.object(Object.fromEntries(Object.entries(defaultParams).map(
  ([k, v]) => [k, z.number().default(v)]
)));

export const Route = createFileRoute('/search_rating')({
  validateSearch: searchSchema,
  search: {
    middlewares: [stripSearchParams(defaultParams)]
  },
  component: RouteComponent,
})

export const routeApi = getRouteApi('/search_rating');

function RouteComponent() {
  const { rating, bpm_from, bpm_to } = Route.useSearch();
  const queryParams = new URLSearchParams({
    rating: rating.toString(),
    bpm_from: bpm_from.toString(),
    bpm_to: bpm_to.toString()
  })
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['query', rating, bpm_from, bpm_to],
    queryFn: async () => {
      const response = await fetch(`https://d2xk0hpalqd86m.cloudfront.net/api/query?${queryParams.toString()}`);
      const json = await response.json();
      return json.response;
    }
  });
  if (isLoading)
    return <div>loading</div>;
  if (isError)
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Title>{error.name}: {error.message}</Alert.Title>
      </Alert.Root>
    )
  console.log(data)
  return <PageMainDatabase data={data} />;
}
