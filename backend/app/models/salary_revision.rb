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

  scope :chronological, -> { order(:effective_on, :id) }

  def readonly?
    persisted?
  end
end
