-- Table for storing detected claims
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Claim content
  text TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- causal, comparative, predictive, descriptive
  confidence DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
  
  -- Position in document
  position_from INTEGER NOT NULL,
  position_to INTEGER NOT NULL,
  paragraph_index INTEGER,
  
  -- Hypothesis linking
  hypothesis_links JSONB, -- Array of {hypothesisId, matchType, confidence}
  
  -- Strong language markers
  strong_language JSONB, -- Array of detected markers
  
  -- Status
  status VARCHAR(50) DEFAULT 'detected', -- detected, evaluating, evaluated, actioned
  
  -- Metadata
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing Toulmin evaluations
CREATE TABLE IF NOT EXISTS toulmin_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Toulmin components (stored as JSONB for flexibility)
  grounds JSONB NOT NULL, -- Array of Evidence objects
  warrant JSONB NOT NULL, -- Warrant object
  backing JSONB, -- Array of Backing objects
  qualifier JSONB, -- Qualifier object or null
  rebuttal JSONB, -- Array of Rebuttal objects
  
  -- Assessment
  strength VARCHAR(50) NOT NULL, -- strong, moderate, weak, unsupported
  overall_score INTEGER NOT NULL, -- 0-100
  issues JSONB, -- Array of ArgumentIssue objects
  gaps JSONB, -- Array of EvidenceGap objects
  
  -- Metadata
  evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processing_time INTEGER, -- milliseconds
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing suggestions
CREATE TABLE IF NOT EXISTS writing_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Suggestion details
  type VARCHAR(50) NOT NULL, -- weaken-claim, add-caveat, etc.
  severity VARCHAR(20) NOT NULL, -- error, warning, info
  message TEXT NOT NULL,
  explanation TEXT,
  
  -- Position
  position_from INTEGER NOT NULL,
  position_to INTEGER NOT NULL,
  
  -- Actions (stored as JSONB)
  actions JSONB NOT NULL, -- Array of SuggestionAction objects
  
  -- Priority and status
  priority INTEGER DEFAULT 50, -- 0-100, for sorting
  status VARCHAR(50) DEFAULT 'active', -- active, accepted, dismissed, expired
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for caching embeddings
CREATE TABLE IF NOT EXISTS embeddings_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content identification
  content_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of text
  text TEXT NOT NULL,
  
  -- Embedding
  embedding JSONB NOT NULL, -- Array of 768 numbers
  dimensions INTEGER DEFAULT 768,
  
  -- Context
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  source_type VARCHAR(50), -- 'cell_output', 'insight', 'hypothesis', 'claim'
  source_id UUID, -- ID of the source
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  access_count INTEGER DEFAULT 0
);

-- Table for tracking user actions on suggestions
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  suggestion_id UUID REFERENCES writing_suggestions(id) ON DELETE CASCADE,
  
  -- Action details
  action_type VARCHAR(50) NOT NULL, -- accepted, dismissed, modified
  suggestion_type VARCHAR(50), -- For analytics
  suggestion_severity VARCHAR(20), -- For analytics
  
  -- Timing
  time_to_action INTEGER, -- seconds from suggestion to action
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_claims_project ON claims(project_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_toulmin_claim ON toulmin_evaluations(claim_id);
CREATE INDEX idx_toulmin_project ON toulmin_evaluations(project_id);
CREATE INDEX idx_suggestions_claim ON writing_suggestions(claim_id);
CREATE INDEX idx_suggestions_status ON writing_suggestions(status);
CREATE INDEX idx_embeddings_hash ON embeddings_cache(content_hash);
CREATE INDEX idx_embeddings_project ON embeddings_cache(project_id);
CREATE INDEX idx_user_actions_user ON user_actions(user_id);
CREATE INDEX idx_user_actions_project ON user_actions(project_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_toulmin_updated_at BEFORE UPDATE ON toulmin_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON writing_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();