# Serves the React app for every non-API page, so routes like /employees/42 work on reload.
#
# Hashed assets (/assets/*) are served straight from public/ with a one-year cache. index.html lives
# outside public/ and is sent from here with no-cache, so a new deploy is picked up immediately.
class FrontendController < ActionController::Base
  INDEX = Rails.root.join("frontend", "index.html")

  def index
    if INDEX.exist?
      response.headers["Cache-Control"] = "no-cache"
      send_file INDEX, type: "text/html", disposition: "inline"
    else
      render plain: "Frontend not built. In development run the Vite server (cd frontend && npm run dev).",
             status: :not_found
    end
  end
end
