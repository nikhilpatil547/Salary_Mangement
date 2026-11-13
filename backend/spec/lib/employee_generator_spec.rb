require "rails_helper"

RSpec.describe Seeding::EmployeeGenerator do
  def snapshot
    Employee.order(:employee_code).pluck(:employee_code, :email, :salary, :hire_date)
  end

  it "creates the requested number of employees with valid data" do
    described_class.new(count: 60).call

    expect(Employee.count).to eq(60)
    expect(Employee.all).to all(be_valid)
  end

  it "produces the same people for the same seed" do
    described_class.new(count: 25, seed: 7).call
    first_run = snapshot
    ActiveRecord::Base.connection.truncate_tables("salary_revisions", "employees")

    described_class.new(count: 25, seed: 7).call

    expect(snapshot).to eq(first_run)
  end

  it "gives every employee a history that starts at hire and ends at the current salary" do
    described_class.new(count: 40).call

    Employee.includes(:salary_revisions).find_each do |employee|
      history = employee.salary_revisions.to_a
      expect(history.first.reason).to eq("hire")
      expect(history.first.effective_on).to eq(employee.hire_date)
      expect(history.last.new_salary).to eq(employee.salary)
      history.each_cons(2) { |before, after| expect(after.previous_salary).to eq(before.new_salary) }
    end
  end
end
