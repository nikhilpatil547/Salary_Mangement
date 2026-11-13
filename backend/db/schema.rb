# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_11_13_070003) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pg_trgm"

  create_table "countries", force: :cascade do |t|
    t.string "code", limit: 2, null: false
    t.string "name", null: false
    t.string "currency_code", limit: 3, null: false
    t.decimal "usd_rate", precision: 18, scale: 8, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_countries_on_code", unique: true
    t.index ["name"], name: "index_countries_on_name", unique: true
    t.check_constraint "usd_rate > 0::numeric", name: "countries_usd_rate_positive"
  end

  create_table "departments", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_departments_on_name", unique: true
  end

  create_table "employees", force: :cascade do |t|
    t.string "employee_code", null: false
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.string "email", null: false
    t.bigint "country_id", null: false
    t.bigint "department_id", null: false
    t.bigint "job_title_id", null: false
    t.string "employment_type", default: "full_time", null: false
    t.date "hire_date", null: false
    t.decimal "salary", precision: 14, scale: 2, null: false
    t.integer "lock_version", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index "((((first_name)::text || ' '::text) || (last_name)::text)) gin_trgm_ops", name: "index_employees_on_full_name_trgm", using: :gin
    t.index "lower((email)::text)", name: "index_employees_on_lower_email", unique: true
    t.index ["country_id", "job_title_id", "salary"], name: "index_employees_on_country_id_and_job_title_id_and_salary"
    t.index ["country_id"], name: "index_employees_on_country_id"
    t.index ["department_id"], name: "index_employees_on_department_id"
    t.index ["employee_code"], name: "index_employees_on_employee_code", unique: true
    t.index ["hire_date"], name: "index_employees_on_hire_date"
    t.index ["job_title_id"], name: "index_employees_on_job_title_id"
    t.index ["last_name", "first_name"], name: "index_employees_on_last_name_and_first_name"
    t.index ["salary"], name: "index_employees_on_salary"
    t.check_constraint "employment_type::text = ANY (ARRAY['full_time'::character varying::text, 'part_time'::character varying::text, 'contractor'::character varying::text])", name: "employees_employment_type_valid"
    t.check_constraint "salary > 0::numeric", name: "employees_salary_positive"
  end

  create_table "job_titles", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_job_titles_on_name", unique: true
  end

  create_table "salary_revisions", force: :cascade do |t|
    t.bigint "employee_id", null: false
    t.decimal "previous_salary", precision: 14, scale: 2
    t.decimal "new_salary", precision: 14, scale: 2, null: false
    t.string "currency_code", limit: 3, null: false
    t.string "reason", null: false
    t.date "effective_on", null: false
    t.string "note"
    t.datetime "created_at", null: false
    t.index ["employee_id", "effective_on", "id"], name: "index_salary_revisions_on_employee_id_and_effective_on_and_id"
    t.check_constraint "new_salary > 0::numeric", name: "salary_revisions_new_salary_positive"
    t.check_constraint "reason::text = ANY (ARRAY['hire'::character varying::text, 'annual_review'::character varying::text, 'promotion'::character varying::text, 'market_adjustment'::character varying::text, 'correction'::character varying::text])", name: "salary_revisions_reason_valid"
  end

  add_foreign_key "employees", "countries"
  add_foreign_key "employees", "departments"
  add_foreign_key "employees", "job_titles"
  add_foreign_key "salary_revisions", "employees", on_delete: :cascade
end
