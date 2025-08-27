// UTILITAIRE DE MIGRATION DES DONNÉES ARAMIS FIGHTER
// Récupère les anciennes données et les migre vers le nouveau système sécurisé

import { setSecureItem, getSecureItem, validateAndSanitize } from './secureStorage';
import { logger, cache } from './performanceOptimizer';

// Migration des données de profil utilisateur
export const migrateUserProfile = (userId) => {
  logger.log('🔄 Début de la migration des données utilisateur pour:', userId);
  
  try {
    // 1. Vérifier si les nouvelles données existent déjà
    const existingProfile = getSecureItem(`userProfile_${userId}`, userId);
    if (existingProfile && existingProfile.prenom && existingProfile.nom) {
      logger.debug('✅ Profil sécurisé déjà existant, pas de migration nécessaire');
      return existingProfile;
    }
    
    // 2. Récupérer les anciennes données non-chiffrées
    const legacyData = {
      // Ancien profil global
      userProfile: JSON.parse(localStorage.getItem('userProfile') || 'null'),
      // Anciennes données temporaires
      tempUserData: JSON.parse(localStorage.getItem('tempUserData') || 'null'),
      // Données d'inscription en attente
      pendingProfile: JSON.parse(localStorage.getItem('pendingProfile') || 'null'),
      // Autres formats possibles
      profile: JSON.parse(localStorage.getItem('profile') || 'null'),
      user: JSON.parse(localStorage.getItem('user') || 'null')
    };
    
    logger.debug('📦 Données legacy trouvées:', legacyData);
    
    // 3. Fusionner et nettoyer les données récupérées
    let migratedProfile = {
      id: userId,
      prenom: '',
      nom: '',
      type: 'escrimeur',
      club_id: '',
      is_admin_validated: false
    };
    
    // Priorité de récupération des données
    const sources = [
      legacyData.userProfile,
      legacyData.tempUserData,
      legacyData.pendingProfile,
      legacyData.profile,
      legacyData.user
    ];
    
    for (const source of sources) {
      if (source) {
        // Récupérer le prénom
        if (!migratedProfile.prenom && source.prenom) {
          const cleanPrenom = validateAndSanitize.text(source.prenom);
          if (cleanPrenom && validateAndSanitize.name(cleanPrenom)) {
            migratedProfile.prenom = cleanPrenom;
            logger.debug('✅ Prénom récupéré:', cleanPrenom);
          }
        }
        
        // Récupérer le nom
        if (!migratedProfile.nom && source.nom) {
          const cleanNom = validateAndSanitize.text(source.nom);
          if (cleanNom && validateAndSanitize.name(cleanNom)) {
            migratedProfile.nom = cleanNom;
            logger.debug('✅ Nom récupéré:', cleanNom);
          }
        }
        
        // Récupérer le type/rôle
        if (source.type && validateUserRole(source.type)) {
          migratedProfile.type = source.type;
          logger.debug('✅ Rôle récupéré:', source.type);
        }
        
        // Récupérer le club_id
        if (source.club_id) {
          migratedProfile.club_id = validateAndSanitize.text(source.club_id);
          logger.debug('✅ Club ID récupéré:', source.club_id);
        }
        
        // Récupérer le statut admin
        if (source.is_admin_validated === true) {
          migratedProfile.is_admin_validated = true;
          logger.debug('✅ Statut admin récupéré');
        }
      }
    }
    
    // 4. Sauvegarder le profil migré de manière sécurisée
    if (migratedProfile.prenom || migratedProfile.nom) {
      setSecureItem(`userProfile_${userId}`, migratedProfile, userId);
      setSecureItem('userProfile', migratedProfile); // Fallback global
      logger.log('✅ Profil migré et sauvegardé:', migratedProfile);
      
      // 5. Nettoyer les anciennes données (optionnel)
      // localStorage.removeItem('userProfile');
      // localStorage.removeItem('tempUserData');
      // localStorage.removeItem('pendingProfile');
      
      return migratedProfile;
    } else {
      logger.warn('⚠️ Aucune donnée utilisateur valide trouvée pour migration');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration des données:', error);
    return null;
  }
};

// Migration des données de clubs
export const migrateClubData = () => {
  logger.debug('🔄 Migration des données de clubs');
  
  try {
    // Récupérer les anciennes données de clubs
    const legacyClubs = JSON.parse(localStorage.getItem('clubs') || '[]');
    const legacyMemberships = JSON.parse(localStorage.getItem('club_memberships') || '[]');
    const legacyRequests = JSON.parse(localStorage.getItem('club_requests') || '[]');
    
    // Migrer vers la nouvelle clé globale si nécessaire
    const currentSharedClubs = JSON.parse(localStorage.getItem('aramis_shared_clubs_all_sessions') || '[]');
    
    if (legacyClubs.length > 0 && currentSharedClubs.length === 0) {
      localStorage.setItem('aramis_shared_clubs_all_sessions', JSON.stringify(legacyClubs));
      logger.debug('✅ Clubs migrés vers le système partagé:', legacyClubs.length);
    }
    
    return {
      clubs: legacyClubs,
      memberships: legacyMemberships,
      requests: legacyRequests
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration des clubs:', error);
    return null;
  }
};

// Migration des données de matchs
export const migrateMatchData = () => {
  logger.debug('🔄 Migration des données de matchs');
  
  try {
    const legacyMatches = JSON.parse(localStorage.getItem('matches') || '[]');
    const legacyGameHistory = JSON.parse(localStorage.getItem('gameHistory') || '[]');
    
    // Fusionner les différentes sources
    const allMatches = [...legacyMatches, ...legacyGameHistory];
    
    if (allMatches.length > 0) {
      // Sauvegarder dans le nouveau format
      localStorage.setItem('matches', JSON.stringify(allMatches));
      logger.debug('✅ Matchs migrés:', allMatches.length);
      return allMatches;
    }
    
    return [];
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration des matchs:', error);
    return [];
  }
};

// Migration complète
export const performFullMigration = (userId) => {
  logger.log('🚀 Début de la migration complète pour utilisateur:', userId);
  
  const results = {
    profile: migrateUserProfile(userId),
    clubs: migrateClubData(),
    matches: migrateMatchData()
  };
  
  logger.log('✅ Migration complète terminée:', results);
  return results;
};

// Vérification si une migration est nécessaire
export const needsMigration = (userId) => {
  // Vérifier si le profil sécurisé existe
  const secureProfile = getSecureItem(`userProfile_${userId}`, userId);
  
  // Vérifier si des données legacy existent
  const hasLegacyData = 
    localStorage.getItem('userProfile') ||
    localStorage.getItem('tempUserData') ||
    localStorage.getItem('pendingProfile');
  
  return !secureProfile && hasLegacyData;
};
