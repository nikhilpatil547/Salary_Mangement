require "rails_helper"

RSpec.describe SalaryRevision do
  it "cannot be edited once saved, so the history stays trustworthy" do
    revision = create(:employee).salary_revisions.first

    expect { revision.update!(new_salary: 1) }.to raise_error(ActiveRecord::ReadOnlyRecord)
  end
end
