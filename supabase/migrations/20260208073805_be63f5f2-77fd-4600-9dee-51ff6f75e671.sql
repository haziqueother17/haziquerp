-- Create security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_participant(_group_chat_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_participants
    WHERE group_chat_id = _group_chat_id
    AND user_id = _user_id
  )
$$;

-- Drop problematic policies
DROP POLICY IF EXISTS "Participants can view group members" ON public.group_participants;
DROP POLICY IF EXISTS "Participants can view group messages" ON public.group_messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Participants can view their group chats" ON public.group_chats;

-- Recreate policies using the security definer function
CREATE POLICY "Participants can view group members"
ON public.group_participants FOR SELECT
USING (public.is_group_participant(group_chat_id, auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Participants can view group messages"
ON public.group_messages FOR SELECT
USING (public.is_group_participant(group_chat_id, auth.uid()));

CREATE POLICY "Participants can send messages"
ON public.group_messages FOR INSERT
WITH CHECK (public.is_group_participant(group_chat_id, auth.uid()));

CREATE POLICY "Participants can view their group chats"
ON public.group_chats FOR SELECT
USING (
  public.is_group_participant(id, auth.uid())
  OR created_by = auth.uid()
);