-- Create a type for the flow status for better data integrity
CREATE TYPE flow_status AS ENUM ('active', 'completed', 'abandoned');

CREATE TABLE flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Link to the user who created the flow
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task_description TEXT NOT NULL,
    allowed_urls TEXT[] NOT NULL,
    -- Add a status to track the state of the flow
    status flow_status NOT NULL DEFAULT 'active',
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ
);

CREATE TABLE activity (
    id BIGSERIAL PRIMARY KEY,
    flow_id UUID REFERENCES flows(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    -- Add a flag to explicitly mark distractions
    is_distraction BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Add policies for row-level security
-- Users can only see their own flows
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own flows" ON flows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own flows" ON flows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own flows" ON flows FOR UPDATE USING (auth.uid() = user_id);


-- Users can only see activity related to their own flows
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see activity for their own flows" ON activity FOR SELECT
USING (
  auth.uid() = (SELECT user_id FROM flows WHERE id = flow_id)
);
CREATE POLICY "Users can insert activity for their own flows" ON activity FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT user_id FROM flows WHERE id = flow_id)
);
