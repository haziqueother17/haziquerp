-- Create shared_chats table
CREATE TABLE public.shared_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  character_id TEXT NOT NULL,
  share_id TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shared_messages table (copy of messages for sharing)
CREATE TABLE public.shared_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_chat_id UUID REFERENCES public.shared_chats(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_messages ENABLE ROW LEVEL SECURITY;

-- Shared chats policies - owners can manage, anyone can view
CREATE POLICY "Anyone can view shared chats"
ON public.shared_chats FOR SELECT
USING (true);

CREATE POLICY "Users can create their own shared chats"
ON public.shared_chats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared chats"
ON public.shared_chats FOR DELETE
USING (auth.uid() = user_id);

-- Shared messages policies - anyone can view, only owner can insert
CREATE POLICY "Anyone can view shared messages"
ON public.shared_messages FOR SELECT
USING (true);

CREATE POLICY "Users can insert messages to their shared chats"
ON public.shared_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shared_chats
    WHERE id = shared_chat_id AND user_id = auth.uid()
  )
);

-- Index for faster lookups
CREATE INDEX idx_shared_chats_share_id ON public.shared_chats(share_id);
CREATE INDEX idx_shared_messages_chat_id ON public.shared_messages(shared_chat_id);