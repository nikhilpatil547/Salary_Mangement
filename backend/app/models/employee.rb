class Employee < ApplicationRecord
  EMPLOYMENT_TYPES = %w[full_time part_time contractor].freeze
  MAX_SALARY = 100_000_000_000

  belongs_to :country
  belongs_to :department
  belongs_to :job_title
  has_many :salary_revisions, -> { chronological }, dependent: :delete_all, inverse_of: :employee

  enum :employment_type, EMPLOYMENT_TYPES.index_by(&:itself), validate: true

  normalizes :email, with: ->(email) { email.strip.downcase }
  normalizes :first_name, :last_name, :employee_code, with: ->(value) { value.strip }

  validates :employee_code, presence: true, uniqueness: true, length: { maximum: 20 }
  validates :first_name, :last_name, presence: true, length: { maximum: 100 }
  validates :email, presence: true, uniqueness: true, length: { maximum: 254 },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :salary, numericality: { greater_than: 0, less_than: MAX_SALARY }
  validates :hire_date, presence: true
  validate :hire_date_not_in_future

  # Salary only changes through revise_salary!, so every change has a reason on record.
  validate :salary_changed_only_through_revision, on: :update
  # Moving country changes the pay currency, which needs its own relocation flow (out of scope).
  validate :country_unchanged, on: :update

  after_create :record_hire_revision

  def full_name
    "#{first_name} #{last_name}"
  end

  def salary_usd
    country.to_usd(salary)
  end

  def revise_salary!(new_salary:, reason:, effective_on: Date.current, note: nil)
    transaction do
      lock!
      revision = salary_revisions.create!(
        previous_salary: salary, new_salary: new_salary, currency_code: country.currency_code,
        reason: reason, effective_on: effective_on, note: note
      )
      @revising_salary = true
      update!(salary: new_salary)
      revision
    ensure
      @revising_salary = false
    end
  end

  private

  def hire_date_not_in_future
    return if hire_date.blank? || hire_date <= Date.current

    errors.add(:hire_date, "can't be in the future")
  end

  def salary_changed_only_through_revision
    return unless will_save_change_to_salary? && !@revising_salary

    errors.add(:salary, "can only be changed with a salary revision")
  end

  def country_unchanged
    return unless will_save_change_to_country_id?

    errors.add(:country, "can't be changed after hiring")
  end

  def record_hire_revision
    salary_revisions.create!(
      new_salary: salary, currency_code: country.currency_code, reason: "hire", effective_on: hire_date
    )
  end
end
