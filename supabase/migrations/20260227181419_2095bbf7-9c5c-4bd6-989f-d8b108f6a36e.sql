
ALTER TABLE public.whatsapp_conversations 
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_bot_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
