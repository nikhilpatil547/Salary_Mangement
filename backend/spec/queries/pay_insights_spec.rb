require "rails_helper"

RSpec.describe PayInsights do
  let(:india) { create(:country, :india) }       # 1 INR = 0.012 USD
  let(:germany) { create(:country, :germany) }   # 1 EUR = 1.10 USD
  let(:engineering) { create(:department, name: "Engineering") }
  let(:support) { create(:department, name: "Support") }
  let(:engineer) { create(:job_title, name: "Engineer") }
  let(:analyst) { create(:job_title, name: "Analyst") }

  def hire(country:, salary:, job_title: engineer, department: engineering, employment_type: "full_time")
    create(:employee, country: country, salary: salary, job_title: job_title, department: department,
                      employment_type: employment_type)
  end

  describe "#by_country" do
    before do
      [ 1_000_000, 2_000_000, 6_000_000 ].each { |s| hire(country: india, salary: s) }
      hire(country: india, salary: 500_000, employment_type: "part_time")
      hire(country: germany, salary: 60_000)
    end

    it "returns min, median, average and max in local currency for full-time staff" do
      india_row = described_class.new.by_country.find { |row| row[:country][:code] == "IN" }

      expect(india_row[:stats]).to eq(count: 3, min: "1000000.00", median: "2000000.00",
                                       average: "3000000.00", max: "6000000.00")
      expect(india_row[:median_usd]).to eq("24000.00")
    end

    it "counts everyone in headcount and payroll" do
      india_row = described_class.new.by_country.find { |row| row[:country][:code] == "IN" }

      expect(india_row[:headcount]).to eq(4)
      expect(india_row[:total_payroll_usd]).to eq("114000.00") # 9.5M INR * 0.012
    end

    it "can include every employment type in the statistics" do
      india_row = described_class.new(employment_type: "all").by_country.find { |row| row[:country][:code] == "IN" }

      expect(india_row[:stats]).to include(count: 4, min: "500000.00", median: "1500000.00")
    end

    it "leaves out countries without employees" do
      create(:country, code: "FR", name: "France")

      expect(described_class.new.by_country.map { |row| row[:country][:code] }).to eq(%w[DE IN])
    end
  end

  describe "#by_job_title" do
    it "groups one country's staff by job title" do
      hire(country: india, salary: 1_000_000, job_title: analyst)
      hire(country: india, salary: 3_000_000)
      hire(country: india, salary: 4_000_000)
      hire(country: germany, salary: 90_000)

      rows = described_class.new.by_job_title(india)

      expect(rows.map { |r| [ r[:job_title][:name], r[:count], r[:median] ] })
        .to eq([ [ "Analyst", 1, "1000000.00" ], [ "Engineer", 2, "3500000.00" ] ])
      expect(rows.map { |r| r[:currency_code] }.uniq).to eq([ "INR" ])
    end
  end

  describe "#by_department" do
    it "totals payroll per department in USD" do
      hire(country: germany, salary: 50_000)
      hire(country: india, salary: 1_000_000, department: support)
      hire(country: india, salary: 2_000_000, department: support)

      rows = described_class.new.by_department

      expect(rows.map { |r| [ r[:department][:name], r[:headcount], r[:total_payroll_usd], r[:median_usd] ] })
        .to eq([ [ "Engineering", 1, "55000.00", "55000.00" ], [ "Support", 2, "36000.00", "18000.00" ] ])
    end
  end

  describe "#summary" do
    it "reports org-wide headcount, payroll and median in USD" do
      hire(country: germany, salary: 100_000)
      hire(country: india, salary: 1_000_000)

      expect(described_class.new.summary).to eq(headcount: 2, total_payroll_usd: "122000.00", countries: 2,
                                                median_salary_usd: "61000.00")
    end

    it "works with no employees" do
      expect(described_class.new.summary).to include(headcount: 0, total_payroll_usd: "0.00", median_salary_usd: nil)
    end
  end

  describe "#outliers" do
    before do
      # Peer median is 1,000,000 INR.
      [ 950_000, 1_000_000, 1_000_000, 1_050_000 ].each { |s| hire(country: india, salary: s) }
      @underpaid = hire(country: india, salary: 600_000)  # -40%
      @overpaid = hire(country: india, salary: 1_400_000) # +40%
      @close = hire(country: india, salary: 1_200_000)    # +20%, inside the 25% band
    end

    it "lists people far from their peers' median, largest gap first" do
      result = described_class.new.outliers

      expect(result[:data].map { |r| r[:employee][:id] }).to contain_exactly(@underpaid.id, @overpaid.id)
      expect(result[:data].map { |r| r[:deviation_percent].abs }).to all(eq(40.0))
      expect(result).to include(total: 2, below: 1)
      expect(result[:data].first).to include(peer_median: "1000000.00", peer_count: 7)
    end

    it "uses the threshold it is given" do
      expect(described_class.new.outliers(threshold: 0.15)[:total]).to eq(3)
    end

    it "ignores groups too small for a meaningful median" do
      hire(country: germany, salary: 10_000)
      hire(country: germany, salary: 90_000)

      expect(described_class.new.outliers[:data].map { |r| r[:country][:code] }.uniq).to eq([ "IN" ])
    end
  end
end
