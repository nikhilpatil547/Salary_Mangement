class CreateReferenceTables < ActiveRecord::Migration[8.1]
  def change
    create_table :countries do |t|
      t.string :code, null: false, limit: 2
      t.string :name, null: false
      t.string :currency_code, null: false, limit: 3
      # How many US dollars one unit of the local currency is worth. Fixed on purpose: see REQUIREMENTS.md.
      t.decimal :usd_rate, null: false, precision: 18, scale: 8
      t.timestamps
    end
    add_index :countries, :code, unique: true
    add_index :countries, :name, unique: true
    add_check_constraint :countries, "usd_rate > 0", name: "countries_usd_rate_positive"

    create_table :departments do |t|
      t.string :name, null: false
      t.timestamps
    end
    add_index :departments, :name, unique: true

    create_table :job_titles do |t|
      t.string :name, null: false
      t.timestamps
    end
    add_index :job_titles, :name, unique: true
  end
end
