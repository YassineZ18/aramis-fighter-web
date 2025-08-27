import React, { useState, useEffect } from 'react';
import MatchDetailsPage from './MatchDetailsPage';
import { secureStorage } from './secureStorage';
import { sessionManager } from './sessionManager';
import { logger, performanceMonitor, cache } from './performanceOptimizer';

export default function MyGamesPage({ onBack }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showMatchDetails, setShowMatchDetails] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadMatches = () => {
      try {
        console.log('📊 MY GAMES - Chargement des matchs...');
        
        // Charger depuis localStorage avec la même clé que BoutPage
        const savedMatches = JSON.parse(localStorage.getItem('aramis_matches') || '[]');
        
        console.log('📋 Matchs trouvés:', savedMatches.length);
        console.log('🎯 Détails des matchs:', savedMatches);
        
        // Debug: Vérifier la structure des touchHistory
        savedMatches.forEach((match, i) => {
          console.log(`\n=== MATCH ${i+1}: ${match.redFencer} vs ${match.greenFencer} ===`);
          console.log('TouchHistory:', match.touchHistory);
          if (match.touchHistory && match.touchHistory.length > 0) {
            match.touchHistory.forEach((touch, j) => {
              console.log(`Touch ${j+1}:`, {
                fencer: touch.fencer,
                action: touch.action,
                actionDetail: touch.actionDetail,
                zone: touch.zone,
                color: touch.color
              });
            });
          }
        });
        
        // Trier par date (plus récent en premier)
        const sortedMatches = savedMatches.sort((a, b) => new Date(b.date) - new Date(a.date));
        setMatches(sortedMatches);
        
        console.log('✅ Matchs chargés avec succès:', sortedMatches.length);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des matchs:', error);
        setMatches([]);
      }
    };

    loadMatches();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWinnerDisplay = (match) => {
    if (match.winner === 'draw') {
      return 'Match nul';
    }
    return match.winner === 'red' ? match.redFencer : match.greenFencer;
  };

  const clearHistory = async () => {
    performanceMonitor.start('clear-history');
    
    try {
      // Supprimer de localStorage (clé utilisée par l'application)
      localStorage.removeItem('aramis_matches');
      
      // Mettre à jour l'état
      setMatches([]);
      
      logger.info('Historique des matchs supprimé avec succès');
    } catch (error) {
      logger.error('Erreur lors de la suppression de l\'historique', error);
    } finally {
      performanceMonitor.end('clear-history');
    }
  };

  const clearTestMatches = async () => {
    performanceMonitor.start('clear-test-matches');
    
    try {
      // Charger les matchs actuels
      const savedMatches = JSON.parse(localStorage.getItem('aramis_matches') || '[]');
      
      // Filtrer pour exclure les matchs de test
      const testPlayers = ['test player', 'opponent a', 'opponent b'];
      const filteredMatches = savedMatches.filter(match => {
        const redFencer = match.redFencer?.toLowerCase() || '';
        const greenFencer = match.greenFencer?.toLowerCase() || '';
        
        // Garder le match seulement si aucun des deux fencers n'est un test player
        return !testPlayers.includes(redFencer) && !testPlayers.includes(greenFencer);
      });
      
      // Sauvegarder les matchs filtrés
      localStorage.setItem('aramis_matches', JSON.stringify(filteredMatches));
      
      // Mettre à jour l'état
      setMatches(filteredMatches);
      
      const deletedCount = savedMatches.length - filteredMatches.length;
      logger.info(`${deletedCount} matchs de test supprimés avec succès`);
      
      console.log(`🧹 Suppression des matchs de test: ${deletedCount} matchs supprimés`);
      console.log(`📊 Matchs restants: ${filteredMatches.length}`);
      
    } catch (error) {
      logger.error('Erreur lors de la suppression des matchs de test', error);
    } finally {
      performanceMonitor.end('clear-test-matches');
    }
  };

  const handleShowMatchDetails = (match) => {
    setSelectedMatch(match);
    setShowMatchDetails(true);
  };

  const handleBackFromDetails = () => {
    setShowMatchDetails(false);
    setSelectedMatch(null);
  };

  // Si on doit afficher la page de détails de match
  if (showMatchDetails && selectedMatch) {
    return (
      <MatchDetailsPage
        match={selectedMatch}
        onBack={handleBackFromDetails}
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
        paddingTop: '80px',
        maxWidth: '400px',
        margin: '0 auto',
      }}>
        
        {/* Titre */}
        <h1 style={{
          fontSize: isMobile ? '24px' : '28px',
          fontWeight: '800',
          color: '#1e293b',
          marginBottom: '32px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textAlign: 'center',
        }}>
          MY GAMES
        </h1>

        {/* Boutons de gestion */}
        {matches.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={clearTestMatches}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              Effacer matchs de test
            </button>
            <button
              onClick={clearHistory}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              Effacer tout l'historique
            </button>
          </div>
        )}

        {/* Liste des matchs */}
        {matches.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#64748b',
          }}>
            <p style={{
              fontSize: '16px',
              marginBottom: '8px',
            }}>
              Aucun match enregistré
            </p>
            <p style={{
              fontSize: '14px',
              color: '#94a3b8',
            }}>
              Utilisez "START BOUT" pour commencer un match
            </p>
          </div>
        ) : (
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {matches.map((match) => (
              <div
                key={match.id}
                style={{
                  backgroundColor: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                {/* Date du match */}
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginBottom: '12px',
                  textAlign: 'center',
                }}>
                  {formatDate(match.date)}
                </div>

                {/* Escrimeurs et scores */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}>
                  {/* Escrimeur rouge */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                  }}>
                    <div style={{
                      backgroundColor: '#fecaca',
                      border: '2px solid #dc2626',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#7f1d1d',
                      textAlign: 'center',
                      marginBottom: '8px',
                      width: '100%',
                      maxWidth: '100px',
                      textTransform: 'uppercase',
                    }}>
                      {match.redFencer}
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '900',
                      color: '#dc2626',
                    }}>
                      {match.redScore}
                    </div>
                  </div>

                  {/* VS */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#64748b',
                    margin: '0 16px',
                  }}>
                    VS
                  </div>

                  {/* Escrimeur vert */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                  }}>
                    <div style={{
                      backgroundColor: '#bbf7d0',
                      border: '2px solid #16a34a',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#14532d',
                      textAlign: 'center',
                      marginBottom: '8px',
                      width: '100%',
                      maxWidth: '100px',
                      textTransform: 'uppercase',
                    }}>
                      {match.greenFencer}
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '900',
                      color: '#16a34a',
                    }}>
                      {match.greenScore}
                    </div>
                  </div>
                </div>

                {/* Gagnant */}
                <div style={{
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: match.winner === 'draw' ? '#64748b' : 
                        match.winner === 'red' ? '#dc2626' : '#16a34a',
                  backgroundColor: match.winner === 'draw' ? '#f1f5f9' :
                                 match.winner === 'red' ? '#fef2f2' : '#f0fdf4',
                  padding: '8px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                }}>
                  {match.winner === 'draw' ? '🤝 Match nul' : 
                   `🏆 Gagnant: ${getWinnerDisplay(match).toUpperCase()}`}
                </div>

                {/* Bouton Détails */}
                <button
                  onClick={() => handleShowMatchDetails(match)}
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
                    letterSpacing: '0.05em',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  📊 VOIR LES DÉTAILS
                  {match.touchHistory && match.touchHistory.length > 0 && (
                    <span style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      padding: '2px 6px',
                      fontSize: '12px',
                    }}>
                      {match.touchHistory.length} touches
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
