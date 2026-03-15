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

-- Per-session category keyword overrides
CREATE TABLE IF NOT EXISTS session_categories (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    category VARCHAR(100) NOT NULL,
    keywords JSONB NOT NULL DEFAULT '[]',
    UNIQUE(session_id, category)
);

CREATE INDEX IF NOT EXISTS idx_session_categories ON session_categories(session_id);