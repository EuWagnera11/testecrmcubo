-- Set the first admin user status to approved automatically
-- This will be triggered when the specific email registers

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name, status)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    CASE 
      WHEN NEW.email = 'euwagnerofficial@gmail.com' THEN 'approved'
      ELSE 'pending'
    END
  );
  
  -- If admin email, also add admin role
  IF NEW.email = 'euwagnerofficial@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;