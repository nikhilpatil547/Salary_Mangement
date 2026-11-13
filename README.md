# ACME Salary Management

A web app for ACME's HR Manager to manage salary data for 10,000 employees in 9 countries, and to answer
questions about how the organisation pays people. It replaces a set of Excel files.

- **Live app:** _add the Render URL here after deploying_
- **Demo video:** [docs/demo/demo.mp4](docs/demo/demo.mp4)
- **Requirements (written first):** [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)
- **Architecture, trade-offs and performance:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **How AI was used:** [docs/AI_USAGE.md](docs/AI_USAGE.md)

## What it does

| Screen | For the HR Manager |
|--------|--------------------|
| **Employees** | Search by name, email or code; filter by country, department, job title and type; sort any column; export the filtered list to CSV |
| **Employee** | Details, current pay (local and USD) and the full salary history with reasons; edit, remove, change salary |
| **Change salary** | New amount, reason (annual review, promotion, market adjustment, correction), effective date and note; shows the % change before saving |
| **Pay insights** | Org totals; min / median / average / max by country; the same by job title within a country; payroll by department |
| **Pay outliers** | People paid more than ±15/25/40% away from the median for their job title in their country |

## Stack

- **Backend:** Ruby 3.3, Rails 8.1 (API), PostgreSQL 16, RSpec
- **Frontend:** React 19, TypeScript, Vite, Mantine 8, TanStack Query, Vitest + Testing Library
- **Deploy:** one Docker image (Rails serves the built React app) on Render, with managed Postgres

## Run it

### With Docker

```bash
docker compose up --build
```

Open http://localhost:8080. The first start creates the database and seeds 10,000 employees.

### Without Docker

You need Ruby 3.3, Node 22 and PostgreSQL 16 running locally. Set `DATABASE_HOST`, `DATABASE_USER` and
`DATABASE_PASSWORD` if your Postgres needs them.

```bash
# API on :3000
cd backend
bundle install
bin/rails db:setup          # creates the databases and seeds 10,000 employees
bin/rails server

# UI on :5173 (proxies /api to :3000), in a second terminal
cd frontend
npm install
npm run dev
```

Re-seed at any time with `RESEED=1 bin/rails db:seed`. Change the size with `EMPLOYEE_COUNT=50000`.

## Tests

```bash
cd backend && bundle exec rspec && bin/rubocop     # 58 examples, about 2s
cd frontend && npm test && npm run lint            # 31 tests, about 7s
```

GitHub Actions runs both suites, the linters and the production build on every push.

## Deploy to Render

1. In Render choose **New → Blueprint**, pick this repository and click **Apply**.
2. `render.yaml` creates a Postgres 16 database and the web service. `SECRET_KEY_BASE` is generated.
3. The first boot runs migrations and seeds 10,000 employees. Later deploys only migrate, so data is kept.

On the free plan the service sleeps when idle, so the first request after a while takes up to a minute.

## API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/employees` | `q`, `country_id`, `department_id`, `job_title_id` (comma lists), `employment_type`, `sort`, `direction`, `page`, `per_page` |
| GET | `/api/employees.csv` | Same filters, every matching row |
| GET / POST / PATCH / DELETE | `/api/employees/:id` | PATCH takes `lock_version`; salary and country are not editable here |
| GET / POST | `/api/employees/:id/salary_revisions` | POST: `new_salary`, `reason`, `effective_on`, `note` |
| GET | `/api/insights/summary` · `countries` · `departments` | `employment_type=full_time` (default) or `all` |
| GET | `/api/insights/job_titles?country_id=` | One country, local currency |
| GET | `/api/insights/outliers` | `threshold` (0.05–1.0, default 0.25), `country_id` |
| GET | `/api/reference_data` | Countries, departments, job titles, types and reasons for forms |

## Repository layout

```
backend/    Rails API: app/models, app/queries, app/serializers, lib/seeding, spec/
frontend/   React app: src/api, src/lib, src/components, src/pages
docs/       Requirements, architecture, AI usage, demo video
```
