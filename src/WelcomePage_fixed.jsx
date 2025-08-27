import React, { useState, useEffect } from 'react';
import BoutPage from './BoutPage';
import MyGamesPage from './MyGamesPage';
import ClubPage from './ClubPage';
import { setSecureItem, getSecureItem, validateAndSanitize, validateUserRole } from './secureStorage';
import { createSecureSession, validateSession, updateSessionActivity, clearSession } from './sessionManager';
import { performFullMigration, needsMigration } from './dataMigration';
import { logger, cache, debounce, performanceMonitor } from './performanceOptimizer';

// Icône de déconnexion
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
  const [currentPage, setCurrentPage] = useState('welcome');
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileForm, setProfileForm] = useState({
    prenom: '',
    nom: '',
    type: 'escrimeur'
  });

  // Fonction pour obtenir le nom du club
  const getUserClubName = () => {
    if (!userProfile?.club_id) return null;
    
    try {
      const sharedClubs = JSON.parse(localStorage.getItem('aramis_shared_clubs_all_sessions') || '[]');
      const club = sharedClubs.find(c => c.id === userProfile.club_id);
      return club ? club.nom : null;
    } catch (error) {
      logger.error('Erreur récupération nom club:', error);
      return null;
    }
  };

  // Pré-remplir le formulaire si on a déjà des données
  useEffect(() => {
    if (userProfile && showProfileSetup) {
      setProfileForm({
        prenom: userProfile.prenom || '',
        nom: userProfile.nom || '',
        type: userProfile.type || 'escrimeur'
      });
      logger.debug('📝 Formulaire pré-rempli avec:', userProfile);
    }
  }, [userProfile, showProfileSetup]);

  // Fonction de diagnostic
  const debugProfile = () => {
    const session = validateSession();
    const currentUserId = session?.userId;
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

  // Chargement du profil utilisateur au démarrage
  useEffect(() => {
    const loadUserProfile = async () => {
      performanceMonitor.start('profile-loading');
      
      try {
        // 1. Essayer de récupérer la session
        const session = await validateSession();
        const currentUserId = session?.userId;
        
        if (currentUserId) {
          logger.debug('Session validée pour utilisateur:', currentUserId);
          updateSessionActivity();
          
          // 2. Vérifier si migration nécessaire
          if (needsMigration(currentUserId)) {
            logger.log('🔄 Migration nécessaire détectée pour:', currentUserId);
            const migrationResults = performFullMigration(currentUserId);
            
            if (migrationResults.profile) {
              logger.log('✅ Profil migré avec succès:', migrationResults.profile);
              setUserProfile(migrationResults.profile);
              performanceMonitor.end('profile-loading');
              return;
            }
          }
          
          // 3. Essayer de charger le profil spécifique à l'utilisateur
          const savedProfile = getSecureItem(`userProfile_${currentUserId}`, currentUserId);
          if (savedProfile && savedProfile.prenom) {
            logger.debug('✅ Profil utilisateur trouvé:', savedProfile);
            setUserProfile(savedProfile);
            performanceMonitor.end('profile-loading');
            return;
          }
        }
        
        // 4. Fallback : profil legacy global
        const legacyProfile = getSecureItem('userProfile');
        if (legacyProfile && legacyProfile.prenom) {
          logger.debug('✅ Profil legacy trouvé:', legacyProfile);
          setUserProfile(legacyProfile);
          
          // Migrer vers le nouveau système si possible
          if (currentUserId) {
            setSecureItem(`userProfile_${currentUserId}`, legacyProfile, currentUserId);
            logger.debug('Profil migré vers le nouveau système chiffré');
          }
          performanceMonitor.end('profile-loading');
          return;
        }
        
        // 5. Créer un profil temporaire avec les données d'inscription
        const pendingProfile = getSecureItem('pendingProfile');
        const tempProfile = {
          prenom: '',
          nom: '',
          type: 'escrimeur',
          club_id: null,
          is_admin_validated: false,
          ...pendingProfile
        };
        
        if (currentUserId) {
          setSecureItem(`userProfile_${currentUserId}`, tempProfile, currentUserId);
        }
        setSecureItem('userProfile', tempProfile);
        setUserProfile(tempProfile);
        
        // Si profil incomplet, afficher la modale
        if (!tempProfile.prenom || !tempProfile.nom) {
          setShowProfileSetup(true);
          logger.debug('🔧 Modale de configuration affichée - profil incomplet');
        }
        
      } catch (error) {
        logger.error('Erreur chargement profil:', error);
        // Profil par défaut en cas d'erreur
        setUserProfile({
          prenom: '',
          nom: '',
          type: 'escrimeur',
          club_id: null,
          is_admin_validated: false
        });
      }
      
      performanceMonitor.end('profile-loading');
    };

    loadUserProfile();
  }, []);

  // Gestion du redimensionnement
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      alert('Type de profil invalide');
      return;
    }

    const newProfile = {
      ...userProfile,
      prenom: validateAndSanitize.text(profileForm.prenom),
      nom: validateAndSanitize.text(profileForm.nom),
      type: profileForm.type
    };

    // Sauvegarder de manière sécurisée
    const session = validateSession();
    if (session?.userId) {
      setSecureItem(`userProfile_${session.userId}`, newProfile, session.userId);
    }
    setSecureItem('userProfile', newProfile);

    setUserProfile(newProfile);
    setShowProfileSetup(false);
    logger.debug('Profil personnalisé sauvegardé:', newProfile);
  };

  // Si on doit afficher la page d'arbitrage
  if (showBoutPage) {
    return <BoutPage onBack={() => setShowBoutPage(false)} userProfile={userProfile} />;
  }

  // Si on doit afficher la page "My Games"
  if (showMyGamesPage) {
    return <MyGamesPage onBack={() => setShowMyGamesPage(false)} />;
  }

  // Si on doit afficher la page Club
  if (currentPage === 'club') {
    return <ClubPage onBack={() => setCurrentPage('welcome')} userProfile={userProfile} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Indicateur de rôle en haut à gauche */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        padding: '8px 12px',
        backgroundColor: 'rgba(255,255,255,0.9)',
        color: '#475569',
        borderRadius: '20px',
        fontSize: '12px',
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
      
      {/* Contenu principal */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        paddingTop: '80px',
        paddingBottom: '40px',
        flex: 1,
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
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              margin: '16px 0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            🔄 Récupérer mes données
          </button>
        )}
        
        {/* Boutons de navigation */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          maxWidth: '320px',
          padding: '0 20px',
        }}>
          {/* Bouton START BOUT */}
          <button
            onClick={() => setShowBoutPage(true)}
            style={{
              backgroundColor: '#64748b',
              color: 'white',
              border: 'none',
              padding: '16px 24px',
              borderRadius: '12px',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            }}
          >
            START BOUT
          </button>
        </div>
      </div>

      {/* Modale de configuration du profil */}
      {showProfileSetup && (
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
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ marginBottom: '20px', color: '#374151' }}>Configuration du profil</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#6b7280' }}>Prénom</label>
              <input
                type="text"
                value={profileForm.prenom}
                onChange={(e) => setProfileForm({...profileForm, prenom: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
                placeholder="Votre prénom"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#6b7280' }}>Nom</label>
              <input
                type="text"
                value={profileForm.nom}
                onChange={(e) => setProfileForm({...profileForm, nom: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
                placeholder="Votre nom"
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#6b7280' }}>Rôle</label>
              <select
                value={profileForm.type}
                onChange={(e) => setProfileForm({...profileForm, type: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="escrimeur">🤺 Escrimeur</option>
                <option value="entraineur">👨‍🏫 Entraîneur</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowProfileSetup(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#6b7280',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleProfileSubmit}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
