import React, { useState, useEffect } from 'react';

export default function ClubPage({ onBack }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [userProfile, setUserProfile] = useState(null);
  const [availableClubs, setAvailableClubs] = useState([]);
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [newClubName, setNewClubName] = useState('');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const loadUserProfile = () => {
      try {
        console.log('🏛️ CLUB PAGE - Chargement du profil utilisateur...');
        
        // Charger le profil depuis localStorage
        const savedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        if (savedProfile && savedProfile.prenom) {
          setUserProfile(savedProfile);
          console.log('✅ Profil utilisateur chargé:', savedProfile);
        } else {
          console.log('❌ Aucun profil utilisateur trouvé');
        }
        
        // Charger les clubs disponibles
        loadAvailableClubs();
      } catch (error) {
        console.error('❌ Erreur lors du chargement du profil club:', error);
      }
    };

    loadUserProfile();
  }, []);

  // Fonction pour charger les clubs disponibles
  const loadAvailableClubs = () => {
    try {
      console.log('🏛️ Chargement des clubs disponibles...');
      const clubs = JSON.parse(localStorage.getItem('aramis_shared_clubs_all_sessions') || '[]');
      setAvailableClubs(clubs);
      console.log('✅ Clubs chargés:', clubs.length);
    } catch (error) {
      console.error('❌ Erreur chargement clubs:', error);
      setAvailableClubs([]);
    }
  };

  // Fonction pour créer un nouveau club
  const handleCreateClub = () => {
    if (!newClubName.trim()) {
      alert('Veuillez saisir un nom de club');
      return;
    }

    try {
      const newClub = {
        id: Date.now(),
        nom: newClubName.trim(),
        fondateur: userProfile?.prenom || 'Utilisateur',
        date_creation: new Date().toISOString(),
        membres: 1
      };

      const existingClubs = JSON.parse(localStorage.getItem('aramis_shared_clubs_all_sessions') || '[]');
      existingClubs.push(newClub);
      localStorage.setItem('aramis_shared_clubs_all_sessions', JSON.stringify(existingClubs));
      
      setAvailableClubs(existingClubs);
      setNewClubName('');
      setShowCreateClub(false);
      
      console.log('✅ Club créé avec succès:', newClub);
      alert(`Club "${newClub.nom}" créé avec succès !`);
    } catch (error) {
      console.error('❌ Erreur création club:', error);
      alert('Erreur lors de la création du club');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: isMobile ? '20px 16px' : '40px 20px',
    }}>
      {/* Bouton de retour */}
      <button
        onClick={onBack}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          padding: '10px 16px',
          backgroundColor: 'white',
          color: '#6b7280',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '14px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 100,
        }}
      >
        ← Retour
      </button>

      {/* Titre principal */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        maxWidth: '600px',
        width: '100%',
      }}>
        <h1 style={{
          fontSize: isMobile ? '24px' : '32px',
          fontWeight: '800',
          color: '#1f2937',
          marginBottom: '8px',
        }}>
          🏛️ GESTION DE CLUB
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: '0',
        }}>
          Créez ou rejoignez un club d'escrime
        </p>
      </div>

      {/* Section création de club */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%',
        marginBottom: '20px',
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '16px',
        }}>
          ➕ Créer un nouveau club
        </h3>
        
        {showCreateClub ? (
          <div>
            <input
              type="text"
              value={newClubName}
              onChange={(e) => setNewClubName(e.target.value)}
              placeholder="Nom du club"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '12px',
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleCreateClub}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Créer
              </button>
              <button
                onClick={() => setShowCreateClub(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateClub(true)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Créer un club
          </button>
        )}
      </div>

      {/* Liste des clubs disponibles */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%',
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '16px',
        }}>
          📋 Clubs disponibles ({availableClubs.length})
        </h3>
        
        {availableClubs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {availableClubs.map(club => (
              <div key={club.id} style={{
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#f9fafb',
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 8px 0',
                }}>
                  {club.nom}
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: '0',
                }}>
                  Fondateur: {club.fondateur} • {club.membres || 1} membre(s)
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            textAlign: 'center',
            margin: '20px 0',
          }}>
            Aucun club disponible. Créez le premier !
          </p>
        )}
      </div>
    </div>
  );
}
