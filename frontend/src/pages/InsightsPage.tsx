import { Card, Group, Progress, SegmentedControl, Select, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core'
import { useState } from 'react'
import { useCountryInsights, useDepartmentInsights, useJobTitleInsights, useSummary } from '../api/hooks'
import type { CountryInsight, StatsScope } from '../api/types'
import { PageHeader } from '../components/PageHeader'
import { LoadError, Loading } from '../components/QueryState'
import { StatCard } from '../components/StatCard'
import { formatCompactUsd, formatMoney } from '../lib/format'

const SCOPE_OPTIONS = [
  { value: 'full_time', label: 'Full-time only' },
  { value: 'all', label: 'Everyone' },
]

function CountryTable({ rows, selected, onSelect }: { rows: CountryInsight[]; selected: number | null; onSelect: (id: number) => void }) {
  return (
    <Table.ScrollContainer minWidth={800}>
      <Table highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Country</Table.Th>
            <Table.Th ta="right">Headcount</Table.Th>
            <Table.Th ta="right">Minimum</Table.Th>
            <Table.Th ta="right">Median</Table.Th>
            <Table.Th ta="right">Average</Table.Th>
            <Table.Th ta="right">Maximum</Table.Th>
            <Table.Th ta="right">Median (USD)</Table.Th>
            <Table.Th ta="right">Payroll (USD)</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.country.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(row.country.id)}
              bg={selected === row.country.id ? 'var(--mantine-color-indigo-light)' : undefined}>
              <Table.Td><Text size="sm" fw={500}>{row.country.name}</Text><Text size="xs" c="dimmed">{row.currency_code}</Text></Table.Td>
              <Table.Td ta="right">{row.headcount.toLocaleString()}</Table.Td>
              <Table.Td ta="right">{formatMoney(row.stats?.min, row.currency_code)}</Table.Td>
              <Table.Td ta="right"><b>{formatMoney(row.stats?.median, row.currency_code)}</b></Table.Td>
              <Table.Td ta="right">{formatMoney(row.stats?.average, row.currency_code)}</Table.Td>
              <Table.Td ta="right">{formatMoney(row.stats?.max, row.currency_code)}</Table.Td>
              <Table.Td ta="right">{formatMoney(row.median_usd, 'USD')}</Table.Td>
              <Table.Td ta="right">{formatCompactUsd(row.total_payroll_usd)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

function JobTitleBreakdown({ countries, countryId, onCountry, scope }: {
  countries: CountryInsight[]; countryId: number | null; onCountry: (id: number | null) => void; scope: StatsScope
}) {
  const titles = useJobTitleInsights(countryId, scope)
  const country = countries.find((c) => c.country.id === countryId)

  return (
    <Card withBorder>
      <Group justify="space-between" mb="sm">
        <Stack gap={0}>
          <Title order={4}>Pay by job title</Title>
          <Text size="sm" c="dimmed">In local currency, so exchange rates do not distort the comparison.</Text>
        </Stack>
        <Select aria-label="Country for job title breakdown" placeholder="Choose a country" w={220} searchable
          data={countries.map((c) => ({ value: String(c.country.id), label: c.country.name }))}
          value={countryId ? String(countryId) : null} onChange={(v) => onCountry(v ? Number(v) : null)} />
      </Group>
      {!countryId ? <Text c="dimmed" size="sm">Choose a country, or click one in the table above.</Text>
        : titles.isPending ? <Loading /> : titles.isError ? <LoadError error={titles.error} /> : (
          <Table.ScrollContainer minWidth={700}>
            <Table verticalSpacing="xs" striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Job title</Table.Th>
                  <Table.Th ta="right">People</Table.Th>
                  <Table.Th ta="right">Minimum</Table.Th>
                  <Table.Th ta="right">Median</Table.Th>
                  <Table.Th ta="right">Average</Table.Th>
                  <Table.Th ta="right">Maximum</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {titles.data.map((row) => (
                  <Table.Tr key={row.job_title.id}>
                    <Table.Td>{row.job_title.name}</Table.Td>
                    <Table.Td ta="right">{row.count}</Table.Td>
                    <Table.Td ta="right">{formatMoney(row.min, row.currency_code)}</Table.Td>
                    <Table.Td ta="right"><b>{formatMoney(row.median, row.currency_code)}</b></Table.Td>
                    <Table.Td ta="right">{formatMoney(row.average, row.currency_code)}</Table.Td>
                    <Table.Td ta="right">{formatMoney(row.max, row.currency_code)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      {country && <Text size="xs" c="dimmed" mt="xs">Showing {country.country.name} ({country.currency_code}).</Text>}
    </Card>
  )
}

function Departments({ scope }: { scope: StatsScope }) {
  const departments = useDepartmentInsights(scope)
  if (departments.isPending) return <Loading />
  if (departments.isError) return <LoadError error={departments.error} />

  const total = departments.data.reduce((sum, d) => sum + Number(d.total_payroll_usd), 0)
  return (
    <Stack gap="sm">
      {[...departments.data].sort((a, b) => Number(b.total_payroll_usd) - Number(a.total_payroll_usd)).map((d) => {
        const share = total ? (Number(d.total_payroll_usd) / total) * 100 : 0
        return (
          <Stack key={d.department.id} gap={4}>
            <Group justify="space-between">
              <Text size="sm" fw={500}>{d.department.name}</Text>
              <Text size="sm" c="dimmed">
                {d.headcount.toLocaleString()} people · median {formatMoney(d.median_usd, 'USD')} · {formatCompactUsd(d.total_payroll_usd)} ({share.toFixed(0)}%)
              </Text>
            </Group>
            <Progress value={share} aria-label={`${d.department.name} share of payroll`} />
          </Stack>
        )
      })}
    </Stack>
  )
}

export function InsightsPage() {
  const [scope, setScope] = useState<StatsScope>('full_time')
  const [countryId, setCountryId] = useState<number | null>(null)
  const summary = useSummary(scope)
  const countries = useCountryInsights(scope)

  return (
    <Stack>
      <PageHeader
        title="Pay insights"
        description="How ACME pays people. Pay figures are annual base salary."
        actions={<SegmentedControl data={SCOPE_OPTIONS} value={scope} onChange={(v) => setScope(v as StatsScope)} />}
      />
      {scope === 'full_time' && (
        <Text size="sm" c="dimmed" mt={-12}>
          Minimum, median, average and maximum count full-time staff only, so part-time pay does not pull them down.
          Headcount and payroll always count everyone.
        </Text>
      )}

      {summary.isError ? <LoadError error={summary.error} /> : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          <StatCard label="Employees" value={summary.data ? summary.data.headcount.toLocaleString() : '…'} />
          <StatCard label="Countries" value={summary.data ? String(summary.data.countries) : '…'} />
          <StatCard label="Annual payroll" value={summary.data ? formatCompactUsd(summary.data.total_payroll_usd) : '…'} hint="All staff, in USD" />
          <StatCard label="Median salary" value={summary.data ? formatMoney(summary.data.median_salary_usd, 'USD') : '…'} hint="Org-wide, in USD" />
        </SimpleGrid>
      )}

      <Card withBorder>
        <Title order={4}>Pay by country</Title>
        <Text size="sm" c="dimmed" mb="sm">Local currency, with USD columns for comparing countries. Click a country to break it down by job title.</Text>
        {countries.isPending ? <Loading /> : countries.isError ? <LoadError error={countries.error} /> : (
          <CountryTable rows={countries.data} selected={countryId} onSelect={setCountryId} />
        )}
      </Card>

      {countries.data && (
        <JobTitleBreakdown countries={countries.data} countryId={countryId} onCountry={setCountryId} scope={scope} />
      )}

      <Card withBorder>
        <Title order={4} mb="sm">Payroll by department (USD)</Title>
        <Departments scope={scope} />
      </Card>
    </Stack>
  )
}
