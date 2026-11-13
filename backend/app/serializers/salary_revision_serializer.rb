class SalaryRevisionSerializer
  def self.call(revision)
    {
      id: revision.id,
      previous_salary: revision.previous_salary&.to_s("F"),
      new_salary: revision.new_salary.to_s("F"),
      currency_code: revision.currency_code,
      change_percent: change_percent(revision),
      reason: revision.reason,
      effective_on: revision.effective_on.iso8601,
      note: revision.note,
      recorded_at: revision.created_at.iso8601
    }
  end

  def self.change_percent(revision)
    return nil if revision.previous_salary.blank?

    ((revision.new_salary - revision.previous_salary) / revision.previous_salary * 100).round(1).to_f
  end
end
