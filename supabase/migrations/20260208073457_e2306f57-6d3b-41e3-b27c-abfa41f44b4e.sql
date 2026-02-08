-- Create group chats table
CREATE TABLE public.group_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id TEXT NOT NULL,
  name TEXT,
  invite_code TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(6), 'hex'),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(invite_code)
);

-- Create group participants table
CREATE TABLE public.group_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_chat_id UUID NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_chat_id, user_id)
);

-- Create group messages table
CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_chat_id UUID NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Group chats policies
CREATE POLICY "Participants can view their group chats"
ON public.group_chats FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_participants
    WHERE group_participants.group_chat_id = group_chats.id
    AND group_participants.user_id = auth.uid()
  )
  OR created_by = auth.uid()
);

CREATE POLICY "Anyone can view group chat by invite code"
ON public.group_chats FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create group chats"
ON public.group_chats FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can delete group chat"
ON public.group_chats FOR DELETE
USING (auth.uid() = created_by);

-- Group participants policies
CREATE POLICY "Participants can view group members"
ON public.group_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_participants gp
    WHERE gp.group_chat_id = group_participants.group_chat_id
    AND gp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join groups"
ON public.group_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
ON public.group_participants FOR DELETE
USING (auth.uid() = user_id);

-- Group messages policies
CREATE POLICY "Participants can view group messages"
ON public.group_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_participants
    WHERE group_participants.group_chat_id = group_messages.group_chat_id
    AND group_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Participants can send messages"
ON public.group_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_participants
    WHERE group_participants.group_chat_id = group_messages.group_chat_id
    AND group_participants.user_id = auth.uid()
  )
);

-- Enable realtime for group messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- Create index for faster lookups
CREATE INDEX idx_group_messages_chat_id ON public.group_messages(group_chat_id);
CREATE INDEX idx_group_participants_user_id ON public.group_participants(user_id);
CREATE INDEX idx_group_chats_invite_code ON public.group_chats(invite_code);