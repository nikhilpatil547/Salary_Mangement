import { Anchor, Badge, Card, Center, Group, SegmentedControl, Select, Stack, Table, Text } from '@mantine/core'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useOutliers, useReferenceData } from '../api/hooks'
import { PageHeader } from '../components/PageHeader'
import { LoadError, Loading } from '../components/QueryState'
import { formatMoney, formatPercent } from '../lib/format'

const THRESHOLDS = [
  { value: '0.15', label: '±15%' },
  { value: '0.25', label: '±25%' },
  { value: '0.4', label: '±40%' },
]

export function OutliersPage() {
  const [threshold, setThreshold] = useState('0.25')
  const [countryId, setCountryId] = useState<number | null>(null)
  const reference = useReferenceData()
  const outliers = useOutliers(Number(threshold), countryId)
  const report = outliers.data

  return (
    <Stack>
      <PageHeader
        title="Pay outliers"
        description="Full-time staff paid far from the median of their peers: same job title, same country. A starting list for pay reviews."
      />
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <Group>
            <SegmentedControl data={THRESHOLDS} value={threshold} onChange={setThreshold} aria-label="Distance from peer median" />
            <Select placeholder="All countries" clearable w={200} aria-label="Country"
              data={(reference.data?.countries ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
              value={countryId ? String(countryId) : null} onChange={(v) => setCountryId(v ? Number(v) : null)} />
          </Group>
          {report && (
            <Text size="sm" c="dimmed">
              {report.total} people: {report.below} below and {report.total - report.below} above their peer median
              {report.total > report.data.length ? ` · showing the ${report.data.length} furthest out` : ''}
            </Text>
          )}
        </Group>
        {outliers.isPending ? <Loading /> : outliers.isError ? <LoadError error={outliers.error} /> : report!.data.length === 0 ? (
          <Center py="xl"><Text c="dimmed">Nobody is that far from their peers.</Text></Center>
        ) : (
          <Table.ScrollContainer minWidth={850}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Employee</Table.Th>
                  <Table.Th>Job title</Table.Th>
                  <Table.Th>Country</Table.Th>
                  <Table.Th ta="right">Salary</Table.Th>
                  <Table.Th ta="right">Peer median</Table.Th>
                  <Table.Th ta="right">Difference</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {report!.data.map((row) => (
                  <Table.Tr key={row.employee.id}>
                    <Table.Td>
                      <Anchor component={Link} to={`/employees/${row.employee.id}`} size="sm" fw={500}>{row.employee.full_name}</Anchor>
                      <Text size="xs" c="dimmed">{row.employee.employee_code}</Text>
                    </Table.Td>
                    <Table.Td><Text size="sm">{row.job_title.name}</Text></Table.Td>
                    <Table.Td><Text size="sm">{row.country.name}</Text></Table.Td>
                    <Table.Td ta="right"><Text size="sm" fw={500}>{formatMoney(row.salary, row.currency_code)}</Text></Table.Td>
                    <Table.Td ta="right">
                      <Text size="sm">{formatMoney(row.peer_median, row.currency_code)}</Text>
                      <Text size="xs" c="dimmed">{row.peer_count} peers</Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Badge color={row.deviation_percent < 0 ? 'red' : 'orange'} variant="light">
                        {formatPercent(row.deviation_percent)}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>
    </Stack>
  )
}
