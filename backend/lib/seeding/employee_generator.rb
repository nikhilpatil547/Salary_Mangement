module Seeding
  # Builds the demo organisation: reference tables, then employees and their salary history, inserted in
  # bulk. The same seed always produces the same rows, so demos and screenshots are repeatable.
  class EmployeeGenerator
    BATCH_SIZE = 1_000
    HIRE_WINDOW = (Date.new(2015, 1, 1)..Date.new(2026, 10, 31))
    EMPLOYMENT_TYPES = [ [ "full_time", 88 ], [ "part_time", 7 ], [ "contractor", 5 ] ].freeze
    PART_TIME_FACTOR = 0.6
    # Currencies with small units are rounded to a coarser step so salaries look like real offers.
    ROUNDING_STEP = Hash.new(100).merge("INR" => 1_000, "JPY" => 10_000).freeze

    def initialize(count:, seed: 2026, logger: nil)
      @count = count
      @random = Random.new(seed)
      @logger = logger
    end

    def call
      ActiveRecord::Base.transaction do
        countries, departments, job_titles = seed_reference_data
        now = Time.current

        (1..@count).each_slice(BATCH_SIZE) do |numbers|
          rows = numbers.map { |number| employee_row(number, countries, departments, job_titles, now) }
          ids = Employee.insert_all!(rows.map { |row| row.except(:history) }, returning: :id).rows.flatten
          revisions = ids.zip(rows).flat_map { |id, row| row[:history].map { |rev| rev.merge(employee_id: id, created_at: now) } }
          SalaryRevision.insert_all!(revisions)
          @logger&.info("Seeded #{numbers.last} of #{@count} employees")
        end
      end
    end

    private

    def seed_reference_data
      now = Time.current
      Country.upsert_all(ReferenceCatalog::COUNTRIES.map { |c| c.slice(:code, :name, :currency_code, :usd_rate).merge(created_at: now, updated_at: now) }, unique_by: :code)
      Department.upsert_all(ReferenceCatalog::DEPARTMENTS.map { |name| { name: name, created_at: now, updated_at: now } }, unique_by: :name)
      JobTitle.upsert_all(ReferenceCatalog::JOB_TITLES.map { |t| { name: t[:name], created_at: now, updated_at: now } }, unique_by: :name)

      [ Country.all.index_by(&:code), Department.all.index_by(&:name), JobTitle.all.index_by(&:name) ]
    end

    def employee_row(number, countries, departments, job_titles, now)
      country_spec = weighted_pick(ReferenceCatalog::COUNTRIES)
      title_spec = weighted_pick(ReferenceCatalog::JOB_TITLES)
      country = countries.fetch(country_spec[:code])
      first_name = pick(ReferenceCatalog::FIRST_NAMES)
      last_name = pick(ReferenceCatalog::LAST_NAMES)
      employment_type = weighted_pick(EMPLOYMENT_TYPES.map { |type, weight| { type: type, weight: weight } })[:type]
      hire_date = random_date(HIRE_WINDOW)
      salary = current_salary(title_spec, country_spec, country, employment_type)

      {
        employee_code: format("ACME-%05d", number),
        first_name: first_name,
        last_name: last_name,
        email: "#{first_name}.#{last_name}.#{number}@acme.example".downcase,
        country_id: country.id,
        department_id: departments.fetch(title_spec[:department]).id,
        job_title_id: job_titles.fetch(title_spec[:name]).id,
        employment_type: employment_type,
        hire_date: hire_date,
        salary: salary,
        created_at: now,
        updated_at: now,
        history: salary_history(salary, hire_date, country)
      }
    end

    # Current pay is drawn around the market median for the title and country. About 3% of people are
    # deliberately far from it, so the outlier report has something real to find.
    def current_salary(title_spec, country_spec, country, employment_type)
      usd = title_spec[:us_median] * country_spec[:pay_factor] * spread
      usd *= outlier_factor
      usd *= PART_TIME_FACTOR if employment_type == "part_time"
      round_to_step(usd / country.usd_rate.to_f, ROUNDING_STEP[country.currency_code])
    end

    # Works backwards from today's salary: one raise per year of service at most, so older hires have a
    # longer history and the latest revision always matches the current salary.
    def salary_history(current_salary, hire_date, country)
      step = ROUNDING_STEP[country.currency_code]
      changes = []
      salary = current_salary
      review_date = Date.new(HIRE_WINDOW.end.year, 4, 1)

      while review_date > hire_date + 1.year && changes.size < 4
        if @random.rand < 0.7
          reason = @random.rand < 0.15 ? "promotion" : "annual_review"
          raise_pct = reason == "promotion" ? 0.10 + @random.rand * 0.08 : 0.02 + @random.rand * 0.06
          previous = round_to_step(salary / (1 + raise_pct), step)
          changes << revision(previous, salary, reason, review_date, country)
          salary = previous
        end
        review_date = review_date.prev_year
      end

      [ revision(nil, salary, "hire", hire_date, country), *changes.reverse ]
    end

    def revision(previous, new_salary, reason, effective_on, country)
      { previous_salary: previous, new_salary: new_salary, currency_code: country.currency_code,
        reason: reason, effective_on: effective_on }
    end

    # Roughly bell-shaped between 0.8 and 1.2 of the median.
    def spread
      0.8 + (@random.rand + @random.rand + @random.rand + @random.rand) / 10
    end

    def outlier_factor
      roll = @random.rand
      return 0.6 if roll < 0.015
      return 1.55 if roll < 0.03

      1.0
    end

    def round_to_step(amount, step)
      [ (amount / step).round * step, step ].max
    end

    def random_date(range)
      range.begin + @random.rand((range.end - range.begin).to_i + 1)
    end

    def pick(list)
      list[@random.rand(list.size)]
    end

    def weighted_pick(items)
      target = @random.rand * items.sum { |item| item[:weight] }
      items.each do |item|
        target -= item[:weight]
        return item if target < 0
      end
      items.last
    end
  end
end
