import { Badge, Center, Group, Stack, Table, Text, UnstyledButton } from '@mantine/core'
import { IconArrowDown, IconArrowUp, IconSelector } from '@tabler/icons-react'
import type { Employee } from '../api/types'
import type { EmployeeFilters, SortKey } from '../lib/employeeFilters'
import { EMPLOYMENT_TYPE_LABELS, formatDate, formatMoney } from '../lib/format'

interface Props {
  employees: Employee[]
  filters: EmployeeFilters
  onSort: (key: SortKey) => void
  onOpen: (employee: Employee) => void
}

function SortHeader({ label, sortKey, filters, onSort, align }: {
  label: string; sortKey: SortKey; filters: EmployeeFilters; onSort: (key: SortKey) => void; align?: 'right'
}) {
  const active = filters.sort === sortKey
  const Icon = !active ? IconSelector : filters.direction === 'asc' ? IconArrowUp : IconArrowDown
  return (
    <Table.Th ta={align} aria-sort={active ? (filters.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <UnstyledButton onClick={() => onSort(sortKey)}>
        <Group gap={4} wrap="nowrap" justify={align === 'right' ? 'flex-end' : 'flex-start'}>
          <Text fw={600} size="sm">{label}</Text>
          <Icon size={14} stroke={1.5} />
        </Group>
      </UnstyledButton>
    </Table.Th>
  )
}

export function EmployeeTable({ employees, filters, onSort, onOpen }: Props) {
  if (employees.length === 0) {
    return <Center py="xl"><Text c="dimmed">No employees match these filters.</Text></Center>
  }

  const header = (label: string, key: SortKey, align?: 'right') => (
    <SortHeader label={label} sortKey={key} filters={filters} onSort={onSort} align={align} />
  )

  return (
    <Table.ScrollContainer minWidth={900}>
      <Table highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            {header('Name', 'name')}
            {header('Code', 'employee_code')}
            {header('Job title', 'job_title')}
            {header('Department', 'department')}
            {header('Country', 'country')}
            {header('Hired', 'hire_date')}
            {header('Salary', 'salary_usd', 'right')}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {employees.map((employee) => (
            <Table.Tr key={employee.id} style={{ cursor: 'pointer' }} onClick={() => onOpen(employee)}>
              <Table.Td>
                <Stack gap={0}>
                  <Text size="sm" fw={500}>{employee.full_name}</Text>
                  <Text size="xs" c="dimmed">{employee.email}</Text>
                </Stack>
              </Table.Td>
              <Table.Td><Text size="sm" ff="monospace">{employee.employee_code}</Text></Table.Td>
              <Table.Td>
                <Group gap={6}>
                  <Text size="sm">{employee.job_title.name}</Text>
                  {employee.employment_type !== 'full_time' && (
                    <Badge size="xs" variant="light" color="gray">{EMPLOYMENT_TYPE_LABELS[employee.employment_type]}</Badge>
                  )}
                </Group>
              </Table.Td>
              <Table.Td><Text size="sm">{employee.department.name}</Text></Table.Td>
              <Table.Td><Text size="sm">{employee.country.name}</Text></Table.Td>
              <Table.Td><Text size="sm">{formatDate(employee.hire_date)}</Text></Table.Td>
              <Table.Td ta="right">
                <Text size="sm" fw={500}>{formatMoney(employee.salary, employee.currency_code)}</Text>
                {employee.currency_code !== 'USD' && (
                  <Text size="xs" c="dimmed">≈ {formatMoney(employee.salary_usd, 'USD')}</Text>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
