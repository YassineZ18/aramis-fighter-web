-- SCHÉMA DE BASE DE DONNÉES COMPLET POUR ARAMIS FIGHTER
-- À EXÉCUTER EN PREMIER dans Supabase SQL Editor

-- 1. CRÉATION DE LA TABLE PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('escrimeur', 'entraineur', 'admin')),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  club_id UUID,
  is_admin_validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRÉATION DE LA TABLE CLUBS
CREATE TABLE IF NOT EXISTS clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  founder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRÉATION DE LA TABLE CLUB_MEMBERSHIPS
CREATE TABLE IF NOT EXISTS club_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('fondateur', 'entraineur', 'escrimeur')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, club_id)
);

-- 4. CRÉATION DE LA TABLE CLUB_REQUESTS
CREATE TABLE IF NOT EXISTS club_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, club_id)
);

-- 5. CRÉATION DE LA TABLE MATCHES (pour l'historique des matchs)
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  player1_name TEXT NOT NULL,
  player2_name TEXT NOT NULL,
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  match_data JSONB, -- Stockage des détails du match (touches, actions, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CRÉATION DES INDEX POUR OPTIMISER LES PERFORMANCES
CREATE INDEX IF NOT EXISTS idx_profiles_type ON profiles(type);
CREATE INDEX IF NOT EXISTS idx_profiles_club_id ON profiles(club_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_user_id ON club_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_club_id ON club_memberships(club_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_status ON club_memberships(status);
CREATE INDEX IF NOT EXISTS idx_club_requests_user_id ON club_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_club_requests_club_id ON club_requests(club_id);
CREATE INDEX IF NOT EXISTS idx_club_requests_status ON club_requests(status);
CREATE INDEX IF NOT EXISTS idx_matches_player1_id ON matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2_id ON matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_club_id ON matches(club_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at);

-- 7. CRÉATION DES TRIGGERS POUR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_club_memberships_updated_at BEFORE UPDATE ON club_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_club_requests_updated_at BEFORE UPDATE ON club_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. CRÉATION D'UNE VUE POUR LES STATISTIQUES DE CLUB
CREATE OR REPLACE VIEW club_stats AS
SELECT 
  c.id,
  c.name,
  c.founder_id,
  COUNT(DISTINCT cm.user_id) FILTER (WHERE cm.status = 'accepted') as total_members,
  COUNT(DISTINCT cm.user_id) FILTER (WHERE cm.status = 'accepted' AND cm.role = 'entraineur') as total_trainers,
  COUNT(DISTINCT cm.user_id) FILTER (WHERE cm.status = 'accepted' AND cm.role = 'escrimeur') as total_fencers,
  COUNT(DISTINCT m.id) as total_matches,
  c.created_at
FROM clubs c
LEFT JOIN club_memberships cm ON c.id = cm.club_id
LEFT JOIN matches m ON c.id = m.club_id
GROUP BY c.id, c.name, c.founder_id, c.created_at;

-- 9. INSERTION DES DONNÉES DE TEST (OPTIONNEL)
-- Décommentez si vous voulez des données de test

/*
-- Insérer un profil admin de test (remplacez l'UUID par un vrai ID utilisateur)
INSERT INTO profiles (id, type, nom, prenom, is_admin_validated) 
VALUES ('00000000-0000-0000-0000-000000000001', 'admin', 'Admin', 'Système', true)
ON CONFLICT (id) DO NOTHING;

-- Insérer un club de test
INSERT INTO clubs (id, name, founder_id) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Club Aramis Test', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
*/

-- 10. COMMENTAIRES ET DOCUMENTATION
COMMENT ON TABLE profiles IS 'Profils utilisateurs avec rôles et informations personnelles';
COMMENT ON TABLE clubs IS 'Clubs d''escrime avec fondateurs';
COMMENT ON TABLE club_memberships IS 'Adhésions aux clubs avec rôles et statuts';
COMMENT ON TABLE club_requests IS 'Demandes d''adhésion aux clubs';
COMMENT ON TABLE matches IS 'Historique des matchs d''escrime';
COMMENT ON VIEW club_stats IS 'Statistiques agrégées par club';
