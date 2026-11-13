class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    enable_extension "pg_trgm"

    create_table :employees do |t|
      t.string :employee_code, null: false
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :email, null: false
      t.references :country, null: false, foreign_key: true
      t.references :department, null: false, foreign_key: true
      t.references :job_title, null: false, foreign_key: true
      t.string :employment_type, null: false, default: "full_time"
      t.date :hire_date, null: false
      # Annual base salary in the country's currency.
      t.decimal :salary, null: false, precision: 14, scale: 2
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end

    add_index :employees, :employee_code, unique: true
    add_index :employees, "lower(email)", unique: true, name: "index_employees_on_lower_email"
    # Insights group by country and job title together.
    add_index :employees, [ :country_id, :job_title_id, :salary ]
    add_index :employees, :salary
    add_index :employees, :hire_date
    add_index :employees, [ :last_name, :first_name ]
    add_index :employees, "(first_name || ' ' || last_name) gin_trgm_ops",
              using: :gin, name: "index_employees_on_full_name_trgm"

    add_check_constraint :employees, "salary > 0", name: "employees_salary_positive"
    add_check_constraint :employees, "employment_type IN ('full_time', 'part_time', 'contractor')",
                         name: "employees_employment_type_valid"
  end
end
