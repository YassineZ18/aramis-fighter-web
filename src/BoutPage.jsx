import React, { useState, useEffect } from 'react';
import TouchDetailPage from './TouchDetailPage';
import DoubleTouchDetailPage from './DoubleTouchDetailPage';
import { secureStorage } from './secureStorage';
import { sessionManager } from './sessionManager';
import { logger, performanceMonitor, cache } from './performanceOptimizer';

export default function BoutPage({ onBack }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [redName, setRedName] = useState('');
  const [greenName, setGreenName] = useState('');
  const [redScore, setRedScore] = useState(0);
  const [greenScore, setGreenScore] = useState(0);
  const [showTouchDetail, setShowTouchDetail] = useState(false);
  const [currentTouchFencer, setCurrentTouchFencer] = useState(null);
  const [showDoubleTouchDetail, setShowDoubleTouchDetail] = useState(false);
  const [touchHistory, setTouchHistory] = useState([]); // Historique des touches du match en cours
  const [userProfile, setUserProfile] = useState(null);
  const [clubFencers, setClubFencers] = useState([]); // Liste des escrimeurs du club (pour entraîneur)
  const [redIsDropdown, setRedIsDropdown] = useState(false); // Si le champ rouge utilise une dropdown
  const [greenIsDropdown, setGreenIsDropdown] = useState(false); // Si le champ vert utilise une dropdown
  const [allFencers, setAllFencers] = useState([]); // Liste de tous les escrimeurs ayant joué
  const [redShowDropdown, setRedShowDropdown] = useState(false); // Affichage dropdown rouge
  const [greenShowDropdown, setGreenShowDropdown] = useState(false); // Affichage dropdown vert

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Charger la liste de tous les escrimeurs ayant joué
  useEffect(() => {
    const loadAllFencers = () => {
      try {
        const savedMatches = JSON.parse(localStorage.getItem('aramis_matches') || '[]');
        const fencerSet = new Set();
        
        savedMatches.forEach(match => {
          if (match.redFencer) fencerSet.add(match.redFencer);
          if (match.greenFencer) fencerSet.add(match.greenFencer);
        });
        
        // Ajouter le profil utilisateur s'il existe
        if (userProfile?.prenom) {
          fencerSet.add(`${userProfile.prenom} (VOUS)`);
        }
        
        // Debug: vérifier le profil utilisateur
        console.log('Profil utilisateur:', userProfile);
        console.log('userProfile?.prenom:', userProfile?.prenom);
        console.log('Liste des escrimeurs avant tri:', Array.from(fencerSet));
        
        const fencersList = Array.from(fencerSet).sort();
        setAllFencers(fencersList);
      } catch (error) {
        console.error('Erreur lors du chargement des escrimeurs:', error);
      }
    };
    
    loadAllFencers();
  }, [userProfile]);

  useEffect(() => {
    const loadUserProfile = async () => {
      performanceMonitor.start('load-user-profile');
      
      try {
        // Pas besoin de vérification de session pour cette page
        // On peut fonctionner sans utilisateur connecté
        let profile = null;

        if (profile) {
          setUserProfile(profile);
          logger.info('Profil utilisateur chargé avec succès', { type: profile.type });
          
          // Si c'est un entraîneur, charger la liste des escrimeurs du club
          if (profile.type === 'entraineur') {
            // Charger les escrimeurs du club depuis le stockage sécurisé
            const clubFencersData = secureStorage.getItem('clubFencers') || [];
            const mockClubFencers = [
              'Alice Martin',
              'Bob Durand', 
              'Claire Petit',
              'David Moreau',
              'Emma Leroy',
              ...clubFencersData
            ];
            setClubFencers(mockClubFencers);
            setRedIsDropdown(true);
            setGreenIsDropdown(true);
            console.log('Liste des escrimeurs du club chargée', { count: mockClubFencers.length });
          } else if (profile.type === 'escrimeur') {
            // Pour un escrimeur, on propose "MOI" comme option
            const selfOption = `MOI (${profile.prenom || 'Escrimeur'})`;
            setClubFencers([selfOption]);
            console.log('Option escrimeur configurée', { selfOption });
          }
        } else {
          // Pas de profil utilisateur nécessaire pour cette page
          console.log('Fonctionnement sans profil utilisateur');
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil utilisateur', error);
      } finally {
        performanceMonitor.end('load-user-profile');
      }
    };

    loadUserProfile();
  }, []);

  const handleRedTouch = () => {
    // Naviguer vers la page de détail de touche pour le rouge
    setCurrentTouchFencer({ color: 'red', name: redName || 'Rouge' });
    setShowTouchDetail(true);
  };

  const handleGreenTouch = () => {
    // Naviguer vers la page de détail de touche pour le vert
    setCurrentTouchFencer({ color: 'green', name: greenName || 'Vert' });
    setShowTouchDetail(true);
  };

  const handleDoubleTouch = () => {
    // Naviguer vers la page de détail de double touche
    setShowDoubleTouchDetail(true);
  };

  const handleTouchValidated = (touchData) => {
    // Incrémenter le score selon la couleur de l'escrimeur
    let newRedScore = redScore;
    let newGreenScore = greenScore;
    
    if (touchData.fencer === 'red') {
      newRedScore = redScore + 1;
      setRedScore(newRedScore);
    } else if (touchData.fencer === 'green') {
      newGreenScore = greenScore + 1;
      setGreenScore(newGreenScore);
    }
    
    // Enregistrer la touche dans l'historique
    const touchRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      fencer: touchData.fencerName, // CORRECTION: Utiliser le nom de l'escrimeur, pas la couleur
      color: touchData.fencer, // Garder la couleur pour référence
      zone: touchData.zone,
      action: touchData.actionDetail, // CORRECTION: Utiliser actionDetail pour le mapping
      actionType: touchData.actionType,
      actionDetail: touchData.actionDetail,
      scoreAfter: {
        red: newRedScore,
        green: newGreenScore
      },
      type: 'single'
    };
    
    setTouchHistory(prev => [...prev, touchRecord]);
    
    // Retourner à la page d'arbitrage
    setShowTouchDetail(false);
    setCurrentTouchFencer(null);
    
    console.log('Touch validated:', touchData);
  };

  const handleDoubleTouchValidated = (doubleTouchData) => {
    // Incrémenter les deux scores
    const newRedScore = redScore + 1;
    const newGreenScore = greenScore + 1;
    setRedScore(newRedScore);
    setGreenScore(newGreenScore);
    
    // Enregistrer les deux touches dans l'historique
    const timestamp = new Date().toISOString();
    const baseId = Date.now();
    
    const redTouchRecord = {
      id: baseId,
      timestamp: timestamp,
      fencer: 'red',
      fencerName: doubleTouchData.red.fencerName,
      zone: doubleTouchData.red.zone,
      actionType: doubleTouchData.red.actionType,
      actionDetail: doubleTouchData.red.actionDetail,
      scoreAfter: {
        red: newRedScore,
        green: newGreenScore
      },
      type: 'double',
      doublePartner: 'green'
    };
    
    const greenTouchRecord = {
      id: baseId + 1,
      timestamp: timestamp,
      fencer: 'green',
      fencerName: doubleTouchData.green.fencerName,
      zone: doubleTouchData.green.zone,
      actionType: doubleTouchData.green.actionType,
      actionDetail: doubleTouchData.green.actionDetail,
      scoreAfter: {
        red: newRedScore,
        green: newGreenScore
      },
      type: 'double',
      doublePartner: 'red'
    };
    
    setTouchHistory(prev => [...prev, redTouchRecord, greenTouchRecord]);
    
    // Retourner à la page d'arbitrage
    setShowDoubleTouchDetail(false);
    
    console.log('Double touch validated:', doubleTouchData);
  };

  const handleValidateBout = () => {
    try {
      console.log('🎯 VALIDATE BOUT - Début de la sauvegarde');
      
      // Créer le résultat du match
      const matchResult = {
        id: Date.now(),
        date: new Date().toISOString(),
        redFencer: redName || 'Rouge',
        greenFencer: greenName || 'Vert',
        redScore: redScore,
        greenScore: greenScore,
        winner: redScore > greenScore ? 'red' : greenScore > redScore ? 'green' : 'draw',
        touchHistory: touchHistory || []
      };

      console.log('📊 Match à sauvegarder:', matchResult);

      // Récupérer les matchs existants depuis localStorage
      const existingMatches = JSON.parse(localStorage.getItem('aramis_matches') || '[]');
      existingMatches.push(matchResult);
      
      // Sauvegarder dans localStorage
      localStorage.setItem('aramis_matches', JSON.stringify(existingMatches));
      
      console.log('✅ Match sauvegardé avec succès!');
      console.log('🔙 Retour à la page d\'accueil');
      
      // Retourner à la page d'accueil
      onBack();
    } catch (error) {
      console.error('❌ Erreur lors de la validation du bout:', error);
      alert('Erreur lors de la sauvegarde du match. Veuillez réessayer.');
    }
  };

  // Si on doit afficher la page de détail de touche
  if (showTouchDetail && currentTouchFencer) {
    return (
      <TouchDetailPage
        fencerColor={currentTouchFencer.color}
        fencerName={currentTouchFencer.name}
        onBack={() => {
          setShowTouchDetail(false);
          setCurrentTouchFencer(null);
        }}
        onValidate={handleTouchValidated}
      />
    );
  }

  // Si on doit afficher la page de détail de double touche
  if (showDoubleTouchDetail) {
    return (
      <DoubleTouchDetailPage
        redFencerName={redName || 'Rouge'}
        greenFencerName={greenName || 'Vert'}
        onBack={() => setShowDoubleTouchDetail(false)}
        onValidate={handleDoubleTouchValidated}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f8fafc',
      padding: isMobile ? '20px 16px' : '20px',
      boxSizing: 'border-box',
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

      {/* Contenu principal */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '60px',
        gap: '20px',
        maxWidth: '400px',
        margin: '0 auto',
      }}>
        
        {/* Champs de noms adaptatifs selon le profil */}
        <div style={{
          display: 'flex',
          gap: '12px',
          width: '100%',
        }}>
          {/* Champ Rouge */}
          {false && redIsDropdown && clubFencers.length > 0 ? (
            <div style={{ flex: 1, position: 'relative' }}>
              <select
                value={redName}
                onChange={(e) => setRedName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#fecaca',
                  border: '2px solid #dc2626',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '700',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  color: '#7f1d1d',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">SÉLECTIONNER ROUGE</option>
                {clubFencers.map((fencer, index) => (
                  <option key={index} value={fencer}>
                    {fencer}
                  </option>
                ))}
                {userProfile?.type === 'entraineur' && (
                  <option value="AUTRE">ADVERSAIRE EXTERNE...</option>
                )}
              </select>
              {redName === 'AUTRE' && (
                <input
                  type="text"
                  placeholder="Prénom adversaire"
                  onChange={(e) => setRedName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginTop: '8px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                />
              )}
            </div>
          ) : (
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="NAME RED"
                value={redName}
                onChange={(e) => {
                  setRedName(e.target.value);
                  setRedShowDropdown(allFencers.length > 0);
                }}
                onFocus={() => setRedShowDropdown(allFencers.length > 0)}
                onBlur={() => setTimeout(() => setRedShowDropdown(false), 200)}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#fecaca',
                  border: '2px solid #dc2626',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '700',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  color: '#7f1d1d',
                }}
              />
              {redShowDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '2px solid #dc2626',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  zIndex: 1000
                }}>
                  {allFencers
                    .filter(fencer => redName === '' || fencer.toLowerCase().includes(redName.toLowerCase()))
                    .map(fencer => (
                      <div
                        key={fencer}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setRedName(fencer);
                          setRedShowDropdown(false);
                        }}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f4f6',
                          fontSize: '14px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          color: '#7f1d1d',
                          backgroundColor: 'white'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#fecaca'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        {fencer.toUpperCase()}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
          
          {/* Champ Vert */}
          {false && greenIsDropdown && clubFencers.length > 0 ? (
            <div style={{ flex: 1, position: 'relative' }}>
              <select
                value={greenName}
                onChange={(e) => setGreenName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#bbf7d0',
                  border: '2px solid #16a34a',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '700',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  color: '#14532d',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">SÉLECTIONNER VERT</option>
                {clubFencers.map((fencer, index) => (
                  <option key={index} value={fencer}>
                    {fencer}
                  </option>
                ))}
                {userProfile?.type === 'entraineur' && (
                  <option value="AUTRE">ADVERSAIRE EXTERNE...</option>
                )}
              </select>
              {greenName === 'AUTRE' && (
                <input
                  type="text"
                  placeholder="Prénom adversaire"
                  onChange={(e) => setGreenName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginTop: '8px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                />
              )}
            </div>
          ) : (
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="NAME GREEN"
                value={greenName}
                onChange={(e) => {
                  setGreenName(e.target.value);
                  setGreenShowDropdown(allFencers.length > 0);
                }}
                onFocus={() => setGreenShowDropdown(allFencers.length > 0)}
                onBlur={() => setTimeout(() => setGreenShowDropdown(false), 200)}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#bbf7d0',
                  border: '2px solid #16a34a',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '700',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  color: '#14532d',
                }}
              />
              {greenShowDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '2px solid #16a34a',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  zIndex: 1000
                }}>
                  {allFencers
                    .filter(fencer => greenName === '' || fencer.toLowerCase().includes(greenName.toLowerCase()))
                    .map(fencer => (
                      <div
                        key={fencer}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setGreenName(fencer);
                          setGreenShowDropdown(false);
                        }}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f4f6',
                          fontSize: '14px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          color: '#14532d',
                          backgroundColor: 'white'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#bbf7d0'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        {fencer.toUpperCase()}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Boutons de touches */}
        <div style={{
          display: 'flex',
          gap: '12px',
          width: '100%',
        }}>
          <button
            onClick={handleRedTouch}
            style={{
              flex: 1,
              padding: '24px 16px',
              backgroundColor: '#dc2626',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              color: 'white',
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}
            onMouseDown={(e) => {
              e.target.style.backgroundColor = '#b91c1c';
              e.target.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.target.style.backgroundColor = '#dc2626';
              e.target.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#dc2626';
              e.target.style.transform = 'scale(1)';
            }}
          >
            RED<br />TOUCH
          </button>
          
          <button
            onClick={handleGreenTouch}
            style={{
              flex: 1,
              padding: '24px 16px',
              backgroundColor: '#16a34a',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              color: 'white',
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}
            onMouseDown={(e) => {
              e.target.style.backgroundColor = '#15803d';
              e.target.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.target.style.backgroundColor = '#16a34a';
              e.target.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#16a34a';
              e.target.style.transform = 'scale(1)';
            }}
          >
            GREEN<br />TOUCH
          </button>
        </div>

        {/* Bouton double touch */}
        <button
          onClick={handleDoubleTouch}
          style={{
            width: '100%',
            padding: '20px',
            backgroundColor: '#64748b',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '700',
            color: 'white',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'all 0.2s',
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
        >
          DOUBLE TOUCH
        </button>

        {/* Séparateur */}
        <div style={{
          width: '100%',
          height: '2px',
          backgroundColor: '#e2e8f0',
          margin: '20px 0',
        }} />

        {/* Section SCORE */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            + SCORE +
          </h3>
          <p style={{
            fontSize: '12px',
            color: '#64748b',
            margin: '0',
          }}>
            WITHOUT OBS.
          </p>
        </div>

        {/* Affichage des scores */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          width: '100%',
          justifyContent: 'center',
        }}>
          {/* Score Rouge */}
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#fecaca',
            border: '3px solid #dc2626',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontSize: '36px',
              fontWeight: '900',
              color: '#dc2626',
            }}>
              {redScore}
            </span>
          </div>

          {/* Séparateur */}
          <span style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#64748b',
          }}>
            :
          </span>

          {/* Score Vert */}
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#bbf7d0',
            border: '3px solid #16a34a',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontSize: '36px',
              fontWeight: '900',
              color: '#16a34a',
            }}>
              {greenScore}
            </span>
          </div>
        </div>

        {/* Séparateur */}
        <div style={{
          width: '100%',
          height: '2px',
          backgroundColor: '#e2e8f0',
          margin: '20px 0',
        }} />

        {/* Bouton VALIDATE BOUT */}
        <button
          onClick={handleValidateBout}
          style={{
            width: '100%',
            padding: '18px',
            backgroundColor: '#64748b',
            border: '2px solid #475569',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '700',
            color: 'white',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.2s',
            marginBottom: '40px',
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
        >
          VALIDATE BOUT
        </button>
      </div>
    </div>
  );
}
