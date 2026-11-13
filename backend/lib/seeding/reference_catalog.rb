module Seeding
  # Reference data for the demo organisation. Rates are a fixed snapshot (USD per unit of local currency),
  # pay factors scale US market pay to each country, and weights decide how many people work where.
  module ReferenceCatalog
    COUNTRIES = [
      { code: "IN", name: "India",          currency_code: "INR", usd_rate: "0.0118", pay_factor: 0.27, weight: 30 },
      { code: "US", name: "United States",  currency_code: "USD", usd_rate: "1.0",    pay_factor: 1.00, weight: 20 },
      { code: "GB", name: "United Kingdom", currency_code: "GBP", usd_rate: "1.29",   pay_factor: 0.78, weight: 10 },
      { code: "DE", name: "Germany",        currency_code: "EUR", usd_rate: "1.09",   pay_factor: 0.80, weight: 8 },
      { code: "BR", name: "Brazil",         currency_code: "BRL", usd_rate: "0.18",   pay_factor: 0.33, weight: 8 },
      { code: "CA", name: "Canada",         currency_code: "CAD", usd_rate: "0.72",   pay_factor: 0.82, weight: 7 },
      { code: "JP", name: "Japan",          currency_code: "JPY", usd_rate: "0.0066", pay_factor: 0.62, weight: 7 },
      { code: "SG", name: "Singapore",      currency_code: "SGD", usd_rate: "0.76",   pay_factor: 0.85, weight: 5 },
      { code: "AU", name: "Australia",      currency_code: "AUD", usd_rate: "0.65",   pay_factor: 0.84, weight: 5 }
    ].freeze

    # US median base pay in USD for each title, and how common the title is.
    JOB_TITLES = [
      { name: "Software Engineer",           department: "Engineering", us_median: 125_000, weight: 18 },
      { name: "Senior Software Engineer",    department: "Engineering", us_median: 165_000, weight: 10 },
      { name: "Engineering Manager",         department: "Engineering", us_median: 195_000, weight: 3 },
      { name: "QA Engineer",                 department: "Engineering", us_median: 95_000,  weight: 5 },
      { name: "DevOps Engineer",             department: "Engineering", us_median: 135_000, weight: 4 },
      { name: "Data Analyst",                department: "Data",        us_median: 85_000,  weight: 5 },
      { name: "Data Scientist",              department: "Data",        us_median: 140_000, weight: 3 },
      { name: "Product Manager",             department: "Product",     us_median: 150_000, weight: 4 },
      { name: "Product Designer",            department: "Product",     us_median: 115_000, weight: 3 },
      { name: "Account Executive",           department: "Sales",       us_median: 90_000,  weight: 8 },
      { name: "Sales Manager",               department: "Sales",       us_median: 135_000, weight: 2 },
      { name: "Marketing Specialist",        department: "Marketing",   us_median: 72_000,  weight: 4 },
      { name: "Financial Analyst",           department: "Finance",     us_median: 88_000,  weight: 3 },
      { name: "Accountant",                  department: "Finance",     us_median: 72_000,  weight: 3 },
      { name: "HR Generalist",               department: "People",      us_median: 68_000,  weight: 3 },
      { name: "Recruiter",                   department: "People",      us_median: 72_000,  weight: 3 },
      { name: "Operations Coordinator",      department: "Operations",  us_median: 56_000,  weight: 5 },
      { name: "Customer Support Specialist", department: "Operations",  us_median: 50_000,  weight: 14 }
    ].freeze

    DEPARTMENTS = JOB_TITLES.map { |title| title[:department] }.uniq.freeze

    FIRST_NAMES = %w[
      Aarav Aditi Akira Alejandro Alice Amara Ananya Arjun Ben Bruna Camila Carlos Charlotte Chen Chloe Daniel
      Deepa Diego Elena Emily Emma Ethan Fatima Felix Gabriel Grace Hana Hannah Harper Ishaan Isabella Jack
      James Jonas Julia Kabir Kai Kavya Leah Lena Liam Lucas Maya Meera Mia Mohammed Noah Nina Oliver Olivia
      Priya Rafael Ravi Rohan Ryo Sakura Samuel Sara Sofia Sophie Takeshi Thiago Tom Vikram Wei Yuki Zara
    ].freeze

    LAST_NAMES = %w[
      Agarwal Almeida Anderson Bauer Brown Chen Clark Costa Das Davies Fernandes Fischer Garcia Gupta Hall
      Iyer Johnson Jones Kapoor Kato Khan Kim Kumar Lee Lewis Lim Martin Martins Meyer Miller Mishra Mueller
      Nair Nakamura Ng Oliveira Patel Pereira Reddy Rodrigues Sato Schmidt Schneider Silva Singh Smith Suzuki
      Tan Taylor Thomas Wagner Walker Wang Watanabe Weber White Williams Wilson Wong Yamamoto Young
    ].freeze
  end
end
