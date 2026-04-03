
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id
    )
  );

  -- Auto-join teams with pending invites for this email
  INSERT INTO public.team_members (team_id, user_id, role)
  SELECT ti.team_id, NEW.id, 'member'
  FROM public.team_invites ti
  WHERE lower(ti.email) = lower(NEW.email)
    AND ti.status = 'pending'
  ON CONFLICT (team_id, user_id) DO NOTHING;

  -- Mark those invites as accepted
  UPDATE public.team_invites
  SET status = 'accepted'
  WHERE lower(email) = lower(NEW.email)
    AND status = 'pending';

  RETURN NEW;
END;
$function$;
