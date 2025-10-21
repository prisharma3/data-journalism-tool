-- ============================================
-- Migration 006: Add Writing Content Tables
-- ============================================
-- Purpose: Add persistence layer for writing interface
-- ============================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS writing_suggestions CASCADE;
DROP TABLE IF EXISTS writing_claims CASCADE;
DROP TABLE IF EXISTS active_context CASCADE;
DROP TABLE IF EXISTS article_versions CASCADE;
DROP TABLE IF EXISTS articles CASCADE;

-- Drop existing triggers and functions if they exist
DROP TRIGGER IF EXISTS trigger_update_article_timestamp ON articles;
DROP TRIGGER IF EXISTS trigger_update_writing_claim_timestamp ON writing_claims;
DROP TRIGGER IF EXISTS trigger_update_writing_suggestion_timestamp ON writing_suggestions;
DROP FUNCTION IF EXISTS update_article_timestamp();

-- ============================================
-- CREATE TABLES
-- ============================================

-- Articles table (1:1 relationship with projects)
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  word_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Article versions (for version history and undo/redo)
CREATE TABLE article_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, version)
);

-- Writing claims (detected claims with Toulmin evaluation)
CREATE TABLE writing_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  position_start INTEGER NOT NULL,
  position_end INTEGER NOT NULL,
  
  -- Toulmin structure (stored as JSONB for flexibility)
  toulmin_data JSONB,
  
  -- Related evidence from notebook
  evidence_cell_ids TEXT[],
  evidence_insight_ids TEXT[],
  
  -- Evaluation metadata
  confidence_score DECIMAL(3,2),
  has_sufficient_evidence BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Writing suggestions (AI-generated suggestions for claims)
CREATE TABLE writing_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES writing_claims(id) ON DELETE CASCADE,
  
  -- Suggestion details
  suggestion_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  explanation TEXT,
  
  -- Action data
  replacement_text TEXT,
  suggested_analysis JSONB,
  
  -- User interaction tracking
  status VARCHAR(20) DEFAULT 'active',
  priority INTEGER DEFAULT 5,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Active context (which hypothesis user is currently writing about)
CREATE TABLE active_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  active_hypothesis_id VARCHAR(10),
  last_cursor_position INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX idx_articles_project 
  ON articles(project_id);

CREATE INDEX idx_article_versions_article 
  ON article_versions(article_id, version DESC);

CREATE INDEX idx_writing_claims_article 
  ON writing_claims(article_id);

CREATE INDEX idx_writing_claims_position 
  ON writing_claims(article_id, position_start, position_end);

CREATE INDEX idx_writing_suggestions_claim 
  ON writing_suggestions(claim_id);

CREATE INDEX idx_writing_suggestions_status 
  ON writing_suggestions(status) 
  WHERE status = 'active';

CREATE INDEX idx_active_context_project 
  ON active_context(project_id);

-- ============================================
-- CREATE TRIGGERS
-- ============================================

-- Function for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_article_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for articles
CREATE TRIGGER trigger_update_article_timestamp
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_article_timestamp();

-- Trigger for writing_claims
CREATE TRIGGER trigger_update_writing_claim_timestamp
  BEFORE UPDATE ON writing_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_article_timestamp();

-- Trigger for writing_suggestions
CREATE TRIGGER trigger_update_writing_suggestion_timestamp
  BEFORE UPDATE ON writing_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_article_timestamp();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE articles IS 
  'Stores writing content for each project. One article per project.';

COMMENT ON TABLE article_versions IS 
  'Version history for articles. Enables undo/redo and audit trail.';

COMMENT ON TABLE writing_claims IS 
  'Detected claims in writing with Toulmin evaluation and evidence mapping.';

COMMENT ON TABLE writing_suggestions IS 
  'AI-generated suggestions for improving claims based on notebook evidence.';

COMMENT ON TABLE active_context IS 
  'Tracks which hypothesis the user is currently writing about for context-aware suggestions.';