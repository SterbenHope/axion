-- NeonCasino Database Initialization Script
-- This script creates the database and initial user

-- Create database
CREATE DATABASE neoncasino_db;

-- Create user with password
CREATE USER neoncasino_user WITH PASSWORD 'neoncasino_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE neoncasino_db TO neoncasino_user;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO neoncasino_user;

-- Set search path
ALTER DATABASE neoncasino_db SET search_path TO public;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Set timezone
ALTER DATABASE neoncasino_db SET timezone TO 'UTC';

-- Set encoding
ALTER DATABASE neoncasino_db SET client_encoding TO 'UTF8';

-- Set locale
ALTER DATABASE neoncasino_db SET lc_messages TO 'en_US.UTF-8';
ALTER DATABASE neoncasino_db SET lc_monetary TO 'en_US.UTF-8';
ALTER DATABASE neoncasino_db SET lc_numeric TO 'en_US.UTF-8';
ALTER DATABASE neoncasino_db SET lc_time TO 'en_US.UTF-8';

-- Create indexes for better performance
-- (These will be created by Django migrations, but we can add some here for optimization)

-- Grant connect permission
GRANT CONNECT ON DATABASE neoncasino_db TO neoncasino_user;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO neoncasino_user;

-- Grant create on schema
GRANT CREATE ON SCHEMA public TO neoncasino_user;

-- Grant all on all tables (will be created by Django)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO neoncasino_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO neoncasino_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO neoncasino_user;

-- Set owner
ALTER DATABASE neoncasino_db OWNER TO neoncasino_user;



















