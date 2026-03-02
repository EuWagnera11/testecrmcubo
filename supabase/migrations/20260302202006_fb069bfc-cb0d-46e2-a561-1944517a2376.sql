
-- Fix duplicate whatsapp contacts by normalizing phone numbers
-- Step 1: Create a function to normalize phones
CREATE OR REPLACE FUNCTION pg_temp.normalize_phone(raw text) RETURNS text AS $$
DECLARE
  digits text;
  rest text;
BEGIN
  digits := regexp_replace(raw, '[^0-9]', '', 'g');
  IF digits LIKE '55%' AND length(digits) > 13 THEN
    rest := substring(digits from 3);
    IF rest LIKE '55%' AND (length(rest) - 2 = 10 OR length(rest) - 2 = 11) THEN
      digits := '55' || substring(rest from 3);
    END IF;
  END IF;
  RETURN digits;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Merge duplicates - keep oldest, migrate conversations and messages
WITH normalized AS (
  SELECT id, phone, created_at,
    pg_temp.normalize_phone(phone) AS norm_phone
  FROM whatsapp_contacts
),
dupes AS (
  SELECT norm_phone,
    array_agg(id ORDER BY created_at ASC) AS ids
  FROM normalized
  GROUP BY norm_phone
  HAVING count(*) > 1
),
keeper AS (
  SELECT norm_phone, ids[1] AS keep_id, ids[2:] AS remove_ids
  FROM dupes
)
-- Update conversations to point to keeper contact
UPDATE whatsapp_conversations SET contact_id = k.keep_id
FROM keeper k
WHERE contact_id = ANY(k.remove_ids);

-- Delete duplicate contacts (conversations already migrated)
WITH normalized AS (
  SELECT id, phone, created_at,
    pg_temp.normalize_phone(phone) AS norm_phone
  FROM whatsapp_contacts
),
dupes AS (
  SELECT norm_phone,
    array_agg(id ORDER BY created_at ASC) AS ids
  FROM normalized
  GROUP BY norm_phone
  HAVING count(*) > 1
),
keeper AS (
  SELECT norm_phone, ids[2:] AS remove_ids
  FROM dupes
),
to_remove AS (
  SELECT unnest(remove_ids) AS id FROM keeper
)
DELETE FROM whatsapp_contacts WHERE id IN (SELECT id FROM to_remove);

-- Step 3: Update all phones to normalized form
UPDATE whatsapp_contacts SET phone = pg_temp.normalize_phone(phone)
WHERE phone != pg_temp.normalize_phone(phone);
