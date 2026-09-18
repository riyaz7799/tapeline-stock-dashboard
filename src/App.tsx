import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StockDashboard from './components/StockDashboard';

// Retries are disabled: the circuit breaker owns failure handling, so
// TanStack Query should not layer its own retry/backoff on top of it.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StockDashboard />
    </QueryClientProvider>
  );
}
