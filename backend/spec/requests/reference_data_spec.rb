require "rails_helper"

RSpec.describe "Reference data API" do
  it "returns the options the forms need" do
    create(:country, :india)
    create(:department, name: "Engineering")

    get "/api/reference_data"

    body = response.parsed_body
    expect(body["countries"].first).to include("code" => "IN", "currency_code" => "INR")
    expect(body["departments"].map { |d| d["name"] }).to eq([ "Engineering" ])
    expect(body["revision_reasons"]).not_to include("hire")
  end
end
