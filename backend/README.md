# Backend (Rails API)

See the [main README](../README.md) for setup and [ARCHITECTURE.md](../docs/ARCHITECTURE.md) for design.

- `app/models` – data rules; salary changes only through `Employee#revise_salary!`
- `app/queries` – `EmployeeSearch`, `Pagination`, `PayInsights` (all statistics in SQL)
- `app/serializers` – JSON shape for the UI
- `lib/seeding` – deterministic 10,000-employee generator (`bin/rails db:seed`)
