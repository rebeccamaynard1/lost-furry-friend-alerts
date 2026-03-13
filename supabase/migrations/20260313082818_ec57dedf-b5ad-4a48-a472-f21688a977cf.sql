
-- Fix permissive INSERT policy on notifications
DROP POLICY "System can insert notifications" ON public.notifications;

-- Only allow inserting notifications for yourself (edge functions use service role to bypass RLS)
CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
