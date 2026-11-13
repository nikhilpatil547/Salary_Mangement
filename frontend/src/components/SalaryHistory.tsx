import { Badge, Table, Text } from '@mantine/core'
import type { SalaryRevision } from '../api/types'
import { formatDate, formatMoney, formatPercent, REASON_LABELS } from '../lib/format'

export function SalaryHistory({ revisions }: { revisions: SalaryRevision[] }) {
  return (
    <Table verticalSpacing="xs">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Effective</Table.Th>
          <Table.Th>Reason</Table.Th>
          <Table.Th ta="right">Salary</Table.Th>
          <Table.Th ta="right">Change</Table.Th>
          <Table.Th>Note</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {revisions.map((revision) => (
          <Table.Tr key={revision.id}>
            <Table.Td><Text size="sm">{formatDate(revision.effective_on)}</Text></Table.Td>
            <Table.Td><Badge variant="light" color={revision.reason === 'hire' ? 'gray' : 'indigo'}>{REASON_LABELS[revision.reason]}</Badge></Table.Td>
            <Table.Td ta="right"><Text size="sm" fw={500}>{formatMoney(revision.new_salary, revision.currency_code)}</Text></Table.Td>
            <Table.Td ta="right">
              <Text size="sm" c={revision.change_percent === null ? 'dimmed' : revision.change_percent < 0 ? 'red' : 'teal'}>
                {formatPercent(revision.change_percent)}
              </Text>
            </Table.Td>
            <Table.Td><Text size="sm" c="dimmed">{revision.note ?? ''}</Text></Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
