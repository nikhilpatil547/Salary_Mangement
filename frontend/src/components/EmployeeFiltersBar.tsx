import { Button, Group, MultiSelect, Select, TextInput } from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { IconSearch, IconX } from '@tabler/icons-react'
import { useState } from 'react'
import type { ReferenceData } from '../api/types'
import { DEFAULT_FILTERS, hasActiveFilters, type EmployeeFilters } from '../lib/employeeFilters'
import { EMPLOYMENT_TYPE_LABELS } from '../lib/format'

interface Props {
  filters: EmployeeFilters
  reference?: ReferenceData
  onChange: (change: Partial<EmployeeFilters>) => void
}

const toOptions = (items: { id: number; name: string }[] = []) => items.map((i) => ({ value: String(i.id), label: i.name }))
const toIds = (values: string[]) => values.map(Number)

export function EmployeeFiltersBar({ filters, reference, onChange }: Props) {
  // The input updates instantly; the search request waits until typing pauses.
  const [query, setQuery] = useState(filters.q)
  const [syncedQuery, setSyncedQuery] = useState(filters.q)
  const pushQuery = useDebouncedCallback((q: string) => onChange({ q }), 300)
  // Follow the URL when it changes from outside the input (back button, "Clear filters").
  if (filters.q !== syncedQuery) {
    setSyncedQuery(filters.q)
    setQuery(filters.q)
  }

  return (
    <Group align="flex-end" gap="sm" wrap="wrap">
      <TextInput
        label="Search" placeholder="Name, email or employee code" leftSection={<IconSearch size={16} />}
        value={query} w={260} maxLength={100}
        onChange={(event) => { setQuery(event.currentTarget.value); pushQuery(event.currentTarget.value) }}
      />
      <MultiSelect label="Country" placeholder="All" data={toOptions(reference?.countries)} w={200} searchable clearable
        value={filters.countryIds.map(String)} onChange={(v) => onChange({ countryIds: toIds(v) })} />
      <MultiSelect label="Department" placeholder="All" data={toOptions(reference?.departments)} w={200} searchable clearable
        value={filters.departmentIds.map(String)} onChange={(v) => onChange({ departmentIds: toIds(v) })} />
      <MultiSelect label="Job title" placeholder="All" data={toOptions(reference?.job_titles)} w={220} searchable clearable
        value={filters.jobTitleIds.map(String)} onChange={(v) => onChange({ jobTitleIds: toIds(v) })} />
      <Select label="Type" placeholder="All" w={140} clearable
        data={(reference?.employment_types ?? []).map((t) => ({ value: t, label: EMPLOYMENT_TYPE_LABELS[t] }))}
        value={filters.employmentType} onChange={(v) => onChange({ employmentType: v as EmployeeFilters['employmentType'] })} />
      {hasActiveFilters(filters) && (
        <Button variant="subtle" leftSection={<IconX size={16} />}
          onClick={() => { setQuery(''); onChange({ ...DEFAULT_FILTERS, sort: filters.sort, direction: filters.direction }) }}>
          Clear filters
        </Button>
      )}
    </Group>
  )
}
