-- POLICIES DE SÉCURITÉ RLS SÉCURISÉES POUR ARAMIS FIGHTER
-- ⚠️  IMPORTANT : EXÉCUTER APRÈS supabase_safe_update.sql
-- ⚠️  Ce script gère les policies existantes (DROP IF EXISTS + CREATE)

-- 1. ACTIVATION DU ROW LEVEL SECURITY SUR TOUTES LES TABLES
-- (Sécurisé - ne fait rien si déjà activé)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- 2. SUPPRESSION SÉCURISÉE DES POLICIES EXISTANTES
-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Validated admins can view all profiles" ON profiles;

-- Clubs
DROP POLICY IF EXISTS "Authenticated users can view clubs" ON clubs;
DROP POLICY IF EXISTS "Trainers can create clubs" ON clubs;
DROP POLICY IF EXISTS "Club founders can update clubs" ON clubs;
DROP POLICY IF EXISTS "Club founders can delete clubs" ON clubs;
DROP POLICY IF EXISTS "Validated admins can manage all clubs" ON clubs;

-- Club Memberships
DROP POLICY IF EXISTS "Users can view own memberships" ON club_memberships;
DROP POLICY IF EXISTS "Club managers can view memberships" ON club_memberships;
DROP POLICY IF EXISTS "Club managers can create memberships" ON club_memberships;
DROP POLICY IF EXISTS "Club managers can update memberships" ON club_memberships;
DROP POLICY IF EXISTS "Club founders can delete memberships" ON club_memberships;

-- Club Requests
DROP POLICY IF EXISTS "Users can view own club requests" ON club_requests;
DROP POLICY IF EXISTS "Users can create club requests" ON club_requests;
DROP POLICY IF EXISTS "Users can update own club requests" ON club_requests;
DROP POLICY IF EXISTS "Club managers can view club requests" ON club_requests;
DROP POLICY IF EXISTS "Club managers can update club requests" ON club_requests;

-- Matches
DROP POLICY IF EXISTS "Users can view own matches" ON matches;
DROP POLICY IF EXISTS "Users can create own matches" ON matches;
DROP POLICY IF EXISTS "Users can update own matches" ON matches;
DROP POLICY IF EXISTS "Club trainers can view club matches" ON matches;
DROP POLICY IF EXISTS "Club trainers can create club matches" ON matches;
DROP POLICY IF EXISTS "Validated admins can view all matches" ON matches;

-- 3. CRÉATION DES FONCTIONS DE SÉCURITÉ (remplace si existe)
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

-- 4. POLICIES POUR LA TABLE PROFILES
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

-- 5. POLICIES POUR LA TABLE CLUBS
-- Tous les utilisateurs authentifiés peuvent voir les clubs (pour rejoindre)
CREATE POLICY "Authenticated users can view clubs" ON clubs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Seuls les entraîneurs peuvent créer des clubs
CREATE POLICY "Trainers can create clubs" ON clubs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND type IN ('entraineur', 'admin')
    )
  );

-- Seuls les fondateurs peuvent modifier leurs clubs
CREATE POLICY "Club founders can update clubs" ON clubs
  FOR UPDATE USING (auth.uid() = founder_id);

-- Seuls les fondateurs peuvent supprimer leurs clubs
CREATE POLICY "Club founders can delete clubs" ON clubs
  FOR DELETE USING (auth.uid() = founder_id);

-- Les admins validés peuvent gérer tous les clubs
CREATE POLICY "Validated admins can manage all clubs" ON clubs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND type = 'admin' 
      AND is_admin_validated = true
    )
  );

-- 6. POLICIES POUR LA TABLE CLUB_MEMBERSHIPS
-- Les utilisateurs peuvent voir leurs propres adhésions
CREATE POLICY "Users can view own memberships" ON club_memberships
  FOR SELECT USING (auth.uid() = user_id);

-- Les entraîneurs et fondateurs peuvent voir les adhésions de leur club
CREATE POLICY "Club managers can view memberships" ON club_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      JOIN profiles p ON p.id = auth.uid()
      WHERE cm.club_id = club_memberships.club_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'accepted'
      AND (cm.role = 'entraineur' OR cm.role = 'fondateur')
      AND p.type IN ('entraineur', 'admin')
    )
  );

-- Les entraîneurs peuvent créer des adhésions (inviter des membres)
CREATE POLICY "Club managers can create memberships" ON club_memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      JOIN profiles p ON p.id = auth.uid()
      WHERE cm.club_id = club_memberships.club_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'accepted'
      AND (cm.role = 'entraineur' OR cm.role = 'fondateur')
      AND p.type IN ('entraineur', 'admin')
    )
  );

-- Les entraîneurs peuvent modifier les adhésions (accepter/refuser)
CREATE POLICY "Club managers can update memberships" ON club_memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      JOIN profiles p ON p.id = auth.uid()
      WHERE cm.club_id = club_memberships.club_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'accepted'
      AND (cm.role = 'entraineur' OR cm.role = 'fondateur')
      AND p.type IN ('entraineur', 'admin')
    )
  );

-- Seuls les fondateurs peuvent supprimer des adhésions (exclure des membres)
CREATE POLICY "Club founders can delete memberships" ON club_memberships
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clubs c
      WHERE c.id = club_memberships.club_id
      AND c.founder_id = auth.uid()
    )
  );

-- 7. POLICIES POUR LA TABLE CLUB_REQUESTS
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

-- 8. POLICIES POUR LA TABLE MATCHES
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

-- 9. MESSAGE DE CONFIRMATION
DO $$
BEGIN
    RAISE NOTICE 'Policies RLS Aramis Fighter appliquées avec succès !';
    RAISE NOTICE 'Sécurité activée sur : profiles, clubs, club_memberships, club_requests, matches';
    RAISE NOTICE 'Base de données prête pour l''application !';
END $$;
