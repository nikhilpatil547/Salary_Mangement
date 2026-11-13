class CreateSalaryRevisions < ActiveRecord::Migration[8.1]
  def change
    create_table :salary_revisions do |t|
      t.references :employee, null: false, foreign_key: { on_delete: :cascade }, index: false
      t.decimal :previous_salary, precision: 14, scale: 2
      t.decimal :new_salary, null: false, precision: 14, scale: 2
      t.string :currency_code, null: false, limit: 3
      t.string :reason, null: false
      t.date :effective_on, null: false
      t.string :note
      t.datetime :created_at, null: false
    end

    add_index :salary_revisions, [ :employee_id, :effective_on, :id ]
    add_check_constraint :salary_revisions, "new_salary > 0", name: "salary_revisions_new_salary_positive"
    add_check_constraint :salary_revisions,
                         "reason IN ('hire', 'annual_review', 'promotion', 'market_adjustment', 'correction')",
                         name: "salary_revisions_reason_valid"
  end
end
