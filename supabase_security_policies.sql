-- POLICIES DE SÉCURITÉ RLS POUR ARAMIS FIGHTER
-- ⚠️  IMPORTANT : EXÉCUTER D'ABORD le fichier supabase_database_schema.sql
-- ⚠️  PUIS EXÉCUTER ce fichier dans Supabase SQL Editor

-- 1. ACTIVATION DU ROW LEVEL SECURITY SUR TOUTES LES TABLES
-- (Les tables doivent exister avant d'activer RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES POUR LA TABLE PROFILES
-- Les utilisateurs ne peuvent voir que leur propre profil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Les utilisateurs peuvent insérer leur propre profil
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Les admins validés peuvent voir tous les profils
CREATE POLICY "Validated admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND type = 'admin' 
      AND is_admin_validated = true
    )
  );

-- 3. POLICIES POUR LA TABLE CLUBS
-- Tous les utilisateurs authentifiés peuvent voir les clubs (pour rejoindre)
CREATE POLICY "Authenticated users can view clubs" ON clubs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Seuls les entraîneurs peuvent créer des clubs
CREATE POLICY "Trainers can create clubs" ON clubs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND type = 'entraineur'
    )
  );

-- Seuls les fondateurs peuvent modifier/supprimer leurs clubs
CREATE POLICY "Founders can update own clubs" ON clubs
  FOR UPDATE USING (founder_id = auth.uid());

CREATE POLICY "Founders can delete own clubs" ON clubs
  FOR DELETE USING (founder_id = auth.uid());

-- 4. POLICIES POUR LA TABLE CLUB_MEMBERSHIPS
-- Les utilisateurs peuvent voir leurs propres adhésions
CREATE POLICY "Users can view own memberships" ON club_memberships
  FOR SELECT USING (user_id = auth.uid());

-- Les entraîneurs peuvent voir les adhésions de leur club
CREATE POLICY "Trainers can view club memberships" ON club_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm2
      WHERE cm2.user_id = auth.uid()
      AND cm2.club_id = club_memberships.club_id
      AND cm2.role IN ('fondateur', 'entraineur')
      AND cm2.status = 'accepted'
    )
  );

-- Les utilisateurs peuvent créer leurs propres adhésions
CREATE POLICY "Users can create own memberships" ON club_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Les entraîneurs peuvent modifier les adhésions de leur club
CREATE POLICY "Trainers can manage club memberships" ON club_memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm2
      WHERE cm2.user_id = auth.uid()
      AND cm2.club_id = club_memberships.club_id
      AND cm2.role IN ('fondateur', 'entraineur')
      AND cm2.status = 'accepted'
    )
  );

-- 5. POLICIES POUR LA TABLE CLUB_REQUESTS
-- Les utilisateurs peuvent voir leurs propres demandes
CREATE POLICY "Users can view own club requests" ON club_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer des demandes pour rejoindre des clubs
CREATE POLICY "Users can create club requests" ON club_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres demandes (annuler)
CREATE POLICY "Users can update own club requests" ON club_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Les entraîneurs et fondateurs peuvent voir les demandes pour leurs clubs
CREATE POLICY "Club managers can view club requests" ON club_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      JOIN profiles p ON p.id = auth.uid()
      WHERE cm.club_id = club_requests.club_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'accepted'
      AND (cm.role = 'entraineur' OR cm.role = 'fondateur')
      AND p.type IN ('entraineur', 'admin')
    )
  );

-- Les entraîneurs et fondateurs peuvent mettre à jour les demandes (accepter/refuser)
CREATE POLICY "Club managers can update club requests" ON club_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      JOIN profiles p ON p.id = auth.uid()
      WHERE cm.club_id = club_requests.club_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'accepted'
      AND (cm.role = 'entraineur' OR cm.role = 'fondateur')
      AND p.type IN ('entraineur', 'admin')
    )
  );

-- 6. POLICIES POUR LA TABLE MATCHES
-- Les utilisateurs peuvent voir leurs propres matchs
CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id OR
    auth.uid() = winner_id
  );

-- Les utilisateurs peuvent créer des matchs où ils participent
CREATE POLICY "Users can create own matches" ON matches
  FOR INSERT WITH CHECK (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id
  );

-- Les utilisateurs peuvent mettre à jour leurs propres matchs
CREATE POLICY "Users can update own matches" ON matches
  FOR UPDATE USING (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id
  );

-- Les entraîneurs peuvent voir tous les matchs de leur club
CREATE POLICY "Club trainers can view club matches" ON matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      JOIN profiles p ON p.id = auth.uid()
      WHERE cm.club_id = matches.club_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'accepted'
      AND (cm.role = 'entraineur' OR cm.role = 'fondateur')
      AND p.type IN ('entraineur', 'admin')
    )
  );

-- Les entraîneurs peuvent créer des matchs pour leur club
CREATE POLICY "Club trainers can create club matches" ON matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      JOIN profiles p ON p.id = auth.uid()
      WHERE cm.club_id = matches.club_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'accepted'
      AND (cm.role = 'entraineur' OR cm.role = 'fondateur')
      AND p.type IN ('entraineur', 'admin')
    )
  );

-- Les admins validés peuvent voir tous les matchs
CREATE POLICY "Validated admins can view all matches" ON matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND type = 'admin' 
      AND is_admin_validated = true
    )
  );

-- 7. FONCTIONS DE SÉCURITÉ SUPPLÉMENTAIRES
-- Fonction pour vérifier si un utilisateur est entraîneur
CREATE OR REPLACE FUNCTION is_trainer(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND type = 'entraineur'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur est fondateur d'un club
CREATE OR REPLACE FUNCTION is_club_founder(user_id UUID, club_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM clubs 
    WHERE id = club_id 
    AND founder_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
