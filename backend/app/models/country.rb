class Country < ApplicationRecord
  has_many :employees, dependent: :restrict_with_error

  validates :code, presence: true, uniqueness: true, length: { is: 2 }
  validates :name, presence: true, uniqueness: true
  validates :currency_code, presence: true, length: { is: 3 }
  validates :usd_rate, numericality: { greater_than: 0 }

  def to_usd(amount)
    (amount.to_d * usd_rate).round(2)
  end
end
