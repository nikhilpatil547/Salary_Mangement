import { Alert, Button, Group, Modal, NumberInput, Select, Stack, Text, Textarea } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'
import { useReviseSalary } from '../api/hooks'
import type { Employee, RevisionReason } from '../api/types'
import { formatMoney, formatPercent, percentChange, REASON_LABELS, todayIso } from '../lib/format'
import { formErrorsFrom } from '../lib/serverErrors'

interface Props {
  opened: boolean
  onClose: () => void
  employee: Employee
  reasons: RevisionReason[]
}

interface Values {
  new_salary: number | string
  reason: RevisionReason | null
  effective_on: string | null
  note: string
}

export function SalaryRevisionModal({ opened, onClose, employee, reasons }: Props) {
  const revise = useReviseSalary(employee.id)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<Values>({
    initialValues: { new_salary: '', reason: null, effective_on: todayIso(), note: '' },
    validate: {
      new_salary: (v) => (Number(v) > 0 ? null : 'Enter the new annual salary'),
      reason: (v) => (v ? null : 'Choose why the salary is changing'),
      effective_on: (v) => (v ? null : 'Choose when it takes effect'),
      note: (v) => (v.length <= 500 ? null : 'Keep the note under 500 characters'),
    },
  })

  useEffect(() => {
    if (opened) {
      form.setValues({ new_salary: '', reason: null, effective_on: todayIso(), note: '' })
      form.clearErrors()
      setFormError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened])

  const change = percentChange(Number(employee.salary), Number(form.values.new_salary))

  const submit = form.onSubmit(async (values) => {
    setFormError(null)
    try {
      await revise.mutateAsync({
        new_salary: String(values.new_salary), reason: values.reason!, effective_on: values.effective_on!,
        note: values.note.trim() || undefined,
      })
      notifications.show({ color: 'green', message: 'Salary updated' })
      onClose()
    } catch (error) {
      const { fieldErrors, message } = formErrorsFrom(error, ['new_salary', 'reason', 'effective_on', 'note', 'salary'])
      if (fieldErrors.salary) fieldErrors.new_salary = fieldErrors.salary
      form.setErrors(fieldErrors)
      setFormError(message)
    }
  })

  return (
    <Modal opened={opened} onClose={onClose} title={`Change salary: ${employee.full_name}`}>
      <form onSubmit={submit} noValidate>
        <Stack>
          {formError && <Alert color="red">{formError}</Alert>}
          <Text size="sm">Current salary: <b>{formatMoney(employee.salary, employee.currency_code)}</b> a year</Text>
          <NumberInput label="New annual salary" required min={0} thousandSeparator="," decimalScale={2}
            description={`In ${employee.currency_code}${change !== null ? ` · ${formatPercent(change)} vs current` : ''}`}
            {...form.getInputProps('new_salary')} />
          <Select label="Reason" required data={reasons.map((r) => ({ value: r, label: REASON_LABELS[r] }))}
            {...form.getInputProps('reason')} />
          <DateInput label="Effective from" required valueFormat="D MMM YYYY" {...form.getInputProps('effective_on')} />
          <Textarea label="Note" placeholder="Optional, e.g. the review outcome" autosize minRows={2} maxLength={500}
            {...form.getInputProps('note')} />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={revise.isPending}>Save salary change</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
