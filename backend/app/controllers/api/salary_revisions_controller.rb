module Api
  class SalaryRevisionsController < ApplicationController
    def index
      employee = Employee.find(params[:employee_id])
      render json: { data: employee.salary_revisions.reverse_order.map { |r| SalaryRevisionSerializer.call(r) } }
    end

    def create
      employee = Employee.includes(:country, :department, :job_title).find(params[:employee_id])
      attrs = params.require(:salary_revision).permit(:new_salary, :reason, :effective_on, :note)
      revision = employee.revise_salary!(
        new_salary: attrs[:new_salary], reason: attrs[:reason],
        effective_on: attrs[:effective_on].presence || Date.current, note: attrs[:note].presence
      )
      render json: { revision: SalaryRevisionSerializer.call(revision), employee: EmployeeSerializer.call(employee) },
             status: :created
    rescue ActiveRecord::RecordInvalid => e
      render_errors(e.record)
    end
  end
end
