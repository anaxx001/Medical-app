-- =====================================================
-- MedStudent App: Admin Dashboard — Study Year support
-- =====================================================
-- Adds a `study_year` column to profiles so the student
-- registry can be filtered by academic level.
--
-- Accepted values (free text, validated in the app UI):
--   'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
--   'Professor', 'Consultant'
--
-- Run in: Supabase Dashboard -> SQL Editor -> Run.
-- Safe to run multiple times (idempotent).

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS study_year TEXT;
