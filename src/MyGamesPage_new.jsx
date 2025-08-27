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

  const formatDuration = (start, end) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const duration = Math.floor((endTime - startTime) / 1000 / 60); // en minutes
    return `${duration} min`;
  };

  const getWinnerStyle = (match, fencerNumber) => {
    const isWinner = fencerNumber === 1 ? match.score1 > match.score2 : match.score2 > match.score1;
    return {
      fontWeight: isWinner ? '700' : '400',
      color: isWinner ? '#059669' : '#64748b'
    };
  };

  // Si on affiche les détails d'un match
  if (showMatchDetails && selectedMatch) {
    return (
      <MatchDetailsPage 
        match={selectedMatch}
        onBack={() => {
          setShowMatchDetails(false);
          setSelectedMatch(null);
        }}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '10px',
      width: '100vw',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 'none',
        margin: '0',
        padding: '0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '2px solid #e2e8f0'
        }}>
          <button 
            onClick={onBack}
            style={{
              backgroundColor: '#64748b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            ← Retour
          </button>
          <h1 style={{
            fontSize: 'clamp(24px, 5vw, 32px)',
            fontWeight: '700',
            color: '#1e293b',
            margin: 0
          }}>
            📊 MES MATCHS
          </h1>
        </div>

        {/* Liste des matchs */}
        {matches.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#64748b',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '2px solid #e2e8f0'
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
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onClick={() => {
                  setSelectedMatch(match);
                  setShowMatchDetails(true);
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    flex: 1
                  }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#64748b'
                    }}>
                      {formatDate(match.date)}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1e293b'
                    }}>
                      {match.fencer1} vs {match.fencer2}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#3b82f6'
                  }}>
                    {match.score1} - {match.score2}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
