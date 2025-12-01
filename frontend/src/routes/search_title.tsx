import PageMainDatabase from '@/components/PageMainDatabase';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, getRouteApi, stripSearchParams } from '@tanstack/react-router'
import z from 'zod';

const defaultParams = {
  search: '',
};

const searchSchema = z.object(Object.fromEntries(Object.entries(defaultParams).map(
  ([k, v]) => [k, z.string().default(v)]
)));

export const Route = createFileRoute('/search_title')({
  validateSearch: searchSchema,
  search: {
    middlewares: [stripSearchParams(defaultParams)]
  },
  component: RouteComponent,
})

export const routeApi = getRouteApi('/search_title');

function RouteComponent() {
  const { search } = Route.useSearch();
  const queryParams = new URLSearchParams({
    search
  })
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['search', search],
    queryFn: async () => {
      const response = await fetch(`https://d2xk0hpalqd86m.cloudfront.net/api/search-title?${queryParams.toString()}`);
      const json = await response.json();
      return json.response.entries;
    }
  });
  if (isLoading)
    return <div>loading</div>;
  console.log(data)
  return <PageMainDatabase data={data} />;
}
