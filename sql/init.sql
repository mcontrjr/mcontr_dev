CREATE TABLE IF NOT EXISTS bank_statements (
    id SERIAL PRIMARY KEY,
    bank VARCHAR(255),
    date DATE,
    description TEXT,
    amount DECIMAL(10, 2),
    category VARCHAR(255),
    session_id VARCHAR(36) NOT NULL DEFAULT 'legacy-session'
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_session_id ON bank_statements(session_id);