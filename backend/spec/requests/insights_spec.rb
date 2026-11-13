require "rails_helper"

RSpec.describe "Insights API" do
  let(:india) { create(:country, :india) }

  before { create(:employee, country: india, salary: 1_000_000) }

  it "serves each report" do
    %w[summary countries departments outliers].each do |report|
      get "/api/insights/#{report}"
      expect(response).to have_http_status(:ok), "#{report} returned #{response.status}"
    end
  end

  it "breaks a country down by job title" do
    get "/api/insights/job_titles", params: { country_id: india.id }

    expect(response.parsed_body["country"]).to include("code" => "IN")
    expect(response.parsed_body["data"].size).to eq(1)
  end

  it "requires a country for the job title report" do
    get "/api/insights/job_titles"

    expect(response).to have_http_status(:bad_request)
  end

  it "keeps the outlier threshold within a sensible range" do
    get "/api/insights/outliers", params: { threshold: "50" }

    expect(response.parsed_body["threshold"]).to eq(1.0)
  end
end
