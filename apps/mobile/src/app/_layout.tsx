import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="recipe/[id]"
          options={{ title: 'Recipe', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="recipe/new"
          options={{ title: 'Add Recipe', presentation: 'modal' }}
        />
        <Stack.Screen
          name="cart"
          options={{ title: 'Shopping Cart', presentation: 'modal' }}
        />
      </Stack>
    </QueryProvider>
  );
}
