# Answers "how do we pay people?" with SQL aggregates, never by loading employees into Ruby.
#
# Pay statistics (min / median / average / max) only count full-time staff by default: part-time and
# contractor pay is not comparable and would drag the numbers down. Headcount and payroll totals count
# everyone, because that is what the org actually spends.
class PayInsights
  OUTLIER_MIN_PEERS = 5
  DEFAULT_OUTLIER_THRESHOLD = 0.25

  def initialize(employment_type: "full_time")
    @employment_type = Employee::EMPLOYMENT_TYPES.include?(employment_type) ? employment_type : nil
  end

  attr_reader :employment_type

  def summary
    row = Employee.joins(:country).pick(
      Arel.sql("COUNT(*)"),
      Arel.sql("COALESCE(SUM(employees.salary * countries.usd_rate), 0)"),
      Arel.sql("COUNT(DISTINCT employees.country_id)")
    )
    median = comparable_scope.joins(:country)
                             .pick(Arel.sql("percentile_cont(0.5) WITHIN GROUP (ORDER BY employees.salary * countries.usd_rate)"))
    { headcount: row[0], total_payroll_usd: money(row[1]), countries: row[2], median_salary_usd: money(median) }
  end

  # One row per country, in local currency, plus the USD figures needed to compare countries.
  def by_country
    stats = comparable_scope.joins(:country)
                            .group("countries.id")
                            .select("countries.id AS country_id", *local_stat_columns,
                                    "percentile_cont(0.5) WITHIN GROUP (ORDER BY employees.salary * countries.usd_rate) AS median_usd")
                            .index_by(&:country_id)
    totals = headcount_and_payroll("countries.id")

    Country.order(:name).filter_map do |country|
      total = totals[country.id]
      next unless total

      stat = stats[country.id]
      { country: country_ref(country), currency_code: country.currency_code, headcount: total[:headcount],
        total_payroll_usd: total[:payroll_usd], stats: stat && local_stats(stat), median_usd: stat && money(stat.median_usd) }
    end
  end

  # One row per job title inside one country, in that country's currency.
  def by_job_title(country)
    comparable_scope.where(country_id: country.id)
                    .joins(:job_title)
                    .group("job_titles.id", "job_titles.name")
                    .select("job_titles.id AS job_title_id", "job_titles.name AS job_title_name", *local_stat_columns)
                    .order("job_titles.name")
                    .map do |row|
      { job_title: { id: row.job_title_id, name: row.job_title_name }, currency_code: country.currency_code,
        **local_stats(row) }
    end
  end

  def by_department
    medians = comparable_scope.joins(:country).group(:department_id)
                              .pluck(:department_id, Arel.sql("percentile_cont(0.5) WITHIN GROUP (ORDER BY employees.salary * countries.usd_rate)"))
                              .to_h
    totals = headcount_and_payroll("employees.department_id")

    Department.order(:name).filter_map do |department|
      total = totals[department.id]
      next unless total

      { department: { id: department.id, name: department.name }, headcount: total[:headcount],
        total_payroll_usd: total[:payroll_usd], median_usd: money(medians[department.id]) }
    end
  end

  # People paid more than `threshold` above or below the median of their peers (same country and job title).
  # Groups with fewer than OUTLIER_MIN_PEERS people are skipped: a median of two people means little.
  def outliers(threshold: DEFAULT_OUTLIER_THRESHOLD, country_id: nil, limit: 100)
    peers = comparable_scope.group(:country_id, :job_title_id)
                            .having("COUNT(*) >= ?", OUTLIER_MIN_PEERS)
                            .select(:country_id, :job_title_id,
                                    "percentile_cont(0.5) WITHIN GROUP (ORDER BY salary) AS peer_median",
                                    "COUNT(*) AS peer_count")
    deviation = "(employees.salary - peers.peer_median) / peers.peer_median"

    scope = comparable_scope
            .joins("JOIN (#{peers.to_sql}) peers ON peers.country_id = employees.country_id " \
                   "AND peers.job_title_id = employees.job_title_id")
            .where("ABS(#{deviation}) > ?", threshold)
    scope = scope.where(country_id: country_id) if country_id.present?

    employees = scope.includes(:country, :department, :job_title)
                     .select("employees.*", "peers.peer_median", "peers.peer_count", "#{deviation} AS deviation")
                     .order(Arel.sql("ABS(#{deviation}) DESC, employees.id"))
                     .limit(limit)

    { threshold: threshold, total: scope.count, below: scope.where("#{deviation} < 0").count,
      data: employees.map { |e| outlier_row(e) } }
  end

  private

  def comparable_scope
    employment_type ? Employee.where(employment_type: employment_type) : Employee.all
  end

  def local_stat_columns
    [ "COUNT(*) AS stat_count", "MIN(employees.salary) AS min_salary", "MAX(employees.salary) AS max_salary",
      "AVG(employees.salary) AS avg_salary",
      "percentile_cont(0.5) WITHIN GROUP (ORDER BY employees.salary) AS median_salary" ]
  end

  def local_stats(row)
    { count: row.stat_count, min: money(row.min_salary), median: money(row.median_salary),
      average: money(row.avg_salary), max: money(row.max_salary) }
  end

  def headcount_and_payroll(group_column)
    Employee.joins(:country).group(Arel.sql(group_column))
            .pluck(Arel.sql(group_column), Arel.sql("COUNT(*)"), Arel.sql("SUM(employees.salary * countries.usd_rate)"))
            .to_h { |id, count, payroll| [ id, { headcount: count, payroll_usd: money(payroll) } ] }
  end

  def outlier_row(employee)
    { employee: { id: employee.id, employee_code: employee.employee_code, full_name: employee.full_name },
      country: country_ref(employee.country), job_title: { id: employee.job_title.id, name: employee.job_title.name },
      department: { id: employee.department.id, name: employee.department.name },
      currency_code: employee.country.currency_code, salary: money(employee.salary),
      peer_median: money(employee.peer_median), peer_count: employee.peer_count,
      deviation_percent: (employee.deviation.to_f * 100).round(1) }
  end

  def country_ref(country)
    { id: country.id, code: country.code, name: country.name }
  end

  # Money goes out as a string with 2 decimals so the UI never sees float rounding.
  def money(value)
    value.nil? ? nil : format("%.2f", value.to_d.round(2))
  end
end
