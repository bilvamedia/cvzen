
ALTER TABLE public.job_preferences
  ADD COLUMN expected_salary_min INTEGER DEFAULT NULL,
  ADD COLUMN expected_salary_max INTEGER DEFAULT NULL,
  ADD COLUMN salary_currency TEXT DEFAULT 'USD',
  ADD COLUMN industries TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN company_sizes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN notice_period TEXT DEFAULT NULL,
  ADD COLUMN willing_to_relocate BOOLEAN DEFAULT FALSE,
  ADD COLUMN travel_willingness TEXT DEFAULT NULL,
  ADD COLUMN languages TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN visa_sponsorship_needed BOOLEAN DEFAULT FALSE,
  ADD COLUMN benefits_priorities TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN tools_technologies TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN job_functions TEXT[] NOT NULL DEFAULT '{}';
