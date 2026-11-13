module Api
  # Everything the UI needs to fill its dropdowns, in one request.
  class ReferenceDataController < ApplicationController
    def show
      render json: {
        countries: Country.order(:name).map { |c| c.slice(:id, :code, :name, :currency_code).merge(usd_rate: c.usd_rate.to_s("F")) },
        departments: Department.order(:name).map { |d| d.slice(:id, :name) },
        job_titles: JobTitle.order(:name).map { |j| j.slice(:id, :name) },
        employment_types: Employee::EMPLOYMENT_TYPES,
        revision_reasons: SalaryRevision::REASONS - [ "hire" ]
      }
    end
  end
end
