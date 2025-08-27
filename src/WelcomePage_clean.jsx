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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('🔍 DIAGNOSTIC COMPLET - Recherche du profil utilisateur...');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          console.log('✅ Utilisateur Supabase trouvé:', user.id);
          
          const userSpecificProfile = getSecureItem(`userProfile_${user.id}`);
          if (userSpecificProfile && userSpecificProfile.prenom) {
            console.log('📋 Profil spécifique utilisateur trouvé:', userSpecificProfile);
            setUserProfile(userSpecificProfile);
            return;
          }
        }

        const generalProfile = getSecureItem('userProfile');
        if (generalProfile && generalProfile.prenom) {
          console.log('📋 Profil général trouvé:', generalProfile);
          setUserProfile(generalProfile);
        } else {
          console.log('⚠️ Aucun profil trouvé - Affichage de la configuration');
          setShowProfileSetup(true);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement du profil:', error);
        setShowProfileSetup(true);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    try {
      console.log('🚪 Déconnexion en cours...');
      
      await supabase.auth.signOut();
      
      removeSecureItem('userProfile');
      removeSecureItem('currentUser');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        removeSecureItem(`userProfile_${user.id}`);
      }
      
      console.log('✅ Déconnexion réussie');
      onLogout();
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      onLogout();
    }
  };

  const handleProfileSave = () => {
    const newProfile = {
      prenom: validateAndSanitize.text(profileForm.prenom),
      nom: validateAndSanitize.text(profileForm.nom),
      type: profileForm.type
    };

    const session = validateSession();
    if (session?.userId) {
      setSecureItem(`userProfile_${session.userId}`, newProfile, session.userId);
    }
    setSecureItem('userProfile', newProfile);

    setUserProfile(newProfile);
    setShowProfileSetup(false);
    logger.debug('Profil personnalisé sauvegardé:', newProfile);
  };

  if (showBoutPage) {
    return <BoutPage onBack={() => setShowBoutPage(false)} userProfile={userProfile} />;
  }

  if (showMyGamesPage) {
    return <MyGamesPage onBack={() => setShowMyGamesPage(false)} />;
  }

  if (showMyStatsPage) {
    return <MyStatsPage onBack={() => setShowMyStatsPage(false)} />;
  }

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
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}>
          PROFILE ANALYSE
        </h2>
        
        {/* Bouton START BOUT principal */}
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
              width: '100%',
              padding: '16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '12px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
          >
            📊 MY GAMES
          </button>

          {/* Bouton MY STATS */}
          <button
            onClick={() => setShowMyStatsPage(true)}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '12px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
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
            }}
          >
            🏛️ CLUB
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
              <label style={{ display: 'block', marginBottom: '8px', color: '#6b7280' }}>Type</label>
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
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleProfileSave}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
