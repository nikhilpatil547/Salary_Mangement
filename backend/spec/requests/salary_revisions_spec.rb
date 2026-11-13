require "rails_helper"

RSpec.describe "Salary revisions API" do
  let(:employee) { create(:employee, salary: 1_000_000, hire_date: Date.new(2022, 1, 3)) }

  it "records a salary change and returns the updated employee" do
    post "/api/employees/#{employee.id}/salary_revisions",
         params: { salary_revision: { new_salary: "1100000", reason: "promotion", effective_on: "2025-04-01" } }

    expect(response).to have_http_status(:created)
    expect(response.parsed_body["revision"]).to include("previous_salary" => "1000000.0", "change_percent" => 10.0)
    expect(response.parsed_body["employee"]["salary"]).to eq("1100000.0")
  end

  it "rejects a change without a valid reason" do
    post "/api/employees/#{employee.id}/salary_revisions",
         params: { salary_revision: { new_salary: "1100000", reason: "hire" } }

    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body["errors"]).to have_key("reason")
    expect(employee.reload.salary).to eq(1_000_000)
  end

  it "lists the history newest first" do
    employee.revise_salary!(new_salary: 1_050_000, reason: "annual_review", effective_on: Date.new(2024, 4, 1))

    get "/api/employees/#{employee.id}/salary_revisions"

    expect(response.parsed_body["data"].map { |r| r["reason"] }).to eq(%w[annual_review hire])
  end
end
