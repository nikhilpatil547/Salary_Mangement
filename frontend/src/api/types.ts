export type EmploymentType = 'full_time' | 'part_time' | 'contractor'
export type RevisionReason = 'hire' | 'annual_review' | 'promotion' | 'market_adjustment' | 'correction'

// Money comes from the API as a decimal string so no precision is lost on the way.
export type Money = string

export interface Ref {
  id: number
  name: string
}

export interface CountryRef extends Ref {
  code: string
}

export interface Country extends CountryRef {
  currency_code: string
  usd_rate: string
}

export interface ReferenceData {
  countries: Country[]
  departments: Ref[]
  job_titles: Ref[]
  employment_types: EmploymentType[]
  revision_reasons: RevisionReason[]
}

export interface Employee {
  id: number
  employee_code: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  employment_type: EmploymentType
  hire_date: string
  salary: Money
  currency_code: string
  salary_usd: Money
  country: CountryRef
  department: Ref
  job_title: Ref
  lock_version: number
}

export interface PageMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface Page<T> {
  data: T[]
  meta: PageMeta
}

export interface SalaryRevision {
  id: number
  previous_salary: Money | null
  new_salary: Money
  currency_code: string
  change_percent: number | null
  reason: RevisionReason
  effective_on: string
  note: string | null
  recorded_at: string
}

export interface EmployeeInput {
  employee_code: string
  first_name: string
  last_name: string
  email: string
  country_id?: number
  department_id: number
  job_title_id: number
  employment_type: EmploymentType
  hire_date: string
  salary?: string
  lock_version?: number
}

export interface SalaryRevisionInput {
  new_salary: string
  reason: RevisionReason
  effective_on: string
  note?: string
}

export interface PayStats {
  count: number
  min: Money
  median: Money
  average: Money
  max: Money
}

export type StatsScope = 'full_time' | 'all'

export interface Summary {
  headcount: number
  total_payroll_usd: Money
  countries: number
  median_salary_usd: Money | null
}

export interface CountryInsight {
  country: CountryRef
  currency_code: string
  headcount: number
  total_payroll_usd: Money
  stats: PayStats | null
  median_usd: Money | null
}

export interface JobTitleInsight extends PayStats {
  job_title: Ref
  currency_code: string
}

export interface DepartmentInsight {
  department: Ref
  headcount: number
  total_payroll_usd: Money
  median_usd: Money | null
}

export interface Outlier {
  employee: { id: number; employee_code: string; full_name: string }
  country: CountryRef
  job_title: Ref
  department: Ref
  currency_code: string
  salary: Money
  peer_median: Money
  peer_count: number
  deviation_percent: number
}

export interface OutlierReport {
  threshold: number
  total: number
  below: number
  data: Outlier[]
}
