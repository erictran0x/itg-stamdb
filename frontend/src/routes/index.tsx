import StaminaChartTable from '@/components/StaminaChartTable'
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { z } from 'zod'

const defaultParams = {
  rating: 11,
  bpm_from: 120,
  bpm_to: 500
};

// const searchSchema = z.object({
//   rating: z.number().default(11),
//   bpm_from: z.number().default(120),
//   bpm_to: z.number().default(500),
// });

const searchSchema = z.object(Object.fromEntries(Object.entries(defaultParams).map(
  ([k, v]) => [k, z.number().default(v)]
)));

export const Route = createFileRoute('/')({
  validateSearch: searchSchema,
  search: {
    middlewares: [stripSearchParams(defaultParams)]
  },
  component: RouteComponent,
})

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
  console.log(data)
  return <StaminaChartTable data={data} />;
}
