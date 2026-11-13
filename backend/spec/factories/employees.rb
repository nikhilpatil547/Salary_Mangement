FactoryBot.define do
  factory :employee do
    sequence(:employee_code) { |n| format("ACME-%06d", n) }
    first_name { "Asha" }
    sequence(:last_name) { |n| "Rao#{n}" }
    sequence(:email) { |n| "employee#{n}@acme.test" }
    country
    department
    job_title
    employment_type { "full_time" }
    hire_date { Date.new(2022, 4, 1) }
    salary { 1_000_000 }
  end
end
