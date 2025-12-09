-- Database Schema for Cycling Coach Platform (PostgreSQL/Supabase)

-- Enable UUID extension if we need it (optional if IDs are generated in app)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Athletes
CREATE TABLE IF NOT EXISTS athletes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  dob DATE,
  weight DOUBLE PRECISION, -- kg
  height DOUBLE PRECISION, -- cm
  sex TEXT CHECK (sex IN ('M', 'F')),
  category TEXT CHECK (category IN ('OPEN', 'ELITE', 'MASTER', 'ELITE_MASTER')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  -- Metrics
  ftp INTEGER,
  cp INTEGER,
  w_prime INTEGER,
  p_max INTEGER,

  -- Extra Data (JSON)
  extra_data JSONB
);

-- 2. Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  workout_id TEXT,
  workout_name TEXT NOT NULL,

  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'SKIPPED')),
  notes TEXT,

  assigned_by TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  workout_structure JSONB,
  activity_data JSONB
);
CREATE INDEX IF NOT EXISTS idx_calendar_lookup ON assignments (athlete_id, date);

-- 3. Mesocycles
CREATE TABLE IF NOT EXISTS mesocycles (
  id TEXT PRIMARY KEY,
  athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  structure JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Diary Entries
CREATE TABLE IF NOT EXISTS diary_entries (
    id TEXT PRIMARY KEY,
    athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    hrv DOUBLE PRECISION, -- rMSSD ms
    hrr INTEGER, -- Resting Heart Rate
    traffic_light TEXT DEFAULT 'GREEN' CHECK (traffic_light IN ('GREEN', 'YELLOW', 'RED')),
    notes TEXT,

    sdnn DOUBLE PRECISION,
    pnn50 DOUBLE PRECISION,
    cv DOUBLE PRECISION,
    mean_rr DOUBLE PRECISION,

    sleep_quality SMALLINT,
    sleep_duration DOUBLE PRECISION,
    rpe SMALLINT,
    soreness SMALLINT,
    fatigue SMALLINT,
    stress SMALLINT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(athlete_id, date)
);

-- 5. Reports
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    content TEXT,
    generated_by TEXT DEFAULT 'AI' CHECK (generated_by IN ('AI', 'COACH')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_athlete_reports ON reports (athlete_id, date);
