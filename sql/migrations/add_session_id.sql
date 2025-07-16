-- Migration to add session_id column to bank_statements table
-- This enables data isolation per user session without requiring user accounts

-- Add session_id column
ALTER TABLE bank_statements ADD COLUMN session_id VARCHAR(36);

-- Create index for better query performance
CREATE INDEX idx_session_id ON bank_statements(session_id);

-- Update existing records to have a default session_id (optional)
-- This allows existing data to remain accessible
UPDATE bank_statements SET session_id = 'legacy-session' WHERE session_id IS NULL;

-- Make session_id NOT NULL after updating existing records
ALTER TABLE bank_statements ALTER COLUMN session_id SET NOT NULL;