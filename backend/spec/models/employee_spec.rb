require "rails_helper"

RSpec.describe Employee do
  describe "validations" do
    it "is valid with the factory defaults" do
      expect(build(:employee)).to be_valid
    end

    it "requires a positive salary" do
      employee = build(:employee, salary: 0)

      expect(employee).not_to be_valid
      expect(employee.errors[:salary]).to be_present
    end

    it "rejects a hire date in the future" do
      employee = build(:employee, hire_date: Date.current + 1)

      expect(employee).not_to be_valid
      expect(employee.errors[:hire_date]).to include("can't be in the future")
    end

    it "accepts a hire date of today" do
      expect(build(:employee, hire_date: Date.current)).to be_valid
    end

    it "treats emails as case-insensitive and unique" do
      create(:employee, email: "Asha.Rao@ACME.test")
      duplicate = build(:employee, email: " asha.rao@acme.test ")

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:email]).to include("has already been taken")
    end

    it "rejects an unknown employment type" do
      employee = build(:employee, employment_type: "intern")

      expect(employee).not_to be_valid
      expect(employee.errors[:employment_type]).to be_present
    end
  end

  describe "creating an employee" do
    it "records the starting salary as a hire revision" do
      country = create(:country, :india)
      employee = create(:employee, country: country, salary: 1_200_000, hire_date: Date.new(2023, 1, 9))

      revision = employee.salary_revisions.sole
      expect(revision).to have_attributes(
        reason: "hire", previous_salary: nil, new_salary: 1_200_000, currency_code: "INR",
        effective_on: Date.new(2023, 1, 9)
      )
    end
  end

  describe "employee code" do
    it "is assigned automatically when left blank" do
      create(:employee, employee_code: "ACME-00041")

      expect(create(:employee, employee_code: "").employee_code).to eq("ACME-00042")
    end

    it "keeps a code that was given" do
      expect(create(:employee, employee_code: "CONTRACT-7").employee_code).to eq("CONTRACT-7")
    end
  end

  describe "#revise_salary!" do
    let(:employee) { create(:employee, salary: 1_000_000) }

    it "changes the salary and records the old and new values with a reason" do
      employee.revise_salary!(new_salary: 1_100_000, reason: "annual_review",
                              effective_on: Date.new(2024, 4, 1), note: "Exceeds expectations")

      expect(employee.reload.salary).to eq(1_100_000)
      expect(employee.salary_revisions.last).to have_attributes(
        reason: "annual_review", previous_salary: 1_000_000, new_salary: 1_100_000,
        effective_on: Date.new(2024, 4, 1), note: "Exceeds expectations"
      )
    end

    it "changes nothing when the reason is invalid" do
      expect {
        employee.revise_salary!(new_salary: 1_100_000, reason: "because")
      }.to raise_error(ActiveRecord::RecordInvalid)

      expect(employee.reload.salary).to eq(1_000_000)
      expect(employee.salary_revisions.count).to eq(1)
    end

    it "changes nothing when the new salary is invalid" do
      expect {
        employee.revise_salary!(new_salary: -5, reason: "correction")
      }.to raise_error(ActiveRecord::RecordInvalid)

      expect(employee.reload.salary).to eq(1_000_000)
    end
  end

  describe "updating" do
    let(:employee) { create(:employee) }

    it "refuses a salary change made outside a revision" do
      expect(employee.update(salary: 2_000_000)).to be(false)
      expect(employee.errors[:salary]).to include("can only be changed with a salary revision")
    end

    it "refuses a country change" do
      expect(employee.update(country: create(:country))).to be(false)
      expect(employee.errors[:country]).to include("can't be changed after hiring")
    end

    it "allows other fields to change" do
      expect(employee.update(first_name: "Meera", department: create(:department))).to be(true)
    end
  end

  describe "#salary_usd" do
    it "converts the local salary with the country's fixed rate" do
      employee = build(:employee, country: build(:country, :germany), salary: 60_000)

      expect(employee.salary_usd).to eq(66_000)
    end
  end
end
