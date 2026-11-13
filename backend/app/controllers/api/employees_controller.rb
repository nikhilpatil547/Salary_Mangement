require "csv"

module Api
  class EmployeesController < ApplicationController
    CSV_COLUMNS = %w[employee_code first_name last_name email country department job_title employment_type
                     hire_date salary currency_code salary_usd].freeze

    def index
      scope = EmployeeSearch.new(params).results
      request.format.csv? ? stream_csv(scope) : render_page(scope)
    end

    def show
      render json: EmployeeSerializer.call(find_employee)
    end

    def create
      employee = Employee.new(create_params)
      if employee.save
        render json: EmployeeSerializer.call(employee), status: :created
      else
        render_errors(employee)
      end
    end

    def update
      employee = find_employee
      if employee.update(update_params)
        render json: EmployeeSerializer.call(employee)
      else
        render_errors(employee)
      end
    end

    def destroy
      find_employee.destroy!
      head :no_content
    end

    private

    def find_employee
      Employee.includes(:country, :department, :job_title).find(params[:id])
    end

    EDITABLE = %i[employee_code first_name last_name email department_id job_title_id employment_type hire_date].freeze

    def create_params
      params.require(:employee).permit(*EDITABLE, :country_id, :salary)
    end

    # Salary and country are left out on purpose: salary changes go through salary revisions, and a
    # country change is a relocation. lock_version makes a stale form fail instead of overwriting.
    def update_params
      params.require(:employee).permit(*EDITABLE, :lock_version)
    end

    def render_page(scope)
      pagination = Pagination.new(page: params[:page], per_page: params[:per_page])
      employees = pagination.apply(scope).to_a
      render json: { data: employees.map { |e| EmployeeSerializer.call(e) }, meta: pagination.meta(scope.count) }
    end

    def stream_csv(scope)
      headers["Content-Disposition"] = %(attachment; filename="employees-#{Date.current.iso8601}.csv")
      headers["Content-Type"] = "text/csv"
      self.response_body = Enumerator.new do |out|
        out << CSV.generate_line(CSV_COLUMNS)
        each_in_order(scope) { |employee| out << CSV.generate_line(csv_row(employee)) }
      end
    end

    # find_each would drop the user's sort order, so walk the sorted scope in fixed-size pages instead.
    def each_in_order(scope, batch_size: 1_000)
      offset = 0
      loop do
        batch = scope.limit(batch_size).offset(offset).to_a
        batch.each { |employee| yield employee }
        break if batch.size < batch_size

        offset += batch_size
      end
    end

    def csv_row(employee)
      [ employee.employee_code, employee.first_name, employee.last_name, employee.email, employee.country.name,
        employee.department.name, employee.job_title.name, employee.employment_type, employee.hire_date.iso8601,
        employee.salary.to_s("F"), employee.country.currency_code, employee.salary_usd.to_s("F") ]
    end
  end
end
