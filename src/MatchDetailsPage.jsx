import React, { useState, useEffect } from 'react';

export default function MatchDetailsPage({ match, onBack }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getZoneColor = (zone) => {
    return zone <= 3 ? '#ef4444' : '#22c55e';
  };

  const getActionTypeColor = (actionType) => {
    switch (actionType) {
      case 'ATTACK': return '#3b82f6';
      case 'COUNTER ATTACK': return '#22c55e';
      case 'DEFENSE': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getFencerColor = (fencer) => {
    return fencer === 'red' ? '#dc2626' : '#16a34a';
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1e293b',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{
          fontSize: '18px',
          fontWeight: '800',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          DÉTAILS DU MATCH
        </h1>
        
        <button
          onClick={onBack}
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ width: '20px', height: '2px', backgroundColor: 'white' }} />
          <div style={{ width: '20px', height: '2px', backgroundColor: 'white' }} />
          <div style={{ width: '20px', height: '2px', backgroundColor: 'white' }} />
        </button>
      </div>

      <div style={{
        flex: 1,
        padding: '20px',
        maxWidth: '600px',
        margin: '0 auto',
        width: '100%',
      }}>
        
        {/* Informations du match */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '16px',
            textAlign: 'center',
          }}>
            RÉSUMÉ DU MATCH
          </h2>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}>
            <div style={{
              textAlign: 'center',
              flex: 1,
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#dc2626',
                marginBottom: '4px',
              }}>
                {match.redFencer.toUpperCase()}
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#dc2626',
              }}>
                {match.redScore}
              </div>
            </div>
            
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#6b7280',
              margin: '0 20px',
            }}>
              VS
            </div>
            
            <div style={{
              textAlign: 'center',
              flex: 1,
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#16a34a',
                marginBottom: '4px',
              }}>
                {match.greenFencer.toUpperCase()}
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#16a34a',
              }}>
                {match.greenScore}
              </div>
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#6b7280',
            marginTop: '12px',
          }}>
            {formatDate(match.date)} à {formatTime(match.date)}
          </div>
          
          {match.winner !== 'draw' && (
            <div style={{
              textAlign: 'center',
              marginTop: '12px',
              padding: '8px',
              backgroundColor: match.winner === 'red' ? '#fef2f2' : '#f0fdf4',
              borderRadius: '8px',
              border: `1px solid ${match.winner === 'red' ? '#fecaca' : '#bbf7d0'}`,
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: match.winner === 'red' ? '#dc2626' : '#16a34a',
              }}>
                🏆 VAINQUEUR : {match.winner === 'red' ? match.redFencer.toUpperCase() : match.greenFencer.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Historique chronologique des touches */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '16px',
            textAlign: 'center',
          }}>
            HISTORIQUE DES TOUCHES ({match.touchHistory?.length || 0})
          </h2>
          
          {!match.touchHistory || match.touchHistory.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px',
              padding: '20px',
            }}>
              Aucune touche enregistrée pour ce match
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {match.touchHistory.map((touch, index) => (
                <div
                  key={touch.id}
                  style={{
                    border: `2px solid ${getFencerColor(touch.fencer)}`,
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: touch.fencer === 'red' ? '#fef2f2' : '#f0fdf4',
                    position: 'relative',
                  }}
                >
                  {/* Numéro de touche */}
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '12px',
                    backgroundColor: getFencerColor(touch.fencer),
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '700',
                  }}>
                    {index + 1}
                  </div>
                  
                  {/* Informations de la touche */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: getFencerColor(touch.fencer),
                        marginBottom: '4px',
                      }}>
                        {touch.fencerName?.toUpperCase() || touch.fencer?.toUpperCase() || 'UNKNOWN'}
                        {touch.type === 'double' && (
                          <span style={{
                            fontSize: '10px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginLeft: '8px',
                          }}>
                            DOUBLE
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                      }}>
                        {formatTime(touch.timestamp)}
                      </div>
                    </div>
                    
                    <div style={{
                      textAlign: 'right',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#1f2937',
                    }}>
                      Score après: {touch.scoreAfter.red} - {touch.scoreAfter.green}
                    </div>
                  </div>
                  
                  {/* Détails de l'action */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginTop: '8px',
                  }}>
                    {/* Zone */}
                    <div style={{
                      backgroundColor: getZoneColor(touch.zone),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      Zone {touch.zone}
                    </div>
                    
                    {/* Type d'action */}
                    <div style={{
                      backgroundColor: getActionTypeColor(touch.actionType),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      {touch.actionType}
                    </div>
                    
                    {/* Détail de l'action */}
                    <div style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      {touch.actionDetail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Bouton retour */}
        <button
          onClick={onBack}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: '24px',
            transition: 'all 0.2s',
          }}
        >
          ← RETOUR AUX MATCHS
        </button>
      </div>
    </div>
  );
}
