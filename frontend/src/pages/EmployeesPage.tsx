import { Button, Card, Group, Pagination, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconDownload, IconPlus } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { buildUrl } from '../api/client'
import { useEmployees, useReferenceData } from '../api/hooks'
import { EmployeeFiltersBar } from '../components/EmployeeFiltersBar'
import { EmployeeFormModal } from '../components/EmployeeFormModal'
import { EmployeeTable } from '../components/EmployeeTable'
import { PageHeader } from '../components/PageHeader'
import { LoadError, Loading } from '../components/QueryState'
import { PER_PAGE, toApiParams, toggleSort } from '../lib/employeeFilters'
import { useEmployeeFilters } from '../lib/useEmployeeFilters'

export function EmployeesPage() {
  const navigate = useNavigate()
  const { filters, setFilters, change } = useEmployeeFilters()
  const reference = useReferenceData()
  const employees = useEmployees(filters)
  const [creating, createModal] = useDisclosure(false)

  const meta = employees.data?.meta
  // The export covers every matching employee, not just the current page.
  const exportUrl = buildUrl('/api/employees.csv', { ...toApiParams(filters), page: undefined, per_page: undefined })
  const firstShown = meta && meta.total > 0 ? (meta.page - 1) * PER_PAGE + 1 : 0
  const lastShown = meta ? Math.min(meta.page * PER_PAGE, meta.total) : 0

  return (
    <>
      <PageHeader
        title="Employees"
        description="Everyone at ACME, with their current pay. Click a row to see salary history or make a change."
        actions={
          <>
            <Button variant="default" component="a" href={exportUrl} leftSection={<IconDownload size={16} />}>
              Export CSV
            </Button>
            <Button leftSection={<IconPlus size={16} />} onClick={createModal.open} disabled={!reference.data}>
              Add employee
            </Button>
          </>
        }
      />
      <Card withBorder padding="md">
        <Stack gap="md">
          <EmployeeFiltersBar filters={filters} reference={reference.data} onChange={change} />
          {employees.isPending ? <Loading /> : employees.isError ? <LoadError error={employees.error} /> : (
            <>
              <EmployeeTable
                employees={employees.data.data} filters={filters}
                onSort={(key) => setFilters(toggleSort(filters, key))}
                onOpen={(employee) => navigate(`/employees/${employee.id}`)}
              />
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {meta && meta.total > 0
                    ? `Showing ${firstShown.toLocaleString()}–${lastShown.toLocaleString()} of ${meta.total.toLocaleString()}`
                    : ''}
                </Text>
                {meta && meta.total_pages > 1 && (
                  <Pagination total={meta.total_pages} value={meta.page} onChange={(page) => change({ page })} siblings={1} />
                )}
              </Group>
            </>
          )}
        </Stack>
      </Card>
      {reference.data && (
        <EmployeeFormModal
          opened={creating} onClose={createModal.close} reference={reference.data}
          onSaved={(employee) => navigate(`/employees/${employee.id}`)}
        />
      )}
    </>
  )
}
