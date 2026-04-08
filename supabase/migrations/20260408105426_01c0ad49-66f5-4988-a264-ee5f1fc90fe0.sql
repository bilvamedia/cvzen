-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Add embedding columns to resume_sections (1536 dimensions for text-embedding models)
ALTER TABLE public.resume_sections
  ADD COLUMN IF NOT EXISTS content_embedding vector(768),
  ADD COLUMN IF NOT EXISTS improved_content_embedding vector(768);

-- Create indexes for similarity search
CREATE INDEX IF NOT EXISTS idx_resume_sections_content_embedding
  ON public.resume_sections USING ivfflat (content_embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_resume_sections_improved_content_embedding
  ON public.resume_sections USING ivfflat (improved_content_embedding vector_cosine_ops)
  WITH (lists = 100);
