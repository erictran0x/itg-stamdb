import { Provider } from "@/components/ui/provider"
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import './index.css'
import { routeTree } from "./routeTree.gen.ts"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const router = createRouter({ routeTree });
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider>
        <RouterProvider router={router} />
      </Provider>
    </QueryClientProvider>
  </StrictMode>,
);

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}