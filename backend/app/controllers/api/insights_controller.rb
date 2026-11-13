module Api
  class InsightsController < ApplicationController
    def summary
      render json: insights.summary.merge(employment_type: insights.employment_type)
    end

    def countries
      render json: { employment_type: insights.employment_type, data: insights.by_country }
    end

    def job_titles
      country = Country.find(params.require(:country_id))
      render json: { employment_type: insights.employment_type, country: country.slice(:id, :code, :name, :currency_code),
                     data: insights.by_job_title(country) }
    end

    def departments
      render json: { employment_type: insights.employment_type, data: insights.by_department }
    end

    def outliers
      threshold = Float(params[:threshold], exception: false)&.clamp(0.05, 1.0) || PayInsights::DEFAULT_OUTLIER_THRESHOLD
      render json: insights.outliers(threshold: threshold, country_id: params[:country_id].presence)
    end

    private

    # Pass employment_type=all to include part-time staff and contractors in the pay statistics.
    def insights
      @insights ||= PayInsights.new(employment_type: params.fetch(:employment_type, "full_time"))
    end
  end
end
