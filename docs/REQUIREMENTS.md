# ACME Salary Management: Requirements

## Goal

ACME's HR Manager keeps salary data for about 10,000 employees in several countries in Excel files.
The goal is one web app where they can **keep that data correct** and **answer questions about pay**
without building pivot tables.

The app is successful if the HR Manager can:

- find any employee and change their salary in under a minute, with a record of why it changed;
- answer "what do we pay a Data Analyst in India, and how does that compare to Germany?" in a few clicks;
- spot people who are paid far from their peers, so pay reviews start from data rather than memory.

## Persona

**HR Manager.** Comfortable with Excel and not technical. Uses the data for annual reviews, offers and
reports to leadership. Cares most that the numbers are right and that every change can be explained.

## In scope

| # | Feature | Why |
|---|---------|-----|
| 1 | **Employee directory**: search by name or employee code; filter by country, department and job title; sort by any column; pages served by the server | Replaces scrolling a sheet. It has to stay fast with 10,000 rows. |
| 2 | **Add, edit and remove employees**, checked on the server and in the form | The core "manage" job. Validation blocks the bad data that Excel lets through. |
| 3 | **Salary revisions**: every pay change is saved with an effective date and a reason (annual review, promotion, market adjustment, correction) | HR is asked "why did this change?". Excel has no answer to that. |
| 4 | **Pay insights by country**: headcount, minimum, median, average and maximum | The most common question. The median is shown because a few high earners pull the average up. |
| 5 | **Pay insights by job title within a country** | Used for offers and fairness checks: "is this offer in range?" |
| 6 | **Org overview in USD**: headcount and total pay by country and by department | Leadership wants one currency to compare countries. |
| 7 | **Pay outliers**: people paid more than 25% above or below the median for their job title in their country | Turns the data into a to-do list for pay reviews. |
| 8 | **CSV export** of the current filtered list | HR will still share data in Excel. Export keeps that path open without making Excel the source of truth. |
| 9 | **Seed script** with 10,000 realistic employees, the same every run | Required. Repeatable data makes demos and tests reliable. |

### Key decisions

- **Salaries are stored in the employee's local currency.** People are paid in local currency, so that
  is the true figure. Comparisons across countries convert to USD with a **fixed exchange-rate table**
  stored in the database. This keeps the numbers stable and testable. Insights within one country
  stay in local currency, so exchange rates never distort them.
- **Annual base salary only.** It is one comparable number, and it answers every question above.
- **All statistics are calculated in SQL**, never by loading 10,000 rows into Ruby.

## Deliberately left out

| Left out | Why |
|----------|-----|
| Login and roles | There is one user persona and this is a demo. In real use this would be the first thing added, but it shows nothing about the salary problem. |
| Payroll, tax, bonus and equity | That is a different product, with legal rules for each country. Base salary answers the questions in the brief. |
| Approval workflows for pay changes | Useful for larger HR teams. The revision history already records who changed what and why. |
| Live exchange rates | Rates that change on their own would make the reports change from day to day. A fixed table that HR updates on purpose is easier to trust. |
| CSV/Excel import | The real migration needs mapping and cleaning rules we do not know yet. The seed script stands in for it. |
| Gender or diversity pay-gap reports | Needs sensitive personal data and a policy decision about who may see it. It is a good next feature once that is agreed. |
| Multiple organisations | The brief is for ACME alone. |

## Non-functional targets

- Directory and insights responses under 300 ms with 10,000 employees on a small server.
- The test suite runs in seconds and gives the same result every time (no network, fixed seed data).
- The app is deployed at a public URL.
