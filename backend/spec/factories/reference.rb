FactoryBot.define do
  factory :country do
    sequence(:code) { |n| (("AA".."ZZ").to_a)[n] }
    sequence(:name) { |n| "Country #{n}" }
    currency_code { "USD" }
    usd_rate { 1 }

    trait :india do
      code { "IN" }
      name { "India" }
      currency_code { "INR" }
      usd_rate { "0.012" }
    end

    trait :germany do
      code { "DE" }
      name { "Germany" }
      currency_code { "EUR" }
      usd_rate { "1.10" }
    end
  end

  factory :department do
    sequence(:name) { |n| "Department #{n}" }
  end

  factory :job_title do
    sequence(:name) { |n| "Job Title #{n}" }
  end
end
