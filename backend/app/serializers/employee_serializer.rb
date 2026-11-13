class EmployeeSerializer
  def self.call(employee)
    {
      id: employee.id,
      employee_code: employee.employee_code,
      first_name: employee.first_name,
      last_name: employee.last_name,
      full_name: employee.full_name,
      email: employee.email,
      employment_type: employee.employment_type,
      hire_date: employee.hire_date.iso8601,
      salary: employee.salary.to_s("F"),
      currency_code: employee.country.currency_code,
      salary_usd: employee.salary_usd.to_s("F"),
      country: { id: employee.country.id, code: employee.country.code, name: employee.country.name },
      department: { id: employee.department.id, name: employee.department.name },
      job_title: { id: employee.job_title.id, name: employee.job_title.name },
      lock_version: employee.lock_version
    }
  end
end
