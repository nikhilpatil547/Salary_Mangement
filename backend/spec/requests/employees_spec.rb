require "rails_helper"

RSpec.describe "Employees API" do
  let(:india) { create(:country, :india) }
  let(:germany) { create(:country, :germany) }
  let(:engineering) { create(:department, name: "Engineering") }
  let(:sales) { create(:department, name: "Sales") }
  let(:engineer) { create(:job_title, name: "Software Engineer") }

  def json
    response.parsed_body
  end

  describe "GET /api/employees" do
    before do
      create(:employee, first_name: "Asha", last_name: "Rao", country: india, department: engineering,
                        job_title: engineer, salary: 3_000_000)          # 35,400 USD
      create(:employee, first_name: "Lena", last_name: "Fischer", country: germany, department: engineering,
                        job_title: engineer, salary: 70_000)             # 77,000 USD
      create(:employee, first_name: "Omar", last_name: "Khan", country: india, department: sales,
                        salary: 1_000_000, employment_type: "part_time")
    end

    it "returns a page of employees with paging details" do
      get "/api/employees", params: { per_page: 2 }

      expect(response).to have_http_status(:ok)
      expect(json["data"].size).to eq(2)
      expect(json["meta"]).to eq("page" => 1, "per_page" => 2, "total" => 3, "total_pages" => 2)
    end

    it "sorts by name by default" do
      get "/api/employees"

      expect(json["data"].map { |e| e["last_name"] }).to eq(%w[Fischer Khan Rao])
    end

    it "searches by part of the full name, ignoring case" do
      get "/api/employees", params: { q: "sha r" }

      expect(json["data"].map { |e| e["full_name"] }).to eq([ "Asha Rao" ])
    end

    it "treats search wildcards as plain text" do
      get "/api/employees", params: { q: "%" }

      expect(json["data"]).to be_empty
    end

    it "combines filters" do
      get "/api/employees", params: { country_id: india.id, department_id: engineering.id }

      expect(json["data"].map { |e| e["full_name"] }).to eq([ "Asha Rao" ])
    end

    it "accepts several ids for one filter" do
      get "/api/employees", params: { department_id: "#{engineering.id},#{sales.id}", employment_type: "part_time" }

      expect(json["data"].map { |e| e["full_name"] }).to eq([ "Omar Khan" ])
    end

    it "sorts salaries by their USD value, not the local number" do
      get "/api/employees", params: { sort: "salary_usd", direction: "desc" }

      expect(json["data"].map { |e| e["last_name"] }).to eq(%w[Fischer Rao Khan])
    end

    it "falls back to safe defaults for bad paging and sort values" do
      get "/api/employees", params: { page: "-3", per_page: "9999", sort: "salary; DROP TABLE employees" }

      expect(response).to have_http_status(:ok)
      expect(json["meta"]).to include("page" => 1, "per_page" => 100)
    end

    it "includes local salary, currency and USD value" do
      get "/api/employees", params: { q: "Fischer" }

      expect(json["data"].first).to include("salary" => "70000.0", "currency_code" => "EUR", "salary_usd" => "77000.0")
    end

    it "exports the filtered list as CSV in the same order" do
      get "/api/employees.csv", params: { country_id: india.id, sort: "name" }

      rows = CSV.parse(response.body)
      expect(response.media_type).to eq("text/csv")
      expect(rows.first).to include("employee_code", "salary", "currency_code")
      expect(rows.drop(1).map { |r| r[2] }).to eq(%w[Khan Rao])
    end
  end

  describe "POST /api/employees" do
    let(:valid) do
      { employee_code: "ACME-90001", first_name: "Priya", last_name: "Nair", email: "priya.nair@acme.example",
        country_id: india.id, department_id: engineering.id, job_title_id: engineer.id,
        employment_type: "full_time", hire_date: "2025-06-02", salary: "2400000" }
    end

    it "creates the employee and their starting salary record" do
      post "/api/employees", params: { employee: valid }

      expect(response).to have_http_status(:created)
      expect(json).to include("full_name" => "Priya Nair", "currency_code" => "INR")
      expect(Employee.last.salary_revisions.sole.reason).to eq("hire")
    end

    it "returns field errors when the data is invalid" do
      post "/api/employees", params: { employee: valid.merge(email: "not-an-email", salary: "0") }

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"].keys).to contain_exactly("email", "salary")
    end
  end

  describe "PATCH /api/employees/:id" do
    let(:employee) { create(:employee, country: india, salary: 1_000_000) }

    it "updates profile fields" do
      patch "/api/employees/#{employee.id}", params: { employee: { last_name: "Iyer", department_id: sales.id } }

      expect(response).to have_http_status(:ok)
      expect(json).to include("last_name" => "Iyer", "department" => hash_including("name" => "Sales"))
    end

    it "ignores salary and country, which have their own flows" do
      patch "/api/employees/#{employee.id}", params: { employee: { salary: "5", country_id: germany.id } }

      expect(employee.reload).to have_attributes(salary: 1_000_000, country_id: india.id)
    end

    it "refuses to overwrite a change someone else just made" do
      stale_version = employee.lock_version
      employee.update!(first_name: "Changed")

      patch "/api/employees/#{employee.id}", params: { employee: { first_name: "Mine", lock_version: stale_version } }

      expect(response).to have_http_status(:conflict)
      expect(employee.reload.first_name).to eq("Changed")
    end
  end

  describe "DELETE /api/employees/:id" do
    it "removes the employee and their history" do
      employee = create(:employee)

      delete "/api/employees/#{employee.id}"

      expect(response).to have_http_status(:no_content)
      expect(SalaryRevision.where(employee_id: employee.id)).to be_empty
    end
  end

  it "returns 404 for an unknown employee" do
    get "/api/employees/0"

    expect(response).to have_http_status(:not_found)
  end
end
