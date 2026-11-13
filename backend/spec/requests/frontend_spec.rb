require "rails_helper"

RSpec.describe "Frontend pages" do
  let(:index) { Rails.root.join("tmp", "spec-index.html") }

  before do
    index.write("<div id=\"root\"></div>")
    stub_const("FrontendController::INDEX", index)
  end

  after { index.delete if index.exist? }

  it "serves the React app for client-side routes without caching it" do
    get "/employees/42"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include('<div id="root">')
    expect(response.headers["Cache-Control"]).to eq("no-cache")
  end

  it "keeps unknown API paths as JSON 404s" do
    get "/api/nope"

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body).to eq("error" => "Not found")
  end
end
