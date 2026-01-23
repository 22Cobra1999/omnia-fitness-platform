CREATE TABLE IF NOT EXISTS public.client_document_progress (
    id BIGSERIAL PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_id BIGINT NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    topic_id BIGINT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    downloaded BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    downloaded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, activity_id, topic_id)
);

-- RLS Policies
ALTER TABLE public.client_document_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" ON public.client_document_progress
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Users can insert/update their own progress" ON public.client_document_progress
    FOR ALL USING (auth.uid() = client_id);
