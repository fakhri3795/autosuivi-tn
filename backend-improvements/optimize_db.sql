-- AutoSuivi.tn Database Optimization
-- Run on MariaDB: mysql -u root -p autosuivi < optimize_db.sql

-- ─── Ensure tables have proper columns ──────────────────────────────────────

-- Add updated_at to vehicles if missing
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at to deadlines if missing
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add created_at to maintenance_records if missing
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ─── Indexes for performance ────────────────────────────────────────────────

-- Vehicles: lookup by user
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);

-- Maintenance: lookup by vehicle + sort by date
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_date ON maintenance_records(vehicle_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_type ON maintenance_records(vehicle_id, type);

-- Deadlines: lookup by vehicle
CREATE INDEX IF NOT EXISTS idx_deadlines_vehicle_id ON deadlines(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_vehicle_type ON deadlines(vehicle_id, type);

-- Mileage: lookup by vehicle + sort by date
CREATE INDEX IF NOT EXISTS idx_mileage_vehicle_id ON mileage_readings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_mileage_vehicle_date ON mileage_readings(vehicle_id, date DESC);

-- Users: lookup by email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─── Show status ────────────────────────────────────────────────────────────
SELECT 'Database optimization complete!' AS status;
