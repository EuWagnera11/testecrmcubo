ALTER TABLE public.project_fields DROP CONSTRAINT project_fields_field_type_check;

ALTER TABLE public.project_fields ADD CONSTRAINT project_fields_field_type_check 
CHECK (field_type = ANY (ARRAY['design', 'copy', 'traffic', 'social_media', 'general', 'briefing', 'landing_page', 'drive', 'observacoes', 'referencias', 'logo', 'branding', 'estrategia', 'conteudo', 'midia', 'documentos', 'outros']::text[]));