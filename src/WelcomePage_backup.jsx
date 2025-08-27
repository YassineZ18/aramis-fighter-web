import React, { useState, useEffect } from 'react';
import BoutPage from './BoutPage';
import MyGamesPage from './MyGamesPage';
import ClubPage from './ClubPage';
import { setSecureItem, getSecureItem, validateAndSanitize, validateUserRole } from './secureStorage';
import { createSecureSession, validateSession, updateSessionActivity, clearSession } from './sessionManager';
import { performFullMigration, needsMigration } from './dataMigration';
import { logger, cache, debounce, performanceMonitor } from './performanceOptimizer';
import { supabase } from './supabaseClient';

// Icône de déconnexion
const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function WelcomePage({ onLogout }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showBoutPage, setShowBoutPage] = useState(false);
  const [showMyGamesPage, setShowMyGamesPage] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  // Debug: Afficher l'état du profil
  React.useEffect(() => {
    logger.critical('🔍 État actuel du profil:', userProfile);
    if (!userProfile) {
      logger.critical('⚠️ PROFIL NULL - Tentative de récupération immédiate');
      // Tentative de récupération immédiate
      const legacyProfile = getSecureItem('userProfile');
      if (legacyProfile) {
        logger.critical('✅ Profil legacy trouvé:', legacyProfile);
        setUserProfile(legacyProfile);
      } else {
        logger.critical('❌ Aucun profil trouvé dans localStorage');
      }
    }
  }, [userProfile]);
  const [currentPage, setCurrentPage] = useState('welcome');
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileForm, setProfileForm] = useState({
    prenom: '',
    nom: '',
    type: 'escrimeur'
  });

  // Pré-remplir le formulaire avec les données existantes
  useEffect(() => {
    if (userProfile && showProfileSetup) {
      setProfileForm({
        prenom: userProfile.prenom || '',
        nom: userProfile.nom || '',
        type: userProfile.type || 'escrimeur'
      });
      logger.debug(' Formulaire pré-rempli avec:', userProfile);
    }
  }, [userProfile, showProfileSetup]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fonction de déconnexion sécurisée
  const handleLogout = async () => {
    try {
      // Utiliser le gestionnaire de sessions sécurisé
      await clearSession();
      onLogout && onLogout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Fallback sur la déconnexion Supabase directe
      await supabase.auth.signOut();
      onLogout && onLogout();
    }
  };

  // Fonction pour récupérer le nom du club de l'utilisateur
  const getUserClubName = () => {
    if (!userProfile || !userProfile.id) return null;
    
    // Récupérer les adhésions de l'utilisateur
    const memberships = JSON.parse(localStorage.getItem('club_memberships') || '[]');
    const userMembership = memberships.find(m => 
      m.user_id === userProfile.id && m.status === 'accepted'
    );
    
    if (!userMembership) return null;
    
    // Récupérer le nom du club
    const clubs = JSON.parse(localStorage.getItem('clubs') || '[]');
    const userClub = clubs.find(c => c.id === userMembership.club_id);
    
    return userClub ? userClub.name : null;
  };

  // Fonction de diagnostic du profil
  const diagnoseProfile = () => {
    const currentUserId = getSecureItem('currentUserId');
    const userSpecificProfile = currentUserId ? getSecureItem(`userProfile_${currentUserId}`, currentUserId) : null;
    const legacyProfile = getSecureItem('userProfile');
    const pendingProfile = getSecureItem('pendingProfile');
    
    logger.debug('=== DIAGNOSTIC PROFIL ===');
    logger.debug('ID utilisateur:', currentUserId);
    logger.debug('Profil spécifique:', userSpecificProfile ? JSON.parse(userSpecificProfile) : 'Aucun');
    logger.debug('Profil legacy:', legacyProfile ? JSON.parse(legacyProfile) : 'Aucun');
    logger.debug('Données inscription:', pendingProfile ? JSON.parse(pendingProfile) : 'Aucun');
    logger.debug('Profil actuel:', userProfile);
    logger.debug('========================');
  };

  // Optimisation : Debounce pour éviter les validations répétitives
  const debouncedSessionValidation = debounce(async () => {
    performanceMonitor.start('session-validation');
    
    // Cache pour éviter les validations répétitives
    const cacheKey = 'session-validation';
    if (cache.has(cacheKey)) {
      const cachedSession = cache.get(cacheKey);
      if (cachedSession.value) {
        setUserProfile(cachedSession.value.profile);
        performanceMonitor.end('session-validation');
        return;
      }
    }

    if (!session) {
      logger.warn('Session invalide ou expirée - chargement fallback');
      // Fallback sans session pour permettre l'utilisation basique
      const legacyProfile = getSecureItem('userProfile');
      if (legacyProfile) {
        setUserProfile(legacyProfile);
      }
      performanceMonitor.end('session-validation');
      return;
    }
      
      updateSessionActivity();
      const currentUserId = session.userId;
      logger.debug('Session validée pour utilisateur:', currentUserId);
    
      // NOUVEAU : Vérifier si une migration est nécessaire
      if (currentUserId && needsMigration(currentUserId)) {
        logger.log('🔄 Migration nécessaire détectée pour:', currentUserId);
        const migrationResults = performFullMigration(currentUserId);
        
        if (migrationResults.profile) {
          logger.log('✅ Profil migré avec succès:', migrationResults.profile);
          setUserProfile(migrationResults.profile);
          return; // Sortir avec le profil migré
        }
      }
    
      // Essayer d'abord avec l'ID utilisateur spécifique
      if (currentUserId) {
        const savedProfile = getSecureItem(`userProfile_${currentUserId}`, currentUserId);
        logger.debug('Profil sauvegardé pour', currentUserId, ':', savedProfile ? 'Trouvé (chiffré)' : 'Aucun');
        
        if (savedProfile) {
          try {
            logger.debug('Profil déchiffré:', savedProfile);
            setUserProfile(savedProfile);
            return; // Sortir si profil trouvé
          } catch (error) {
            console.error('Erreur lors du chargement du profil:', error);
          }
        }
      }
      
      // Fallback : essayer l'ancien système (userProfile global)
      const legacyProfile = getSecureItem('userProfile');
      logger.debug('Profil legacy:', legacyProfile ? 'Trouvé (chiffré)' : 'Aucun');
      
      if (legacyProfile) {
        try {
          logger.debug('Profil legacy déchiffré:', legacyProfile);
          setUserProfile(legacyProfile);
          
          // Migrer vers le nouveau système si on a un ID utilisateur
          if (currentUserId && legacyProfile.id) {
            setSecureItem(`userProfile_${currentUserId}`, legacyProfile, currentUserId);
            logger.debug('Profil migré vers le nouveau système chiffré');
          }
          return;
        } catch (error) {
          console.error('Erreur lors du chargement du profil legacy:', error);
        }
      }
      
      // Dernier recours : créer un profil temporaire
      logger.debug('Création d\'un profil temporaire');
      
      const pendingProfile = getSecureItem('pendingProfile');
      logger.debug('Données d\'inscription en attente:', pendingProfile ? 'Trouvées (chiffrées)' : 'Aucune');
      
      // Créer un profil temporaire avec les données disponibles (sanitisées)
      const tempProfile = {
        id: currentUserId || 'temp_' + Date.now(),
        prenom: pendingProfile?.prenom ? validateAndSanitize.text(pendingProfile.prenom) : '',
        nom: pendingProfile?.nom ? validateAndSanitize.text(pendingProfile.nom) : '',
        type: pendingProfile?.type && validateUserRole(pendingProfile.type) ? pendingProfile.type : 'escrimeur',
        club_id: pendingProfile?.club_id || '',
        is_admin_validated: false
      };
      
      // Sauvegarder le profil temporaire (chiffré)
      if (currentUserId) {
        setSecureItem(`userProfile_${currentUserId}`, tempProfile, currentUserId);
      }
      setSecureItem('userProfile', tempProfile);
      logger.debug('Profil temporaire créé:', tempProfile);
      
      // Si c'est un profil temporaire ou incomplet, demander les vraies infos
      if (tempProfile.prenom === '' || tempProfile.nom === '') {
        setShowProfileSetup(true);
        logger.debug('🔧 Modale de configuration affichée - profil incomplet');
      }
      
      setUserProfile(tempProfile);
    
    // Mettre en cache le résultat pour éviter les revalidations
    cache.set(cacheKey, { profile: tempProfile }, 60000); // Cache 1 minute
    performanceMonitor.end('session-validation');
  }, 300); // Debounce 300ms

  useEffect(() => {
    // Initialiser la session sécurisée avec debounce
    debouncedSessionValidation();
  }, []);

  // Fonction pour sauvegarder le profil personnalisé
  const handleProfileSubmit = () => {
    // Validation sécurisée des entrées
    if (!validateAndSanitize.name(profileForm.prenom)) {
      alert('Prénom invalide (2-50 caractères, lettres uniquement)');
      return;
    }
    
    if (!validateAndSanitize.name(profileForm.nom)) {
      alert('Nom invalide (2-50 caractères, lettres uniquement)');
      return;
    }
    
    if (!validateUserRole(profileForm.type)) {
      alert('Rôle invalide');
      return;
    }
    
    // Créer le nouveau profil avec données sanitisées
    const currentUserId = getSecureItem('currentUserId');
    const newProfile = {
      ...userProfile,
      prenom: validateAndSanitize.text(profileForm.prenom),
      nom: validateAndSanitize.text(profileForm.nom),
      type: profileForm.type,
      club_id: profileForm.club_id || ''
    };
    
    // Sauvegarder avec chiffrement
    if (currentUserId) {
      setSecureItem(`userProfile_${currentUserId}`, newProfile, currentUserId);
      setSecureItem('currentUserId', currentUserId);
    } else {
      const newUserId = 'user_' + Date.now();
      setSecureItem(`userProfile_${newUserId}`, newProfile, newUserId);
      setSecureItem('currentUserId', newUserId);
    }

    setUserProfile(newProfile);
    setShowProfileSetup(false);
    logger.debug('Profil personnalisé sauvegardé:', newProfile);
  };

  // Si on doit afficher la page d'arbitrage
  if (showBoutPage) {
    return <BoutPage onBack={() => setShowBoutPage(false)} />;
  }

  // Si on doit afficher la page MY GAMES
  if (showMyGamesPage) {
    return <MyGamesPage onBack={() => setShowMyGamesPage(false)} />;
  }

  // Si on doit afficher la page MY CLUB
  if (currentPage === 'club') {
    return <ClubPage onBack={() => setCurrentPage('welcome')} />;
  }

  // Modal de configuration du profil
  if (showProfileSetup) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '8px',
            textAlign: 'center',
          }}>
            Finaliser votre profil
          </h2>
          
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            marginBottom: '24px',
            textAlign: 'center',
          }}>
            Personnalisez votre expérience Aramis Fighter
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px',
            }}>
              Prénom *
            </label>
            <input
              type="text"
              value={profileForm.prenom}
              onChange={(e) => setProfileForm({...profileForm, prenom: e.target.value})}
              placeholder="Votre prénom"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px',
            }}>
              Nom *
            </label>
            <input
              type="text"
              value={profileForm.nom}
              onChange={(e) => setProfileForm({...profileForm, nom: e.target.value})}
              placeholder="Votre nom"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px',
            }}>
              Rôle
            </label>
            <select
              value={profileForm.type}
              onChange={(e) => setProfileForm({...profileForm, type: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            >
              <option value="escrimeur">🤺 Escrimeur</option>
              <option value="entraineur">👨‍🏫 Entraîneur</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px',
            }}>
              Club (optionnel)
            </label>
            <input
              type="text"
              value={profileForm.club_id}
              onChange={(e) => setProfileForm({...profileForm, club_id: e.target.value})}
              placeholder="Nom de votre club"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={handleSaveProfile}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            Sauvegarder mon profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f8fafc',
      padding: '0 20px',
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      {/* Affichage discret du rôle en haut à gauche */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        padding: '8px 12px',
        backgroundColor: 'rgba(255,255,255,0.95)',
        color: '#374151',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '600',
        zIndex: 100,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        {userProfile && userProfile.type ? 
          (userProfile.type === 'escrimeur' ? '🤺 Escrimeur' : '👨‍🏫 Entraîneur') :
          '🔄 Chargement...'
        }
      </div>
      
      {/* Bouton de déconnexion en haut à droite */}
      <button
        onClick={onLogout}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '10px 16px',
          backgroundColor: 'white',
          color: '#ef4444',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 100,
        }}
      >
        <LogoutIcon />
        <span>Déconnexion</span>
      </button>
      
      {/* Contenu principal en haut */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        paddingTop: '80px', // Espace pour le bouton de déconnexion
        paddingBottom: '40px',
      }}>
        {/* Logo Aramis */}
        <img 
          src="/logo_aramis.png" 
          alt="Aramis & Compagnie - Agitateur de Talents"
          style={{
            maxWidth: '280px',
            width: '100%',
            height: 'auto',
            marginBottom: '16px',
          }}
        />
        
        {/* Messages de bienvenue personnalisés */}
        <h1 style={{
          fontSize: isMobile ? '18px' : '20px',
          fontWeight: '500',
          color: '#64748b',
          marginBottom: '8px',
        }}>
          {userProfile && userProfile.prenom ? 
            `Bienvenue ${userProfile.prenom} !` : 
            'Bienvenue sur Aramis Fighter !'
          }
        </h1>
        
        <p style={{
          fontSize: '14px',
          color: '#94a3b8',
          marginBottom: '32px',
          maxWidth: '300px',
          lineHeight: '1.4',
        }}>
          {userProfile && userProfile.type ? 
            `${userProfile.type === 'escrimeur' ? '🤺 Escrimeur' : userProfile.type === 'entraineur' ? '👨‍🏫 Entraîneur' : '👑 Admin'}${getUserClubName() ? ` - ${getUserClubName()}` : ' - Aucun club'}` :
            'Vous êtes connecté avec succès.'
          }
        </p>
        
        {/* Titre PROFILE ANALYSE */}
        <h2 style={{
          color: '#94a3b8',
          fontSize: isMobile ? 14 : 18,
          fontWeight: 400,
          margin: '8px 0 0 0',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}>
          PROFILE ANALYSE
        </h2>
        
        {/* Bouton de migration manuelle si profil incomplet */}
        {(!userProfile?.prenom || !userProfile?.nom) && (
              <button 
                onClick={() => {
                  const session = validateSession();
                  if (session?.userId) {
                    logger.log('🔄 Migration manuelle déclenchée');
                    const migrationResults = performFullMigration(session.userId);
                    if (migrationResults.profile) {
                      setUserProfile(migrationResults.profile);
                      logger.log('✅ Migration manuelle réussie');
                    } else {
                      setShowProfileSetup(true);
                      logger.debug('🔧 Aucune donnée à migrer, ouverture de la configuration');
                    }
                  }
                }}
                style={{
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  cursor: 'pointer',
                  marginTop: 8
                }}
              >
                🔄 Récupérer mes données
              </button>
            )}
          </div>
          <button onClick={handleLogout} style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            border: '1px solid rgba(255, 255, 255, 0.2)', 
            color: 'white', 
            padding: '8px 12px', 
            borderRadius: 4, 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <LogoutIcon />
            Déconnexion
          </button>
        </div>
        
        {/* Boutons de navigation */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          maxWidth: '320px',
          paddingBottom: '40px',
        }}>
          <button
            style={{
              backgroundColor: '#f1f5f9',
              border: '2px solid #e2e8f0',
              borderRadius: '25px',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: '700',
              color: '#1e293b',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
            onMouseDown={(e) => {
              e.target.style.backgroundColor = '#e2e8f0';
              e.target.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.target.style.backgroundColor = '#f1f5f9';
              e.target.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f1f5f9';
              e.target.style.transform = 'scale(1)';
            }}
          >
            MY STATS
          </button>
          
          <button
            style={{
              backgroundColor: '#f1f5f9',
              border: '2px solid #e2e8f0',
              borderRadius: '25px',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: '700',
              color: '#1e293b',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
            onMouseDown={(e) => {
              e.target.style.backgroundColor = '#e2e8f0';
              e.target.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.target.style.backgroundColor = '#f1f5f9';
              e.target.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f1f5f9';
              e.target.style.transform = 'scale(1)';
            }}
            onClick={() => setCurrentPage('club')}
          >
            MY CLUB
          </button>
          
          <button
            style={{
              backgroundColor: '#f1f5f9',
              border: '2px solid #e2e8f0',
              borderRadius: '25px',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: '700',
              color: '#1e293b',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
            onMouseDown={(e) => {
              e.target.style.backgroundColor = '#e2e8f0';
              e.target.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.target.style.backgroundColor = '#f1f5f9';
              e.target.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f1f5f9';
              e.target.style.transform = 'scale(1)';
            }}
          >
            MY OPPONENTS
          </button>
          
          <button
            style={{
              backgroundColor: '#f1f5f9',
              border: '2px solid #e2e8f0',
              borderRadius: '25px',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: '700',
              color: '#1e293b',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
            onMouseDown={(e) => {
              e.target.style.backgroundColor = '#e2e8f0';
              e.target.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.target.style.backgroundColor = '#f1f5f9';
              e.target.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f1f5f9';
              e.target.style.transform = 'scale(1)';
            }}
          >
            MY ACTIONS
          </button>
          
          <button
            style={{
              backgroundColor: '#f1f5f9',
              border: '2px solid #e2e8f0',
              borderRadius: '25px',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: '700',
              color: '#1e293b',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
            onMouseDown={(e) => {
              e.target.style.backgroundColor = '#e2e8f0';
              e.target.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.target.style.backgroundColor = '#f1f5f9';
              e.target.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f1f5f9';
              e.target.style.transform = 'scale(1)';
            }}
            onClick={() => setShowMyGamesPage(true)}
          >
            MY GAMES
          </button>
          
          {/* Séparateur */}
          <div style={{
            width: '100%',
            height: '2px',
            backgroundColor: '#e2e8f0',
            margin: '24px 0',
          }} />
          
          {/* Bouton START BOUT - Plus important */}
          <button
            style={{
              backgroundColor: '#64748b',
              border: '2px solid #475569',
              borderRadius: '20px',
              padding: '20px 24px',
              fontSize: '18px',
              fontWeight: '800',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            }}
            onMouseDown={(e) => {
              e.target.style.backgroundColor = '#475569';
              e.target.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.target.style.backgroundColor = '#64748b';
              e.target.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#64748b';
              e.target.style.transform = 'scale(1)';
            }}
            onClick={() => setShowBoutPage(true)}
          >
            START BOUT
          </button>
        </div>
      </div>
    </div>
  );
}
