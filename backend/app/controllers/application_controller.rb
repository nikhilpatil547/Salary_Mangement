class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound do
    render json: { error: "Not found" }, status: :not_found
  end

  rescue_from ActiveRecord::StaleObjectError do
    render json: { error: "This employee was changed by someone else. Reload and try again." }, status: :conflict
  end

  rescue_from ActionController::ParameterMissing do |error|
    render json: { error: error.message }, status: :bad_request
  end

  private

  def render_errors(record)
    render json: { errors: record.errors.to_hash(true) }, status: :unprocessable_content
  end
end
