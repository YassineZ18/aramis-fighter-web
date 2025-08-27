// Gestionnaire de sessions sécurisé
import { supabase } from './supabaseClient';
import { setSecureItem, getSecureItem, removeSecureItem } from './secureStorage';
import { logger } from './performanceOptimizer';

// Durée d'expiration des sessions (en millisecondes)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 heures
const ACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 heures d'inactivité

// Créer une session sécurisée
export const createSecureSession = (userId, userData) => {
  const sessionData = {
    userId,
    userData,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    isValid: true
  };
  
  setSecureItem('secure_session', sessionData, userId);
  setSecureItem('currentUserId', userId);
  
  // Programmer l'expiration automatique
  scheduleSessionCleanup();
  
  return sessionData;
};

// Valider une session existante
export const validateSession = async () => {
  try {
    const currentUserId = getSecureItem('currentUserId');
    if (!currentUserId) return null;
    
    const sessionData = getSecureItem('secure_session', currentUserId);
    if (!sessionData) return null;
    
    const now = Date.now();
    
    // Vérifier l'expiration absolue
    if (now - sessionData.createdAt > SESSION_TIMEOUT) {
      logger.warn('Session expirée (durée maximale)');
      await clearSession();
      return null;
    }
    
    // Vérifier l'inactivité
    if (now - sessionData.lastActivity > ACTIVITY_TIMEOUT) {
      logger.warn('Session expirée (inactivité)');
      await clearSession();
      return null;
    }
    
    // Vérifier la validité côté Supabase
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user || user.id !== currentUserId) {
      logger.warn('Session Supabase invalide');
      await clearSession();
      return null;
    }
    
    // Mettre à jour l'activité
    sessionData.lastActivity = now;
    setSecureItem('secure_session', sessionData, currentUserId);
    
    return sessionData;
  } catch (error) {
    console.error('Erreur validation session:', error);
    await clearSession();
    return null;
  }
};

// Mettre à jour l'activité de la session
export const updateSessionActivity = () => {
  const currentUserId = getSecureItem('currentUserId');
  if (!currentUserId) return;
  
  const sessionData = getSecureItem('secure_session', currentUserId);
  if (sessionData) {
    sessionData.lastActivity = Date.now();
    setSecureItem('secure_session', sessionData, currentUserId);
  }
};

// Obtenir l'utilisateur actuel
export const getCurrentUser = () => {
  const currentUserId = getSecureItem('currentUserId');
  if (!currentUserId) return null;
  
  const sessionData = getSecureItem('secure_session', currentUserId);
  if (!sessionData) return null;
  
  return {
    id: currentUserId,
    ...sessionData.userData
  };
};

// Nettoyer une session
export const clearSession = async () => {
  try {
    const currentUserId = getSecureItem('currentUserId');
    
    // Déconnexion Supabase
    await supabase.auth.signOut();
    
    // Nettoyer le stockage local
    if (currentUserId) {
      removeSecureItem('secure_session');
      removeSecureItem(`userProfile_${currentUserId}`);
    }
    removeSecureItem('currentUserId');
    removeSecureItem('userProfile');
    
    logger.debug('Session nettoyée');
  } catch (error) {
    console.error('Erreur nettoyage session:', error);
  }
};

// Programmer le nettoyage automatique des sessions expirées
export const scheduleSessionCleanup = () => {
  // Vérifier toutes les 5 minutes
  setInterval(async () => {
    const session = await validateSession();
    if (!session) {
      logger.debug('Session auto-nettoyée');
    }
  }, 5 * 60 * 1000);
};

// Middleware pour protéger les actions sensibles
export const requireValidSession = async (action) => {
  const session = await validateSession();
  if (!session) {
    throw new Error('Session invalide ou expirée');
  }
  
  updateSessionActivity();
  return action();
};

// Vérifier les permissions utilisateur
export const checkUserPermission = (userProfile, requiredRole, requiredValidation = false) => {
  if (!userProfile) return false;
  
  // Vérifier le rôle
  if (requiredRole && userProfile.type !== requiredRole) {
    return false;
  }
  
  // Vérifier la validation admin si nécessaire
  if (requiredValidation && !userProfile.is_admin_validated) {
    return false;
  }
  
  return true;
};

// Export par défaut de l'objet sessionManager
export const sessionManager = {
  createSession: createSecureSession,
  validateSession,
  updateSessionActivity,
  cleanupSession: clearSession,
  scheduleSessionCleanup,
  requireValidSession,
  checkUserPermission
};
