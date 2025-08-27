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
      const transaction = db.transaction(['clubs'], 'readwrite');
      const store = transaction.objectStore('clubs');
      store.put(club);
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      logger.error('Erreur sauvegarde IndexedDB:', error);
    }
  };

  // Fonction pour sauvegarder les clubs dans le fichier partagé (désactivée)
  const saveClubsToSharedFile = async (clubs) => {
    try {
      // Fonction désactivée pour éviter les conflits avec le stockage sécurisé
      logger.info('Sauvegarde clubs simulée désactivée', { count: clubs.length });
      return true;
    } catch (error) {
      logger.error('Erreur sauvegarde fichier partagé:', error);
      return false;
    }
  };

  // Fonction pour charger depuis la simulation de fichier partagé (désactivée)
  const loadFromSharedSimulation = () => {
    try {
      // Fonction désactivée pour éviter les conflits avec le stockage sécurisé
      logger.info('Chargement simulation désactivé');
      return [];
    } catch (error) {
      logger.error('Erreur chargement simulation:', error);
      return [];
    }
  };

  const handleCreateClub = async () => {
    performanceMonitor.start('create-club');
    
    try {
      // Vérifier la session avant de créer le club
      const isValidSession = await sessionManager.validateSession();
      if (!isValidSession) {
        logger.error('Session invalide lors de la création du club');
        alert('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      // Validation sécurisée du nom de club
      if (!newClubName || newClubName.trim().length < 3 || newClubName.trim().length > 50) {
        alert('Nom de club invalide (3-50 caractères)');
        return;
      }
      
      const sanitizedName = newClubName.trim().replace(/[<>\"'&]/g, ''); // Sanitisation XSS
      
      // Vérification de l'autorisation
      if (!userProfile || userProfile.type !== 'entraineur') {
        logger.warn('Tentative de création de club par un non-entraîneur', { 
          userId: userProfile?.id, 
          userType: userProfile?.type 
        });
        alert('Seuls les entraîneurs peuvent créer des clubs');
        return;
      }
      
      const currentUser = sessionManager.getCurrentUser();
      const newClub = {
        id: `club_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: sanitizedName,
        founder_id: currentUser.id,
        created_at: new Date().toISOString(),
        members_count: 1
      };
      
      // Sauvegarder dans le stockage sécurisé
      const clubsKey = 'global_clubs';
      const existingClubs = secureStorage.getItem(clubsKey) || [];
      
      // Vérifier que le club n'existe pas déjà
      const clubExists = existingClubs.find(club => 
        club.name.toLowerCase() === sanitizedName.toLowerCase()
      );
      
      if (clubExists) {
        alert('Un club avec ce nom existe déjà');
        return;
      }
      
      existingClubs.push(newClub);
      secureStorage.setItem(clubsKey, existingClubs);
      
      // Mettre à jour le cache
      cache.set(clubsKey, existingClubs, 300000); // Cache 5 min
      
      logger.info('Club créé avec succès', { 
        clubId: newClub.id,
        clubName: newClub.name,
        founderId: newClub.founder_id 
      });
      
      // Recharger les clubs pour mise à jour immédiate
      await loadAvailableClubs();
      
    } catch (error) {
      console.error('Erreur création club:', error);
      alert('Erreur lors de la création du club');
      return;
    }
    
    // Ajouter l'utilisateur comme fondateur
    const memberships = JSON.parse(localStorage.getItem('club_memberships') || '[]');
    memberships.push({
      id: Date.now(),
      user_id: userProfile.id,
      club_id: newClub.id,
      role: 'fondateur',
      status: 'accepted',
      join_date: new Date().toISOString()
    });
    localStorage.setItem('club_memberships', JSON.stringify(memberships));
    
    // Recharger les données
    loadUserClub(userProfile);
    setShowCreateClub(false);
    setNewClubName('');
  };

  const handleJoinClub = async () => {
    performanceMonitor.start('join-club');
    
    try {
      // Vérifier la session
      const isValidSession = await sessionManager.validateSession();
      if (!isValidSession) {
        logger.error('Session invalide lors de la demande d\'adhésion');
        alert('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      if (!selectedClubToJoin) {
        alert('Veuillez sélectionner un club');
        return;
      }
      
      if (!userProfile) {
        alert('Profil utilisateur non trouvé');
        return;
      }
      
      const currentUser = sessionManager.getCurrentUser();
      const membership = {
        id: `membership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: currentUser.id,
        club_id: selectedClubToJoin,
        role: userProfile.type,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      // Sauvegarder dans le stockage sécurisé
      const membershipsKey = 'club_memberships';
      const memberships = secureStorage.getItem(membershipsKey) || [];
      memberships.push(membership);
      secureStorage.setItem(membershipsKey, memberships);
      
      logger.info('Demande d\'adhésion créée', { 
        membershipId: membership.id,
        clubId: selectedClubToJoin,
        userRole: userProfile.type 
      });
      
      alert('Demande d\'adhésion envoyée !');
      setShowJoinClub(false);
      setSelectedClubToJoin('');
    } catch (error) {
      logger.error('Erreur lors de la demande d\'adhésion', error);
      alert('Erreur lors de la demande d\'adhésion');
    } finally {
      performanceMonitor.end('join-club');
    }
  };

  const handleDeleteClub = async () => {
    if (!userClub || !userClub.isFounder) {
      alert('Seul le fondateur peut supprimer le club.');
      return;
    }

    // Confirmation de sécurité
    const clubName = userClub.name;
    const confirmation = window.confirm(
      `⚠️ ATTENTION ⚠️\n\nÊtes-vous sûr de vouloir supprimer définitivement le club "${clubName}" ?\n\nCette action :\n- Supprimera le club pour tous les utilisateurs\n- Supprimera toutes les adhésions\n- Supprimera toutes les demandes en attente\n- Ne peut PAS être annulée\n\nTapez "SUPPRIMER" pour confirmer :`
    );

    if (!confirmation) return;

    const finalConfirmation = window.prompt(
      `Pour confirmer la suppression du club "${clubName}", tapez exactement : SUPPRIMER`
    );

    if (finalConfirmation !== 'SUPPRIMER') {
      alert('Suppression annulée. Le texte de confirmation ne correspond pas.');
      return;
    }

    try {
      const clubId = userClub.id;

      // 1. Supprimer le club de la clé partagée universelle
      const sharedKey = 'aramis_shared_clubs_all_sessions';
      let sharedClubs = JSON.parse(localStorage.getItem(sharedKey) || '[]');
      sharedClubs = sharedClubs.filter(club => club.id !== clubId);
      localStorage.setItem(sharedKey, JSON.stringify(sharedClubs));
      
      // Synchroniser avec les autres clés pour compatibilité
      localStorage.setItem('global_clubs', JSON.stringify(sharedClubs));
      localStorage.setItem('clubs', JSON.stringify(sharedClubs));
      
      console.log('Club supprimé de la clé partagée, clubs restants:', sharedClubs.length);

      // 2. Supprimer toutes les adhésions au club
      let memberships = JSON.parse(localStorage.getItem('club_memberships') || '[]');
      memberships = memberships.filter(membership => membership.club_id !== clubId);
      localStorage.setItem('club_memberships', JSON.stringify(memberships));

      // 3. Supprimer toutes les demandes d'adhésion au club
      let requests = JSON.parse(localStorage.getItem('club_requests') || '[]');
      requests = requests.filter(request => request.club_id !== clubId);
      localStorage.setItem('club_requests', JSON.stringify(requests));

      // 4. Réinitialiser l'interface utilisateur
      setUserClub(null);
      setClubMembers([]);
      
      // Recharger les clubs depuis IndexedDB pour synchronisation
      await loadAvailableClubs();
      
      alert('Club supprimé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression du club:', error);
      alert('Erreur lors de la suppression du club.');
    }
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'fondateur': return '👑 Fondateur';
      case 'entraineur': return '👨‍🏫 Entraîneur';
      case 'escrimeur': return '🤺 Escrimeur';
      default: return role;
    }
  };

  const canManageTrainers = userClub?.isFounder;
  const canManageFencers = userClub?.userRole === 'fondateur' || userClub?.userRole === 'entraineur';

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Bouton retour */}
      <button
        onClick={onBack}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          padding: '10px 16px',
          backgroundColor: 'white',
          color: '#64748b',
          border: '1px solid #e2e8f0',
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

      {/* Header */}
      <div style={{
        backgroundColor: '#1e293b',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <h1 style={{
          fontSize: '18px',
          fontWeight: '800',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          MY CLUB
        </h1>
      </div>

      <div style={{
        flex: 1,
        padding: '20px',
        maxWidth: '600px',
        margin: '0 auto',
        width: '100%',
      }}>
        
        {!userClub ? (
          // Pas de club - Options pour créer ou rejoindre
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            alignItems: 'center',
            textAlign: 'center',
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '16px',
            }}>
              Vous n'appartenez à aucun club
            </h2>
            
            {userProfile?.type === 'entraineur' && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                width: '100%',
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '16px',
                }}>
                  Créer un nouveau club
                </h3>
                
                {!showCreateClub ? (
                  <button
                    onClick={() => setShowCreateClub(true)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    ➕ CRÉER UN CLUB
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                      type="text"
                      placeholder="Nom du club"
                      value={newClubName}
                      onChange={(e) => setNewClubName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleCreateClub}
                        disabled={!newClubName.trim()}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: newClubName.trim() ? '#10b981' : '#9ca3af',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: newClubName.trim() ? 'pointer' : 'not-allowed',
                        }}
                      >
                        CRÉER
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateClub(false);
                          setNewClubName('');
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        ANNULER
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              width: '100%',
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '16px',
              }}>
                Rejoindre un club existant ({availableClubs.length} clubs disponibles)
              </h3>
              

              
              {!showJoinClub ? (
                <button
                  onClick={() => {
                    loadAvailableClubs(); // Forcer le rechargement
                    setShowJoinClub(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  🔍 REJOINDRE UN CLUB
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <select
                    value={selectedClubToJoin}
                    onChange={(e) => setSelectedClubToJoin(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Sélectionner un club</option>
                    {availableClubs.length === 0 ? (
                      <option value="" disabled>Aucun club disponible</option>
                    ) : (
                      availableClubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))
                    )}
                  </select>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleJoinClub}
                      disabled={!selectedClubToJoin}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: selectedClubToJoin ? '#10b981' : '#9ca3af',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: selectedClubToJoin ? 'pointer' : 'not-allowed',
                      }}
                    >
                      DEMANDER
                    </button>
                    <button
                      onClick={() => {
                        setShowJoinClub(false);
                        setSelectedClubToJoin('');
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      ANNULER
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Affichage du club
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}>
            {/* Informations du club */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '8px',
                textAlign: 'center',
              }}>
                🏛️ {userClub.name}
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: '16px',
              }}>
                Votre rôle : {getRoleDisplay(userClub.userRole)}
              </p>
              
              {userClub.isFounder && (
                <div style={{
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                  marginBottom: '16px',
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#92400e',
                    display: 'block',
                    marginBottom: '12px',
                  }}>
                    👑 Vous êtes le fondateur de ce club
                  </span>
                  
                  <button
                    onClick={handleDeleteClub}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
                  >
                    🗑️ Supprimer le club
                  </button>
                </div>
              )}
            </div>

            {/* Membres du club */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '16px',
              }}>
                Membres du club ({clubMembers.length})
              </h3>
              
              {clubMembers.length === 0 ? (
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  textAlign: 'center',
                  padding: '20px',
                }}>
                  Aucun membre pour le moment
                </p>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  {clubMembers.map((member) => (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#1f2937',
                        }}>
                          {member.prenom} {member.nom}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                        }}>
                          {getRoleDisplay(member.clubRole)}
                        </div>
                      </div>
                      
                      {/* Actions selon les droits */}
                      {((canManageTrainers && member.clubRole === 'entraineur') ||
                        (canManageFencers && member.clubRole === 'escrimeur')) &&
                        member.id !== userProfile?.id && (
                        <button
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          EXCLURE
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
