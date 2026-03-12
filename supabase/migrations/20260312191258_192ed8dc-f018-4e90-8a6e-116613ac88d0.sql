
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('user', 'shelter', 'volunteer', 'rural_partner', 'sponsor', 'admin');

-- User roles table (security best practice - separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  profile_photo TEXT,
  home_address TEXT,
  subscription_status TEXT DEFAULT 'free',
  device_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Lost pets table
CREATE TABLE public.lost_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pet_name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  color TEXT NOT NULL,
  age TEXT,
  gender TEXT,
  microchip TEXT,
  last_seen_lat DOUBLE PRECISION,
  last_seen_lng DOUBLE PRECISION,
  last_seen_address TEXT,
  date_lost DATE NOT NULL,
  photos TEXT[] DEFAULT '{}',
  video TEXT,
  description TEXT,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'lost' CHECK (status IN ('lost', 'found', 'reunited')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lost_pets ENABLE ROW LEVEL SECURITY;

-- Found pets table
CREATE TABLE public.found_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shelter_id UUID,
  species TEXT NOT NULL,
  breed TEXT,
  color TEXT NOT NULL,
  found_lat DOUBLE PRECISION,
  found_lng DOUBLE PRECISION,
  found_address TEXT,
  date_found DATE NOT NULL,
  photos TEXT[] DEFAULT '{}',
  video TEXT,
  holding_location TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'found' CHECK (status IN ('found', 'claimed', 'reunited')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.found_pets ENABLE ROW LEVEL SECURITY;

-- Sightings table
CREATE TABLE public.sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,
  notes TEXT,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sightings ENABLE ROW LEVEL SECURITY;

-- Shelters table
CREATE TABLE public.shelters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;

-- Volunteers table
CREATE TABLE public.volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  county TEXT,
  skills TEXT,
  availability TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

-- Rural partners table
CREATE TABLE public.rural_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  county TEXT,
  hunting_area TEXT,
  trail_cam_uploads TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rural_partners ENABLE ROW LEVEL SECURITY;

-- Sponsors table
CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  logo TEXT,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold')),
  website TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lost_pets_updated_at BEFORE UPDATE ON public.lost_pets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_found_pets_updated_at BEFORE UPDATE ON public.found_pets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shelters_updated_at BEFORE UPDATE ON public.shelters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- User roles: users can read their own roles
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Profiles: public read, own write
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Lost pets: public read, own write
CREATE POLICY "Lost pets are viewable by everyone" ON public.lost_pets FOR SELECT USING (true);
CREATE POLICY "Users can create lost pet reports" ON public.lost_pets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lost pet reports" ON public.lost_pets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lost pet reports" ON public.lost_pets FOR DELETE USING (auth.uid() = user_id);

-- Found pets: public read, own write
CREATE POLICY "Found pets are viewable by everyone" ON public.found_pets FOR SELECT USING (true);
CREATE POLICY "Users can create found pet reports" ON public.found_pets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own found pet reports" ON public.found_pets FOR UPDATE USING (auth.uid() = user_id);

-- Sightings: public read, own write
CREATE POLICY "Sightings are viewable by everyone" ON public.sightings FOR SELECT USING (true);
CREATE POLICY "Users can create sightings" ON public.sightings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shelters: public read, own write
CREATE POLICY "Shelters are viewable by everyone" ON public.shelters FOR SELECT USING (true);
CREATE POLICY "Users can create shelter profiles" ON public.shelters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shelter" ON public.shelters FOR UPDATE USING (auth.uid() = user_id);

-- Volunteers: public read, own write
CREATE POLICY "Volunteers are viewable by everyone" ON public.volunteers FOR SELECT USING (true);
CREATE POLICY "Users can register as volunteer" ON public.volunteers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own volunteer profile" ON public.volunteers FOR UPDATE USING (auth.uid() = user_id);

-- Rural partners: public read, own write
CREATE POLICY "Rural partners are viewable by everyone" ON public.rural_partners FOR SELECT USING (true);
CREATE POLICY "Users can register as rural partner" ON public.rural_partners FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sponsors: public read approved, own write
CREATE POLICY "Approved sponsors are viewable" ON public.sponsors FOR SELECT USING (approved = true OR auth.uid() = user_id);
CREATE POLICY "Users can create sponsor profiles" ON public.sponsors FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages: only sender/receiver can read
CREATE POLICY "Users can read own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own received messages" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);
