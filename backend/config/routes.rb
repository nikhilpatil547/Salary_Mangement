Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api, defaults: { format: :json } do
    resource :reference_data, only: :show
    resources :employees do
      resources :salary_revisions, only: %i[index create]
    end
  end
end
