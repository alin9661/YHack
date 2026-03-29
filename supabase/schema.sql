-- Run this in the Supabase SQL Editor to create the analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL,
  market_title TEXT NOT NULL,
  signal JSONB NOT NULL,
  market_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (required by Supabase)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Allow all operations via the anon key (for hackathon simplicity)
CREATE POLICY "Allow all operations" ON analyses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for querying by market
CREATE INDEX IF NOT EXISTS idx_analyses_market_id ON analyses (market_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses (created_at DESC);
