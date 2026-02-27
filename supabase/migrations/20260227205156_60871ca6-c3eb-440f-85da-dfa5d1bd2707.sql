-- Etapa 0: bot_paused_until for automatic handoff
ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS bot_paused_until TIMESTAMPTZ;

-- Etapa 2: resolution fields
ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS resolution_reason TEXT;

-- Etapa 3: Quick replies table
CREATE TABLE IF NOT EXISTS quick_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'geral',
  shortcut TEXT,
  use_count INT DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage quick_replies"
  ON quick_replies FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Etapa 4: Contact notes table
CREATE TABLE IF NOT EXISTS whatsapp_contact_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE whatsapp_contact_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage contact notes"
  ON whatsapp_contact_notes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_contact_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE quick_replies;