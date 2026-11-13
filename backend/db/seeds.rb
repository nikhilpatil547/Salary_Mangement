# Seeds the demo organisation with 10,000 employees (override with EMPLOYEE_COUNT).
# It never touches existing data unless RESEED=1 is set, so it is safe to run on every deploy.
count = Integer(ENV.fetch("EMPLOYEE_COUNT", 10_000))

if Employee.exists?
  if ENV["RESEED"] == "1"
    puts "RESEED=1: removing existing employees"
    ActiveRecord::Base.connection.truncate_tables("salary_revisions", "employees")
  else
    puts "Employees already exist; skipping seed (set RESEED=1 to replace them)"
    return
  end
end

started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
Seeding::EmployeeGenerator.new(count: count, logger: Logger.new($stdout)).call
elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started
puts format("Seeded %d employees and %d salary revisions in %.1fs", Employee.count, SalaryRevision.count, elapsed)
