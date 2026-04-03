
-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles table (per security guidelines)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Critique Requests table
CREATE TABLE public.critique_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','in-review','changes-requested','approved','closed')),
  design_stage TEXT NOT NULL CHECK (design_stage IN ('exploration','wireframe','high-fidelity','prototype','final-review')),
  project_tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.critique_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRs are viewable by authenticated users"
  ON public.critique_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create CRs"
  ON public.critique_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own CRs"
  ON public.critique_requests FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own CRs"
  ON public.critique_requests FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TRIGGER update_crs_updated_at
  BEFORE UPDATE ON public.critique_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Artifacts table
CREATE TABLE public.artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cr_id UUID NOT NULL REFERENCES public.critique_requests(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image','figma','loom','figjam','url')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artifacts viewable by authenticated"
  ON public.artifacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "CR authors can manage artifacts"
  ON public.artifacts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.critique_requests WHERE id = cr_id AND author_id = auth.uid()));
CREATE POLICY "CR authors can update artifacts"
  ON public.artifacts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.critique_requests WHERE id = cr_id AND author_id = auth.uid()));
CREATE POLICY "CR authors can delete artifacts"
  ON public.artifacts FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.critique_requests WHERE id = cr_id AND author_id = auth.uid()));

-- Reviewers table
CREATE TABLE public.reviewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cr_id UUID NOT NULL REFERENCES public.critique_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','approved','changes-requested')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cr_id, user_id)
);
ALTER TABLE public.reviewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviewers viewable by authenticated"
  ON public.reviewers FOR SELECT TO authenticated USING (true);
CREATE POLICY "CR authors can add reviewers"
  ON public.reviewers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.critique_requests WHERE id = cr_id AND author_id = auth.uid()));
CREATE POLICY "Reviewers can update own status"
  ON public.reviewers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "CR authors can remove reviewers"
  ON public.reviewers FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.critique_requests WHERE id = cr_id AND author_id = auth.uid()));

-- Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cr_id UUID NOT NULL REFERENCES public.critique_requests(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  artifact_id UUID REFERENCES public.artifacts(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'suggestion' CHECK (comment_type IN ('suggestion','question','blocker','praise')),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by authenticated"
  ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Comment authors can update own comments"
  ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "CR authors can resolve comments"
  ON public.comments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.critique_requests WHERE id = cr_id AND author_id = auth.uid()));

-- CR Events table
CREATE TABLE public.cr_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cr_id UUID NOT NULL REFERENCES public.critique_requests(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('review_completed','review_undone')),
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cr_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events viewable by authenticated"
  ON public.cr_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create events"
  ON public.cr_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);

-- Indexes for performance
CREATE INDEX idx_crs_author ON public.critique_requests(author_id);
CREATE INDEX idx_crs_status ON public.critique_requests(status);
CREATE INDEX idx_artifacts_cr ON public.artifacts(cr_id);
CREATE INDEX idx_reviewers_cr ON public.reviewers(cr_id);
CREATE INDEX idx_reviewers_user ON public.reviewers(user_id);
CREATE INDEX idx_comments_cr ON public.comments(cr_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);
CREATE INDEX idx_cr_events_cr ON public.cr_events(cr_id);
