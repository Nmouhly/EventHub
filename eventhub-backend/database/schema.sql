BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Required on PostgreSQL 12; gen_random_uuid() is built in on PostgreSQL 13+.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (length(btrim(full_name)) > 0),
  email TEXT NOT NULL UNIQUE CHECK (email = lower(btrim(email)) AND length(email) > 0),
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  description TEXT,
  location TEXT NOT NULL CHECK (length(btrim(location)) > 0),
  event_date TIMESTAMPTZ NOT NULL,
  max_participants INTEGER NOT NULL CHECK (max_participants > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT events_cancellation_check CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL))
);
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (length(btrim(full_name)) > 0),
  email TEXT NOT NULL UNIQUE CHECK (email = lower(btrim(email)) AND length(email) > 0),
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT registrations_event_participant_key UNIQUE (event_id, participant_id),
  CONSTRAINT registrations_cancellation_check CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL))
);
CREATE INDEX events_status_date_idx ON events(status, event_date);
CREATE INDEX events_date_idx ON events(event_date);
CREATE INDEX events_creator_idx ON events(created_by);
CREATE INDEX participants_name_trgm_idx ON participants USING GIN (full_name gin_trgm_ops);
CREATE INDEX participants_email_trgm_idx ON participants USING GIN (email gin_trgm_ops);
CREATE INDEX registrations_event_status_idx ON registrations(event_id, status);
CREATE INDEX registrations_participant_idx ON registrations(participant_id);
CREATE INDEX registrations_created_idx ON registrations(created_at);
CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = clock_timestamp(); RETURN NEW; END;
$$;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER registrations_updated_at BEFORE UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
COMMIT;
