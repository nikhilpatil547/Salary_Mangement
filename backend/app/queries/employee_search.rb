# Filters, searches and sorts the employee directory. Every filter is optional; unknown sort keys fall
# back to the default so a bad URL never errors.
class EmployeeSearch
  SORTS = {
    "name" => [ "employees.last_name", "employees.first_name" ],
    "employee_code" => [ "employees.employee_code" ],
    "hire_date" => [ "employees.hire_date" ],
    # Salaries are in different currencies, so they can only be ordered fairly in USD.
    "salary_usd" => [ "employees.salary * countries.usd_rate" ],
    "country" => [ "countries.name" ],
    "department" => [ "departments.name" ],
    "job_title" => [ "job_titles.name" ]
  }.freeze
  DEFAULT_SORT = "name".freeze
  MAX_QUERY_LENGTH = 100

  def initialize(params)
    @params = params
  end

  def results
    scope = Employee.joins(:country, :department, :job_title)
                    .includes(:country, :department, :job_title)
    scope = apply_filters(scope)
    scope = apply_search(scope)
    apply_sort(scope)
  end

  private

  attr_reader :params

  def apply_filters(scope)
    { country_id: :country_id, department_id: :department_id, job_title_id: :job_title_id }.each do |param, column|
      ids = id_list(params[param])
      scope = scope.where(column => ids) if ids.any?
    end
    type = params[:employment_type].presence
    scope = scope.where(employment_type: type) if Employee::EMPLOYMENT_TYPES.include?(type)
    scope
  end

  def apply_search(scope)
    term = params[:q].to_s.strip.first(MAX_QUERY_LENGTH)
    return scope if term.empty?

    pattern = "%#{Employee.sanitize_sql_like(term)}%"
    scope.where(
      "(employees.first_name || ' ' || employees.last_name) ILIKE :pattern " \
      "OR employees.employee_code ILIKE :pattern OR employees.email ILIKE :pattern",
      pattern: pattern
    )
  end

  def apply_sort(scope)
    columns = SORTS.fetch(params[:sort].to_s, SORTS[DEFAULT_SORT])
    direction = params[:direction].to_s.downcase == "desc" ? "DESC" : "ASC"
    order = columns.map { |column| "#{column} #{direction}" }
    # The id tie-breaker keeps page boundaries stable when many rows share a value.
    scope.order(Arel.sql((order + [ "employees.id #{direction}" ]).join(", ")))
  end

  # Accepts "3", "3,5" or ["3", "5"]; ignores anything that is not a positive integer.
  def id_list(value)
    Array(value).flat_map { |v| v.to_s.split(",") }.filter_map do |raw|
      id = Integer(raw.strip, exception: false)
      id if id&.positive?
    end
  end
end
