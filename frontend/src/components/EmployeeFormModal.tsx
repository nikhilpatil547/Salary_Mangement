import { Alert, Button, Grid, Group, Modal, NumberInput, Select, TextInput } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'
import { useCreateEmployee, useUpdateEmployee } from '../api/hooks'
import type { Employee, EmployeeInput, EmploymentType, ReferenceData } from '../api/types'
import { EMPLOYMENT_TYPE_LABELS, todayIso } from '../lib/format'
import { formErrorsFrom } from '../lib/serverErrors'

interface Props {
  opened: boolean
  onClose: () => void
  reference: ReferenceData
  employee?: Employee
  onSaved?: (employee: Employee) => void
}

interface Values {
  employee_code: string
  first_name: string
  last_name: string
  email: string
  country_id: string | null
  department_id: string | null
  job_title_id: string | null
  employment_type: EmploymentType
  hire_date: string | null
  salary: number | string
}

const FIELDS = ['employee_code', 'first_name', 'last_name', 'email', 'country_id', 'department_id', 'job_title_id',
  'employment_type', 'hire_date', 'salary']

function initialValues(employee?: Employee): Values {
  return {
    employee_code: employee?.employee_code ?? '',
    first_name: employee?.first_name ?? '',
    last_name: employee?.last_name ?? '',
    email: employee?.email ?? '',
    country_id: employee ? String(employee.country.id) : null,
    department_id: employee ? String(employee.department.id) : null,
    job_title_id: employee ? String(employee.job_title.id) : null,
    employment_type: employee?.employment_type ?? 'full_time',
    hire_date: employee?.hire_date ?? todayIso(),
    salary: '',
  }
}

const options = (items: { id: number; name: string }[]) => items.map((i) => ({ value: String(i.id), label: i.name }))

export function EmployeeFormModal({ opened, onClose, reference, employee, onSaved }: Props) {
  const isEdit = Boolean(employee)
  const create = useCreateEmployee()
  const update = useUpdateEmployee(employee?.id ?? 0)
  const mutation = isEdit ? update : create
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<Values>({
    initialValues: initialValues(employee),
    validate: {
      first_name: (v) => (v.trim() ? null : 'First name is required'),
      last_name: (v) => (v.trim() ? null : 'Last name is required'),
      email: (v) => (/^\S+@\S+\.\S+$/.test(v.trim()) ? null : 'Enter a valid email'),
      country_id: (v) => (isEdit || v ? null : 'Choose a country'),
      department_id: (v) => (v ? null : 'Choose a department'),
      job_title_id: (v) => (v ? null : 'Choose a job title'),
      hire_date: (v) => (!v ? 'Choose a hire date' : v > todayIso() ? "Hire date can't be in the future" : null),
      salary: (v) => (isEdit || Number(v) > 0 ? null : 'Enter an annual salary above zero'),
    },
  })

  // Re-fill the form whenever it opens, so it always starts from the latest saved data.
  useEffect(() => {
    if (opened) {
      form.setValues(initialValues(employee))
      form.resetDirty()
      form.clearErrors()
      setFormError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, employee])

  const currency = reference.countries.find((c) => String(c.id) === form.values.country_id)?.currency_code

  const submit = form.onSubmit(async (values) => {
    setFormError(null)
    const input: EmployeeInput = {
      employee_code: values.employee_code.trim(),
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      email: values.email.trim(),
      department_id: Number(values.department_id),
      job_title_id: Number(values.job_title_id),
      employment_type: values.employment_type,
      hire_date: values.hire_date!,
      ...(isEdit
        ? { lock_version: employee!.lock_version }
        : { country_id: Number(values.country_id), salary: String(values.salary) }),
    }
    try {
      const saved = await mutation.mutateAsync(input)
      notifications.show({ color: 'green', message: isEdit ? 'Employee updated' : `${saved.full_name} added` })
      onClose()
      onSaved?.(saved)
    } catch (error) {
      const { fieldErrors, message } = formErrorsFrom(error, FIELDS)
      form.setErrors(fieldErrors)
      setFormError(message)
    }
  })

  return (
    <Modal opened={opened} onClose={onClose} title={isEdit ? `Edit ${employee!.full_name}` : 'Add employee'} size="lg">
      <form onSubmit={submit} noValidate>
        {formError && <Alert color="red" mb="md">{formError}</Alert>}
        <Grid>
          <Grid.Col span={6}><TextInput label="First name" required {...form.getInputProps('first_name')} /></Grid.Col>
          <Grid.Col span={6}><TextInput label="Last name" required {...form.getInputProps('last_name')} /></Grid.Col>
          <Grid.Col span={8}><TextInput label="Work email" required {...form.getInputProps('email')} /></Grid.Col>
          <Grid.Col span={4}>
            <TextInput label="Employee code" placeholder="Assigned automatically" {...form.getInputProps('employee_code')} />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select label="Country" required searchable data={options(reference.countries)} disabled={isEdit}
              description={isEdit ? 'Relocations are not supported yet' : 'Sets the pay currency'}
              {...form.getInputProps('country_id')} />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select label="Employment type" required allowDeselect={false}
              data={reference.employment_types.map((t) => ({ value: t, label: EMPLOYMENT_TYPE_LABELS[t] }))}
              {...form.getInputProps('employment_type')} />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select label="Department" required searchable data={options(reference.departments)} {...form.getInputProps('department_id')} />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select label="Job title" required searchable data={options(reference.job_titles)} {...form.getInputProps('job_title_id')} />
          </Grid.Col>
          <Grid.Col span={6}>
            <DateInput label="Hire date" required valueFormat="D MMM YYYY" maxDate={todayIso()} {...form.getInputProps('hire_date')} />
          </Grid.Col>
          {!isEdit && (
            <Grid.Col span={6}>
              <NumberInput label="Annual base salary" required min={0} thousandSeparator="," decimalScale={2}
                description={currency ? `In ${currency}` : 'Choose a country first'}
                {...form.getInputProps('salary')} />
            </Grid.Col>
          )}
        </Grid>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Save changes' : 'Add employee'}</Button>
        </Group>
      </form>
    </Modal>
  )
}
