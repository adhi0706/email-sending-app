/*
  # AI Email Campaign Management System Schema

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `slno` (integer, for CSV ordering)
      - `name` (text, client name)
      - `email` (text, client email)
      - `company` (text, client company)
      - `created_at` (timestamptz)
    
    - `email_drafts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `subject` (text, email subject)
      - `body` (text, email body with placeholders)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `custom_fields`
      - `id` (uuid, primary key)
      - `draft_id` (uuid, references email_drafts)
      - `keyword` (text, e.g., "custom_field")
      - `value` (text, replacement value)
      - `created_at` (timestamptz)
    
    - `email_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `client_id` (uuid, references clients)
      - `subject` (text)
      - `body` (text, personalized body)
      - `status` (text: 'sent', 'failed')
      - `error_message` (text, nullable)
      - `sent_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    
  3. Indexes
    - Add indexes on foreign keys and email lookups
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slno integer NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  company text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create email_drafts table
CREATE TABLE IF NOT EXISTS email_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create custom_fields table
CREATE TABLE IF NOT EXISTS custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid REFERENCES email_drafts(id) ON DELETE CASCADE NOT NULL,
  keyword text NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message text,
  sent_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policies for clients table
CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for email_drafts table
CREATE POLICY "Users can view own drafts"
  ON email_drafts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drafts"
  ON email_drafts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts"
  ON email_drafts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts"
  ON email_drafts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for custom_fields table
CREATE POLICY "Users can view own custom fields"
  ON custom_fields FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_drafts
      WHERE email_drafts.id = custom_fields.draft_id
      AND email_drafts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own custom fields"
  ON custom_fields FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_drafts
      WHERE email_drafts.id = custom_fields.draft_id
      AND email_drafts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own custom fields"
  ON custom_fields FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_drafts
      WHERE email_drafts.id = custom_fields.draft_id
      AND email_drafts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_drafts
      WHERE email_drafts.id = custom_fields.draft_id
      AND email_drafts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own custom fields"
  ON custom_fields FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_drafts
      WHERE email_drafts.id = custom_fields.draft_id
      AND email_drafts.user_id = auth.uid()
    )
  );

-- Policies for email_logs table
CREATE POLICY "Users can view own email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email logs"
  ON email_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_slno ON clients(user_id, slno);
CREATE INDEX IF NOT EXISTS idx_email_drafts_user_id ON email_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_draft_id ON custom_fields(draft_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(user_id, sent_at DESC);