# One row per pay change. Rows are never edited: a mistake is fixed by a new "correction" revision,
# so the history always shows what HR saw at the time.
class SalaryRevision < ApplicationRecord
  REASONS = %w[hire annual_review promotion market_adjustment correction].freeze

  belongs_to :employee

  validates :new_salary, numericality: { greater_than: 0 }
  validates :currency_code, presence: true
  validates :reason, inclusion: { in: REASONS }
  validates :effective_on, presence: true
  validates :note, length: { maximum: 500 }
  validate :hire_is_only_the_first_revision

  scope :chronological, -> { order(:effective_on, :id) }

  private

  def hire_is_only_the_first_revision
    if reason == "hire" && previous_salary.present?
      errors.add(:reason, "hire can only be used for the starting salary")
    elsif reason != "hire" && previous_salary.blank?
      errors.add(:previous_salary, "is required for a salary change")
    end
  end

  public

  def readonly?
    persisted?
  end
end
