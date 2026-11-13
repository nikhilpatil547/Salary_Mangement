import { Alert, Center, Loader } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

export function Loading() {
  return <Center py="xl"><Loader /></Center>
}

export function LoadError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Something went wrong.'
  return (
    <Alert color="red" icon={<IconAlertCircle size={18} />} title="Could not load data">{message}</Alert>
  )
}
