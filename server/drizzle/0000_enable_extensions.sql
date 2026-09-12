-- E1 (§03/§04): stand up the extensions the schema depends on.
-- pgcrypto: gen_random_uuid() defaults on every primary key.
-- postgis: required per the review's stack plan for future lat/long
-- queries ("destinations near me"); no geography column is added yet since
-- no ticket asks for one, but the extension is E1's job to provision.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;
