-- Allow group creators to update (rename) their group chats
CREATE POLICY "Creator can update group chat"
ON public.group_chats FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);