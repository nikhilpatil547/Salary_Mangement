import { Anchor, Badge, Button, Card, Grid, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconArrowLeft, IconCash, IconPencil, IconTrash } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useDeleteEmployee, useEmployee, useReferenceData, useSalaryRevisions } from '../api/hooks'
import { EmployeeFormModal } from '../components/EmployeeFormModal'
import { LoadError, Loading } from '../components/QueryState'
import { SalaryHistory } from '../components/SalaryHistory'
import { SalaryRevisionModal } from '../components/SalaryRevisionModal'
import { EMPLOYMENT_TYPE_LABELS, formatDate, formatMoney } from '../lib/format'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
      <Text size="sm">{children}</Text>
    </Stack>
  )
}

export function EmployeePage() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const employee = useEmployee(id)
  const revisions = useSalaryRevisions(id)
  const reference = useReferenceData()
  const remove = useDeleteEmployee(id)
  const [editing, editModal] = useDisclosure(false)
  const [revising, reviseModal] = useDisclosure(false)

  if (employee.isPending) return <Loading />
  if (employee.isError) {
    if (employee.error instanceof ApiError && employee.error.status === 404) {
      return <Stack><Text>This employee no longer exists.</Text><Anchor component={Link} to="/employees">Back to employees</Anchor></Stack>
    }
    return <LoadError error={employee.error} />
  }

  const e = employee.data
  const confirmDelete = () => modals.openConfirmModal({
    title: `Remove ${e.full_name}?`,
    children: <Text size="sm">This deletes the employee and their full salary history. It cannot be undone.</Text>,
    labels: { confirm: 'Remove employee', cancel: 'Keep' },
    confirmProps: { color: 'red' },
    onConfirm: async () => {
      await remove.mutateAsync()
      notifications.show({ message: `${e.full_name} was removed` })
      navigate('/employees')
    },
  })

  return (
    <Stack>
      <Anchor component={Link} to="/employees" size="sm">
        <Group gap={4}><IconArrowLeft size={14} /> All employees</Group>
      </Anchor>
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Group gap="sm">
            <Title order={2}>{e.full_name}</Title>
            <Badge variant="light">{EMPLOYMENT_TYPE_LABELS[e.employment_type]}</Badge>
          </Group>
          <Text c="dimmed">{e.job_title.name} · {e.department.name} · {e.country.name}</Text>
        </Stack>
        <Group>
          <Button variant="default" leftSection={<IconPencil size={16} />} onClick={editModal.open} disabled={!reference.data}>Edit details</Button>
          <Button variant="subtle" color="red" leftSection={<IconTrash size={16} />} onClick={confirmDelete}>Remove</Button>
        </Group>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card withBorder h="100%">
            <Title order={4} mb="md">Details</Title>
            <SimpleGrid cols={2} spacing="md">
              <Field label="Employee code">{e.employee_code}</Field>
              <Field label="Email">{e.email}</Field>
              <Field label="Hired">{formatDate(e.hire_date)}</Field>
              <Field label="Country">{e.country.name} ({e.currency_code})</Field>
              <Field label="Department">{e.department.name}</Field>
              <Field label="Job title">{e.job_title.name}</Field>
            </SimpleGrid>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder h="100%">
            <Title order={4} mb="xs">Current salary</Title>
            <Text fz={32} fw={700}>{formatMoney(e.salary, e.currency_code)}</Text>
            <Text c="dimmed" size="sm" mb="md">
              per year{e.currency_code !== 'USD' ? ` · about ${formatMoney(e.salary_usd, 'USD')}` : ''}
            </Text>
            <Button leftSection={<IconCash size={16} />} onClick={reviseModal.open} disabled={!reference.data}>Change salary</Button>
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder>
        <Title order={4} mb="sm">Salary history</Title>
        {revisions.isPending ? <Loading /> : revisions.isError ? <LoadError error={revisions.error} /> : <SalaryHistory revisions={revisions.data} />}
      </Card>

      {reference.data && (
        <>
          <EmployeeFormModal opened={editing} onClose={editModal.close} reference={reference.data} employee={e} />
          <SalaryRevisionModal opened={revising} onClose={reviseModal.close} employee={e} reasons={reference.data.revision_reasons} />
        </>
      )}
    </Stack>
  )
}

