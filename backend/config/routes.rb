Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api, defaults: { format: :json } do
    resource :reference_data, only: :show
    resources :employees do
      resources :salary_revisions, only: %i[index create]
    end
    scope :insights, controller: :insights, as: :insights do
      get :summary
      get :countries
      get :job_titles
      get :departments
      get :outliers
    end
  end

  match "/api/*path", via: :all, to: ->(_env) { [ 404, { "content-type" => "application/json" }, [ '{"error":"Not found"}' ] ] }

  # Everything else is a page of the React app.
  get "*path", to: "frontend#index"
  root "frontend#index"
end
