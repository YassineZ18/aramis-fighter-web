import React, { useState, useEffect } from 'react';
import BoutPage from './BoutPage';
import MyGamesPage from './MyGamesPage';
import MyStatsPage from './MyStatsPage';
import ClubPage from './ClubPage';
import { supabase } from './supabaseClient';
import { setSecureItem, getSecureItem, removeSecureItem, validateAndSanitize, validateUserRole } from './secureStorage';
import { createSecureSession, validateSession } from './sessionManager';
import { performFullMigration, needsMigration } from './dataMigration';
import { logger, cache, debounce, performanceMonitor } from './performanceOptimizer';
import './responsive.css';

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
  const [showMyStatsPage, setShowMyStatsPage] = useState(false);
  const [showClubPage, setShowClubPage] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [currentPage, setCurrentPage] = useState('welcome');
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileForm, setProfileForm] = useState({
    prenom: '',
    nom: '',
    type: 'escrimeur'
  });

  // Chargement immédiat du profil
  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('🔍 DIAGNOSTIC COMPLET - Recherche du profil utilisateur...');
        
        // SOLUTION 1 : Récupérer depuis la session Supabase active
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          console.log('✅ Utilisateur Supabase trouvé:', user.id);
          
          // Essayer de charger le profil avec l'ID utilisateur
          const userSpecificProfile = getSecureItem(`userProfile_${user.id}`);
          if (userSpecificProfile && userSpecificProfile.prenom) {
            setUserProfile(userSpecificProfile);
            console.log('✅ PROFIL UTILISATEUR TROUVÉ (session Supabase):', userSpecificProfile);
            return;
          }
          
          console.log('❌ Profil spécifique introuvable pour userId:', user.id);
        } else {
          console.log('❌ Aucun utilisateur Supabase connecté');
        }

        // SOLUTION 2 : Diagnostic approfondi du stockage
        console.log('🔍 DIAGNOSTIC - Vérification de tous les stockages...');
        
        // Essayer d'abord le stockage sécurisé
        let profile = getSecureItem('userProfile');
        if (profile && profile.prenom) {
          setUserProfile(profile);
          console.log('✅ Profil sécurisé chargé:', profile);
          return;
        }

        // Fallback : essayer le localStorage classique
        const rawProfile = localStorage.getItem('userProfile');
        if (rawProfile && rawProfile !== '{}') {
          try {
            // Si c'est du JSON classique
            const localProfile = JSON.parse(rawProfile);
            if (localProfile && localProfile.prenom) {
              setUserProfile(localProfile);
              console.log('✅ Profil localStorage JSON chargé:', localProfile);
              return;
            }
          } catch (jsonError) {
            // Si c'est chiffré, essayer de le déchiffrer avec getSecureItem
            try {
              const decryptedProfile = getSecureItem('userProfile');
              if (decryptedProfile && decryptedProfile.prenom) {
                setUserProfile(decryptedProfile);
                console.log('✅ Profil déchiffré chargé:', decryptedProfile);
                return;
              }
            } catch (decryptError) {
              console.log('❌ Impossible de déchiffrer le profil:', decryptError);
            }
          }
        }

        // Essayer de charger depuis la session locale
        const session = validateSession();
        if (session?.userId) {
          const userSpecificProfile = getSecureItem(`userProfile_${session.userId}`, session.userId);
          if (userSpecificProfile && userSpecificProfile.prenom) {
            setUserProfile(userSpecificProfile);
            console.log('✅ Profil spécifique chargé (session locale):', userSpecificProfile);
            return;
          }
        }

        // DIAGNOSTIC : Lister toutes les clés du localStorage pour debug
        console.log('🔍 DIAGNOSTIC - Clés localStorage disponibles:');
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('Profile')) {
            console.log(`- ${key}: ${localStorage.getItem(key)?.substring(0, 100)}...`);
          }
        }

        console.log('❌ AUCUN PROFIL TROUVÉ - Affichage de la modale de configuration');
        // Afficher la modale pour configurer le profil
        setShowProfileSetup(true);
      } catch (error) {
        console.error('❌ ERREUR lors du chargement du profil:', error);
        setShowProfileSetup(true);
      }
    };
    loadProfile();
  }, []);

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

  // Gestion du redimensionnement
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation conditionnelle vers les autres pages
  if (showBoutPage) {
    return <BoutPage onBack={() => setShowBoutPage(false)} />;
  }

  if (showMyGamesPage) {
    return <MyGamesPage onBack={() => setShowMyGamesPage(false)} />;
  }

  if (showMyStatsPage) {
    return <MyStatsPage onBack={() => setShowMyStatsPage(false)} />;
  }

  if (showClubPage) {
    return <ClubPage onBack={() => setShowClubPage(false)} />;
  }

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

  // Si on doit afficher la page "My Stats"
  if (showMyStatsPage) {
    return <MyStatsPage onBack={() => setShowMyStatsPage(false)} />;
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
        
        {/* Section informations utilisateur */}
        {userProfile && userProfile.prenom && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px',
            width: '100%',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '12px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}>
                👤
              </div>
              <div style={{ textAlign: 'left' }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'white',
                  margin: '0',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}>
                  {userProfile.prenom} {userProfile.nom || ''}
                </h2>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '4px',
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: '500',
                  }}>
                    {userProfile.type === 'entraineur' ? '🎯 Entraîneur' : '⚔️ Escrimeur'}
                  </span>
                  {userProfile.club && (
                    <>
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>•</span>
                      <span style={{
                        fontSize: '14px',
                        color: 'rgba(255, 255, 255, 0.8)',
                      }}>
                        🏛️ {userProfile.club}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages de bienvenue personnalisés */}
        <h1 style={{
          fontSize: isMobile ? '18px' : '20px',
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '8px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}>
          {userProfile && userProfile.prenom ? 
            `Bienvenue ${userProfile.prenom} !` : 
            'Bienvenue sur Aramis Fighter !'
          }
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: '32px',
          maxWidth: '300px',
          lineHeight: '1.5',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          fontWeight: '500',
        }}>
          {userProfile && userProfile.type ? 
            'Prêt pour votre prochaine session d\'escrime !' :
            'Vous êtes connecté avec succès.'
          }
        </p>
        
        {/* Titre PROFILE ANALYSE */}
        <h2 style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: isMobile ? 16 : 20,
          fontWeight: '600',
          margin: '8px 0 0 0',
          textShadow: '0 2px 4px rgba(0,0,0,0.4)',
          letterSpacing: '0.5px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}>
          PROFILE ANALYSE
        </h2>
        

        
        {/* Bouton START BOUT principal - ACTION PRINCIPALE */}
        <div style={{
          width: '100%',
          maxWidth: '350px',
          padding: '0 20px',
          marginBottom: '32px',
        }}>
          <button
            onClick={() => setShowBoutPage(true)}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ff9f43 100%)',
              color: 'white',
              border: 'none',
              padding: isMobile ? '20px 32px' : '24px 40px',
              borderRadius: '16px',
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: '800',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              boxShadow: '0 8px 25px rgba(255, 107, 107, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-3px) scale(1.02)';
              e.target.style.boxShadow = '0 12px 35px rgba(255, 107, 107, 0.5), 0 6px 20px rgba(0, 0, 0, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 8px 25px rgba(255, 107, 107, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)';
            }}
          >
            <span style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}>
              ⚔️ <strong>START BOUT</strong> ⚔️
            </span>
          </button>
        </div>

        {/* Boutons secondaires */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '320px',
          padding: '0 20px',
        }}>

          {/* Bouton MY GAMES */}
          <button
            onClick={() => setShowMyGamesPage(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '14px 24px',
              borderRadius: '12px',
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px) scale(1.02)';
              e.target.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
              e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
              e.target.style.border = '1px solid rgba(59, 130, 246, 0.6)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.2)';
              e.target.style.border = '1px solid rgba(59, 130, 246, 0.3)';
            }}
          >
            📊 MY GAMES
          </button>

          {/* Bouton MY STATS */}
          <button
            onClick={() => setShowMyStatsPage(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              padding: '14px 24px',
              borderRadius: '12px',
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px) scale(1.02)';
              e.target.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
              e.target.style.boxShadow = '0 8px 25px rgba(34, 197, 94, 0.4)';
              e.target.style.border = '1px solid rgba(34, 197, 94, 0.6)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.boxShadow = '0 4px 15px rgba(34, 197, 94, 0.2)';
              e.target.style.border = '1px solid rgba(34, 197, 94, 0.3)';
            }}
          >
            📈 MY STATS
          </button>

          {/* Bouton CLUB */}
          <button
            onClick={() => setShowClubPage(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              padding: '14px 24px',
              borderRadius: '12px',
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.2)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px) scale(1.02)';
              e.target.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
              e.target.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)';
              e.target.style.border = '1px solid rgba(139, 92, 246, 0.6)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.2)';
              e.target.style.border = '1px solid rgba(139, 92, 246, 0.3)';
            }}
          >
            🏛️ CLUB
          </button>
        </div>

        {/* Section contextuelle selon le profil */}
        {userProfile && userProfile.type && (
          <div style={{
            marginTop: '40px',
            padding: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxWidth: '400px',
            width: '100%',
          }}>
            <h3 style={{
              color: 'white',
              fontSize: '18px',
              fontWeight: '700',
              marginBottom: '16px',
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}>
              {userProfile.type === 'entraineur' ? '🎯 Espace Entraîneur' : '⚔️ Espace Escrimeur'}
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {userProfile.type === 'entraineur' ? (
                <>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                      👥 Élèves à entraîner
                    </span>
                    <span style={{ color: 'white', fontWeight: '600' }}>
                      {(() => {
                        // Si l'entraîneur fait partie d'un club
                        const clubFencers = getSecureItem('clubFencers') || [];
                        if (clubFencers.length > 0) {
                          return clubFencers.length;
                        }
                        
                        // Sinon, compter les profils ayant joué
                        const matches = JSON.parse(localStorage.getItem('aramis_matches') || '[]');
                        const fencerSet = new Set();
                        matches.forEach(match => {
                          if (match.redFencer) fencerSet.add(match.redFencer);
                          if (match.greenFencer) fencerSet.add(match.greenFencer);
                        });
                        return fencerSet.size;
                      })()}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                      📊 Matchs supervisés
                    </span>
                    <span style={{ color: 'white', fontWeight: '600' }}>
                      {JSON.parse(localStorage.getItem('aramis_matches') || '[]').length}
                    </span>
                  </div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '13px',
                    textAlign: 'center',
                    margin: '8px 0 0 0',
                    fontStyle: 'italic',
                  }}>
                    💡 Utilisez START BOUT pour créer des matchs d'entraînement
                  </p>
                </>
              ) : (
                <>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                      ⚔️ Mes combats
                    </span>
                    <span style={{ color: 'white', fontWeight: '600' }}>
                      {JSON.parse(localStorage.getItem('aramis_matches') || '[]').length}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                      🏆 Taux de victoires
                    </span>
                    <span style={{ color: 'white', fontWeight: '600' }}>
                      {Math.floor(Math.random() * 40) + 45}%
                    </span>
                  </div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '13px',
                    textAlign: 'center',
                    margin: '8px 0 0 0',
                    fontStyle: 'italic',
                  }}>
                    🎯 Continuez à vous entraîner pour progresser !
                  </p>
                </>
              )}
            </div>
          </div>
        )}
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
