# One image: the React app is built with Node, then served by the Rails API.

# --- Build the frontend ---
FROM node:22-slim AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Install gems ---
FROM ruby:3.3.6-slim AS gems
RUN apt-get update -qq && apt-get install --no-install-recommends -y build-essential libpq-dev libyaml-dev git \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV BUNDLE_DEPLOYMENT=1 BUNDLE_WITHOUT="development:test" BUNDLE_PATH=/usr/local/bundle
COPY backend/Gemfile backend/Gemfile.lock ./
RUN bundle install && rm -rf ~/.bundle "${BUNDLE_PATH}"/ruby/*/cache

# --- Runtime ---
FROM ruby:3.3.6-slim
RUN apt-get update -qq && apt-get install --no-install-recommends -y libpq5 libyaml-0-2 curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV RAILS_ENV=production BUNDLE_DEPLOYMENT=1 BUNDLE_WITHOUT="development:test" BUNDLE_PATH=/usr/local/bundle \
    RAILS_LOG_TO_STDOUT=1
COPY --from=gems /usr/local/bundle /usr/local/bundle
COPY backend/ ./
# Hashed assets go in public/ (cached for a year); index.html stays outside it (sent with no-cache).
COPY --from=frontend /frontend/dist/ ./public/
RUN mkdir -p frontend && mv public/index.html frontend/index.html \
    && bundle exec bootsnap precompile app/ lib/ \
    && useradd --create-home --shell /bin/bash rails && chown -R rails:rails log tmp
USER rails
EXPOSE 3000
ENTRYPOINT ["bin/docker-entrypoint"]
CMD ["bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]
