import { MantineProvider, createTheme } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { makeQueryClient } from './lib/queryClient'
import { useState, type ReactNode } from 'react'

const theme = createTheme({
  primaryColor: 'indigo',
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
})

// env="test" turns off Mantine's transitions and portals, which jsdom cannot run.
export function AppProviders({ children, queryClient, env }: { children: ReactNode; queryClient?: QueryClient; env?: 'test' }) {
  const [client] = useState(() => queryClient ?? makeQueryClient())
  return (
    <MantineProvider theme={theme} env={env}>
      <Notifications position="top-right" />
      <QueryClientProvider client={client}>
        <ModalsProvider>{children}</ModalsProvider>
      </QueryClientProvider>
    </MantineProvider>
  )
}
