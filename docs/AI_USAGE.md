# How AI was used

This project was built with **Claude** (Anthropic) working as a coding agent. It had a shell, a
PostgreSQL database, a headless browser and the GitHub repository. I set the direction and the
constraints. The agent planned, wrote code and tests, ran them, and committed in small steps.

## Instructions given

The instructions were short and high level:

1. Build the ACME salary management assessment from the brief (the PDF).
2. Keep the stack consistent with my experience: **Rails API + PostgreSQL + React/TypeScript + Mantine**.
3. Work in a fresh repository with **small, incremental commits** that show how the solution evolved.

## How the work was steered

| Step | What happened |
|------|---------------|
| Requirements first | The one-page `REQUIREMENTS.md` was written and committed before any code, as the brief asks. It fixes scope and records what was left out and why. |
| Domain decisions before code | Local currency vs USD, salary changes only through reasons, no country change after hiring, full-time-only statistics. Each is a product decision, recorded in `ARCHITECTURE.md` with its trade-off. |
| Backend before UI | Models with specs, then seed data checked with SQL, then the API, then the insights. Each step was tested and committed separately. |
| Check the data, not just the code | After seeding, medians per country and title were queried directly, to confirm the pay looked realistic and that every employee's salary matched their latest revision. |
| Hand-worked test numbers | Insight specs use small datasets where the median, average and USD values can be checked by hand, so the tests prove the maths and do not just repeat the code. |
| Real-browser check | The UI was driven in a headless browser (screenshots plus a scripted add / change salary / edit / remove run) against the 10,000-employee database. |
| Measure, then document | Response times in `ARCHITECTURE.md` come from timing the running API, not from estimates. |

## Where review caught problems

AI-generated code was treated as a draft that has to pass tests and inspection. Problems found this way:

- **Re-fetching a deleted employee.** The browser run showed two 404s after a delete: the cache was
  refreshed while the deleted employee's page was still mounted. The fix leaves that cache entry to
  expire; it is explained in the commit message.
- **Unknown API paths.** Routing every unknown path to the React app also caught `/api/typo`, which then
  returned HTML. A spec caught it; unknown API paths now return a JSON 404.
- **Caching `index.html` for a year.** Rails' default production headers would have cached the app shell
  for a year, hiding new deploys. `index.html` now lives outside `public/` and is sent with `no-cache`;
  only hashed assets are cached long-term.
- **Silent currency bugs.** An early design allowed editing an employee's country. That would turn the
  same number into a different currency, so country is now fixed after hiring.
- **Filters lost on quick clicks.** Recording the demo showed that picking a country and then a job title
  in quick succession dropped the country. React Router's functional `setSearchParams` reads stale params.
  Fixed, and covered by a test that fails on the old code.
- **Lint findings** (state set inside an effect, mixed component/utility exports) were fixed, not
  silenced.

## What I would do differently with more time

- Add Playwright end-to-end tests to CI (the browser run was done by hand for this submission).
- Ask for a second, independent review pass on the SQL in `PayInsights`, comparing against spreadsheet
  calculations on an export.
