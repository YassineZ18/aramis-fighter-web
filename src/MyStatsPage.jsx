import React, { useState, useEffect } from 'react';
import { exportFencerAnalysis } from './excelExport';

const MyStatsPage = ({ onBack }) => {
  const [fencers, setFencers] = useState([]);
  const [selectedFencer, setSelectedFencer] = useState('');
  const [fencerStats, setFencerStats] = useState(null);

  useEffect(() => {
    // Load fencers from localStorage matches
    const matches = JSON.parse(localStorage.getItem('aramis_matches') || '[]');
    console.log('📊 MY STATS - Chargement des matchs pour analyse:', matches.length);
    
    
    const fencerSet = new Set();
    matches.forEach(match => {
      if (match.redFencer) fencerSet.add(match.redFencer);
      if (match.greenFencer) fencerSet.add(match.greenFencer);
      
      // Debug: afficher la structure complète des touches
      if (match.touchHistory && match.touchHistory.length > 0) {
        console.log(`\n=== Match ${match.redFencer} vs ${match.greenFencer} ===`);
        console.log('Nombre de touches:', match.touchHistory.length);
        console.log('Scores:', match.redScore, '-', match.greenScore);
        match.touchHistory.forEach((touch, i) => {
          console.log(`Touch ${i+1}:`, {
            fencer: touch.fencer,
            color: touch.color,
            action: touch.action,
            zone: touch.zone,
            timestamp: touch.timestamp
          });
        });
      } else {
        console.log(`Match ${match.redFencer} vs ${match.greenFencer}: AUCUNE TOUCHE`);
      }
    });
    
    const fencersList = Array.from(fencerSet).sort();
    console.log('🤺 Escrimeurs trouvés:', fencersList);
    setFencers(fencersList);
  }, []);

  useEffect(() => {
    if (selectedFencer) {
      console.log('📈 Calcul des stats pour:', selectedFencer);
      const stats = calculateStats(selectedFencer);
      console.log('📊 Statistiques calculées:', stats);
      console.log('📊 RÉSUMÉ FINAL:', {
        totalTouchesGiven: stats.totalTouchesGiven,
        totalTouchesReceived: stats.totalTouchesReceived,
        touchesGiven: stats.touchesGiven,
        touchesReceived: stats.touchesReceived
      });
      setFencerStats(stats);
    } else {
      setFencerStats(null);
    }
  }, [selectedFencer]);

  const getActionName = (action) => {
    // Mapping des boutons TouchDetailPage vers codes Excel
    const actionToExcelMapping = {
      // Boutons ATTACK
      'SIMPLE': 'AS',
      'COMPOUND': 'AC', 
      'WITH BLADE': 'AF',
      'REMISE ATT': 'RA',
      // Boutons COUNTER ATTACK
      'COUNTER ATTACK': 'CA',
      'ATTACK IN ATTACK': 'AA',
      'REMISE CA': 'CA',
      // Boutons DEFENSE
      'PARRY RIPOSTE': 'PR',
      'ATTACK ON RECOVER': 'AR',
      'REMISE DEF': 'RR',
      // Anciens mappings pour compatibilité
      'Attack Simple': 'AS',
      'Attack Compound': 'AC',
      'Attack with Blade': 'AF',
      'Counter Attack': 'CA',
      'Parry Riposte': 'PR',
      'Remise Attack': 'RA',
      'Remise Riposte': 'RR',
      'Attack in Attack': 'AA',
      'Attack on Recover': 'AR',
      'Counter Time': 'CT'
    };
    
    return actionToExcelMapping[action] || action;
  };

  const calculateStats = (fencer) => {
    const matches = JSON.parse(localStorage.getItem('aramis_matches') || '[]');
    
    // Filtrer les matchs de cet escrimeur
    const fencerMatches = matches.filter(match => 
      match.redFencer === fencer || match.greenFencer === fencer
    );
    
    const stats = {
      totalMatches: fencerMatches.length,
      victories: 0,
      defeats: 0,
      victoryRatio: 0,
      touchesGiven: {},
      touchesReceived: {},
      actionEfficiency: {},
      zoneDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      zoneDistributionReceived: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      totalTouchesGiven: 0,
      totalTouchesReceived: 0
    };
    
    // Calculer les statistiques réelles à partir des matchs
    fencerMatches.forEach(match => {
      const isRed = match.redFencer === fencer;
      const playerScore = isRed ? match.redScore : match.greenScore;
      const opponentScore = isRed ? match.greenScore : match.redScore;
      
      // Victoires/Défaites
      if (playerScore > opponentScore) {
        stats.victories++;
      } else {
        stats.defeats++;
      }
      
      // Analyser les touches du match depuis touchHistory
      if (match.touchHistory && Array.isArray(match.touchHistory)) {
        console.log(`\n🔍 Analyse des touches pour ${fencer} dans le match ${match.redFencer} vs ${match.greenFencer}`);
        
        match.touchHistory.forEach((touch, touchIndex) => {
          console.log(`Touch ${touchIndex + 1}:`, touch);
          
          // Déterminer qui a marqué la touche - Corriger le mapping couleur → nom
          let touchFencer;
          if (touch.fencer === 'red') {
            touchFencer = match.redFencer;
          } else if (touch.fencer === 'green') {
            touchFencer = match.greenFencer;
          } else if (touch.color === 'red') {
            touchFencer = match.redFencer;
          } else if (touch.color === 'green') {
            touchFencer = match.greenFencer;
          } else {
            touchFencer = touch.fencer; // Si c'est déjà un nom
          }
          
          console.log(`  → Touche marquée par: ${touchFencer}`);
          console.log(`  → Joueur analysé: ${fencer}`);
          console.log(`  → Match: ${match.redFencer} vs ${match.greenFencer}`);
          
          // Mapper l'action vers le code Excel - Utiliser actionDetail en priorité
          const rawAction = touch.actionDetail || touch.action || 'SIMPLE';
          const actionCode = getActionName(rawAction);
          console.log(`  → Action brute: ${rawAction} → Code Excel: ${actionCode}`);
          
          // Zone de la touche (1-6)
          const zone = parseInt(touch.zone) || 1;
          console.log(`  → Zone: ${zone}`);
          
          // LOGIQUE CORRIGÉE: Vérifier si le joueur analysé participe au match
          if (match.redFencer === fencer || match.greenFencer === fencer) {
            // CORRECTION: Une touche dans touchHistory représente TOUJOURS une touche VALIDE marquée
            // Le champ 'fencer' indique qui a marqué la touche
            if (touchFencer === fencer) {
              // Cette touche a été marquée PAR le joueur analysé = TOUCHE DONNÉE
              stats.touchesGiven[actionCode] = (stats.touchesGiven[actionCode] || 0) + 1;
              stats.zoneDistribution[zone] = (stats.zoneDistribution[zone] || 0) + 1;
              stats.totalTouchesGiven++;
              console.log(`  ✅ TOUCHE DONNÉE par ${fencer}: ${actionCode} en zone ${zone}`);
            } else if (touchFencer && touchFencer !== fencer) {
              // Cette touche a été marquée CONTRE le joueur analysé = TOUCHE REÇUE
              stats.touchesReceived[actionCode] = (stats.touchesReceived[actionCode] || 0) + 1;
              stats.zoneDistributionReceived[zone] = (stats.zoneDistributionReceived[zone] || 0) + 1;
              stats.totalTouchesReceived++;
              console.log(`  🔴 TOUCHE REÇUE par ${fencer}: ${actionCode} en zone ${zone} (marquée par ${touchFencer})`);
            }
          }
        });
        
        console.log(`📊 Stats après ce match - Données: ${stats.totalTouchesGiven}, Reçues: ${stats.totalTouchesReceived}`);
      }
    });
    
    // Calculer le ratio de victoire
    stats.victoryRatio = stats.totalMatches > 0 ? Math.round((stats.victories / stats.totalMatches) * 100) : 0;

    // Calculer l'efficacité par action
    const allActionCodes = new Set([...Object.keys(stats.touchesGiven), ...Object.keys(stats.touchesReceived)]);
    allActionCodes.forEach(code => {
      const given = stats.touchesGiven[code] || 0;
      const received = stats.touchesReceived[code] || 0;
      const total = given + received;
      stats.actionEfficiency[code] = total > 0 ? Math.round((given / total) * 100) : 0;
    });
    
    return stats;
  };

  const handleExportExcel = () => {
    if (!selectedFencer) {
      alert('Veuillez sélectionner un escrimeur');
      return;
    }
    
    try {
      exportFencerAnalysis(selectedFencer);
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    }
  };

  // Noms complets des actions pour les légendes
  const getActionFullName = (actionCode) => {
    const actionNames = {
      'AS': 'Attaque Simple',
      'AC': 'Attaque Composée',
      'AF': 'Attaque au Fer',
      'PR': 'Parade Riposte',
      'CA': 'Contre-Attaque',
      'RA': 'Remise d\'Attaque',
      'RR': 'Remise Riposte',
      'AA': 'Attaque sur Attaque',
      'AR': 'Attaque sur Remise',
      'CT': 'Contre-Temps'
    };
    return actionNames[actionCode] || actionCode;
  };

  const renderDomainPieChart = (data, total, title, type) => {
    if (total === 0) return null;

    const colors = type === 'given' 
      ? ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7']
      : ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'];

    let currentAngle = 0;
    const centerX = 100;
    const centerY = 100;
    const radius = 70;

    return (
      <div style={{
        textAlign: 'center',
        width: '200px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '8px'
        }}>
          {title}
        </div>
        
        <svg width="200" height="200" style={{ marginBottom: '8px' }}>
          {data.map(([action, count], index) => {
            const angle = (count / total) * 360;
            
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            const startAngleRad = (startAngle * Math.PI) / 180;
            const endAngleRad = (endAngle * Math.PI) / 180;
            
            const x1 = centerX + radius * Math.cos(startAngleRad);
            const y1 = centerY + radius * Math.sin(startAngleRad);
            const x2 = centerX + radius * Math.cos(endAngleRad);
            const y2 = centerY + radius * Math.sin(endAngleRad);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            currentAngle += angle;
            
            return (
              <path
                key={action}
                d={pathData}
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>
    );
  };


  const renderPieChart = (data, total, title, type) => {
    if (total === 0) return null;

    const colors = type === 'given' 
      ? ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7']
      : ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'];

    let currentAngle = 0;
    const centerX = 120;
    const centerY = 120;
    const radius = 80;

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        border: '2px solid #e2e8f0',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '16px'
        }}>
          {title}
        </h4>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <svg width="240" height="240" style={{ marginBottom: '16px' }}>
          {data.map(([action, count], index) => {
            const angle = (count / total) * 360;
            
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            const startAngleRad = (startAngle * Math.PI) / 180;
            const endAngleRad = (endAngle * Math.PI) / 180;
            
            const x1 = centerX + radius * Math.cos(startAngleRad);
            const y1 = centerY + radius * Math.sin(startAngleRad);
            const x2 = centerX + radius * Math.cos(endAngleRad);
            const y2 = centerY + radius * Math.sin(endAngleRad);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            currentAngle += angle;
            
            return (
              <path
                key={action}
                d={pathData}
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth="3"
              />
            );
          })}
        </svg>
          
          <div style={{ 
            fontSize: '12px', 
            color: '#64748b',
            flex: 1,
            minWidth: '150px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {data.map(([action, count], index) => (
              <div key={action} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px',
                padding: '2px 4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: colors[index % colors.length],
                    borderRadius: '2px',
                    flexShrink: 0
                  }} />
                  <span style={{ fontSize: '11px' }}>{action}</span>
                </div>
                <span style={{ fontWeight: '600', fontSize: '11px' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderActionEfficiencyChart = (actionEfficiency) => {
    if (!fencerStats) return null;
    
    const actionCodes = ['AS', 'AC', 'AF', 'AR', 'CS', 'CC', 'CF', 'CR', 'DS', 'DC', 'DF', 'DR', 'PS', 'PC', 'PF', 'PR'];
    const filteredActions = actionCodes.filter(code => 
      (fencerStats.touchesGiven[code] || 0) > 0 || (fencerStats.touchesReceived[code] || 0) > 0
    );

    if (filteredActions.length === 0) return null;

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        border: '2px solid #e2e8f0',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          ⚔️ Efficacité par Action
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(actionEfficiency).map(([action, efficiency]) => {
            const percentage = Math.round(efficiency);
            const color = percentage >= 70 ? '#16a34a' : percentage >= 50 ? '#eab308' : '#dc2626';
            
            return (
              <div key={action} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '8px 0'
              }}>
                <div style={{
                  minWidth: '80px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#64748b'
                }}>
                  {action}
                </div>
                <div style={{
                  flex: 1,
                  height: '32px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: color,
                    borderRadius: '16px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{
                  minWidth: '60px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: color,
                  textAlign: 'right'
                }}>
                  {percentage}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  if (fencers.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
          paddingTop: '100px'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '20px'
          }}>
            📊 MY STATS - {selectedFencer}
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            marginBottom: '32px'
          }}>
            Aucun match trouvé dans MY GAMES. Enregistrez des matchs pour voir vos statistiques.
          </p>
          <button
            onClick={onBack}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  // Couleurs pour les actions
  const getActionColor = (actionCode, index) => {
    const colors = {
      'AS': '#3b82f6', // Bleu
      'AC': '#8b5cf6', // Violet
      'AF': '#06b6d4', // Cyan
      'PR': '#f59e0b', // Orange
      'CA': '#22c55e', // Vert
      'RA': '#ef4444', // Rouge
      'RR': '#ec4899', // Rose
      'AA': '#84cc16', // Lime
      'AR': '#6366f1', // Indigo
      'CT': '#f97316'  // Orange foncé
    };
    return colors[actionCode] || `hsl(${index * 45}, 70%, 50%)`;
  };

  // Rendu camembert par actions
  const renderActionPieChart = (actions, total, type) => {
    if (total === 0) {
      return (
        <div style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Aucune donnée
        </div>
      );
    }

    const actionEntries = Object.entries(actions).filter(([, count]) => count > 0);
    let currentAngle = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    return (
      <div>
        <svg width="200" height="200" style={{ margin: '0 auto', display: 'block' }}>
          {actionEntries.map(([actionCode, count], index) => {
            const percentage = (count / total) * 100;
            const angle = (count / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
            const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
            const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
            const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            currentAngle += angle;
            
            return (
              <path
                key={actionCode}
                d={pathData}
                fill={getActionColor(actionCode, index)}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        
        {/* Légende */}
        <div style={{ marginTop: '16px' }}>
          {actionEntries.map(([actionCode, count], index) => {
            const percentage = Math.round((count / total) * 100);
            return (
              <div key={actionCode} style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '10px',
                fontSize: '14px'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: getActionColor(actionCode, index),
                  marginRight: '10px',
                  borderRadius: '3px'
                }} />
                <span style={{ 
                  fontWeight: '700', 
                  marginRight: '8px',
                  color: '#1e293b',
                  fontSize: '14px'
                }}>{actionCode}</span>
                <span style={{ 
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>({percentage}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Rendu graphique en barres comparatif
  const renderComparisonBarChart = (touchesGiven, touchesReceived) => {
    const allActions = new Set([...Object.keys(touchesGiven), ...Object.keys(touchesReceived)]);
    // Tous les types d'actions possibles
    const allPossibleActions = ['AS', 'AC', 'AF', 'CA', 'PR', 'RA', 'RP', 'DE', 'CO', 'AR'];
    const actionData = allPossibleActions.map(actionCode => ({
      actionCode,
      given: touchesGiven[actionCode] || 0,
      received: touchesReceived[actionCode] || 0
    }));

    const maxValue = Math.max(...actionData.map(item => Math.max(item.given, item.received)), 1);

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '2px solid #e2e8f0',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          Comparaison par Actions
        </h3>
        
        {/* En-têtes des colonnes */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '2px solid #e2e8f0'
        }}>
          <div style={{
            width: '50px',
            fontSize: '12px',
            fontWeight: '600',
            textAlign: 'right',
            color: '#64748b'
          }}>
            Action
          </div>
          <div style={{
            flex: 1,
            fontSize: '12px',
            fontWeight: '700',
            textAlign: 'center',
            color: '#16a34a'
          }}>
            Touches Données
          </div>
          <div style={{
            flex: 1,
            fontSize: '12px',
            fontWeight: '700',
            textAlign: 'center',
            color: '#dc2626'
          }}>
            Touches Reçues
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {actionData.map(({ actionCode, given, received }) => {
            const givenWidth = (given / maxValue) * 100;
            const receivedWidth = (received / maxValue) * 100;

            return (
              <div key={actionCode} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '60px',
                  fontSize: '18px',
                  fontWeight: '800',
                  textAlign: 'center',
                  color: '#1e293b',
                  backgroundColor: '#f1f5f9',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '2px solid #cbd5e1',
                  letterSpacing: '1px'
                }}>
                  {actionCode}
                </div>
                
                {/* Barre touches données */}
                <div style={{
                  flex: 1,
                  height: '24px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '12px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${givenWidth}%`,
                    height: '100%',
                    backgroundColor: '#16a34a',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '600',
                    minWidth: given > 0 ? '20px' : '0'
                  }}>
                    {given > 0 ? given : ''}
                  </div>
                </div>
                
                {/* Barre touches reçues */}
                <div style={{
                  flex: 1,
                  height: '24px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '12px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${receivedWidth}%`,
                    height: '100%',
                    backgroundColor: '#dc2626',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '600',
                    minWidth: received > 0 ? '20px' : '0'
                  }}>
                    {received > 0 ? received : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Légende */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              backgroundColor: '#16a34a',
              borderRadius: '3px'
            }} />
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#1e293b'
            }}>Touches Données</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              backgroundColor: '#dc2626',
              borderRadius: '3px'
            }} />
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#1e293b'
            }}>Touches Reçues</span>
          </div>
        </div>
      </div>
    );
  };

  // Rendu distribution par zones données
  const renderZoneDistributionChart = (zoneDistribution) => {
    const totalTouches = Object.values(zoneDistribution).reduce((sum, count) => sum + count, 0);
    
    if (totalTouches === 0) {
      return (
        <div style={{
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '14px',
          padding: '40px'
        }}>
          Aucune donnée de zone disponible
        </div>
      );
    }

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '2px solid #e2e8f0',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          🎯 Distribution par Zones - Touches DONNÉES
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {[1, 2, 3, 4, 5, 6].map(zone => {
            const count = zoneDistribution[zone] || 0;
            const percentage = totalTouches > 0 ? Math.round((count / totalTouches) * 100) : 0;
            const height = totalTouches > 0 ? (count / Math.max(...Object.values(zoneDistribution), 1)) * 100 : 0;
            
            return (
              <div key={zone} style={{ textAlign: 'center' }}>
                <div style={{
                  height: '120px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  position: 'relative',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    height: `${height}%`,
                    backgroundColor: '#22c55e',
                    borderRadius: '8px 8px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {count > 0 ? count : ''}
                  </div>
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '6px',
                  color: '#1e293b',
                  backgroundColor: '#f1f5f9',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1'
                }}>
                  Zone {zone}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#475569',
                  fontWeight: '600'
                }}>
                  {percentage}%
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Légende zones */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '32px',
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px'
        }}>
          <span style={{ 
            fontSize: '16px', 
            fontWeight: '700',
            color: '#1e293b'
          }}>Zones 1-3 (Son Terrain)</span>
          <span style={{ 
            fontSize: '16px', 
            fontWeight: '700',
            color: '#1e293b'
          }}>Zones 4-6 (Terrain Adverse)</span>
        </div>
      </div>
    );
  };

  // Rendu distribution par zones reçues
  const renderZoneDistributionReceivedChart = (zoneDistributionReceived) => {
    if (!zoneDistributionReceived) {
      return null;
    }
    const totalTouches = Object.values(zoneDistributionReceived).reduce((sum, count) => sum + count, 0);
    
    if (totalTouches === 0) {
      return (
        <div style={{
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '14px',
          padding: '40px'
        }}>
          Aucune donnée de zone disponible pour les touches reçues
        </div>
      );
    }

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '2px solid #e2e8f0',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          🔴 Distribution par Zones - Touches REÇUES
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {[1, 2, 3, 4, 5, 6].map(zone => {
            const count = zoneDistributionReceived[zone] || 0;
            const percentage = totalTouches > 0 ? Math.round((count / totalTouches) * 100) : 0;
            const height = totalTouches > 0 ? (count / Math.max(...Object.values(zoneDistributionReceived), 1)) * 100 : 0;
            
            return (
              <div key={zone} style={{ textAlign: 'center' }}>
                <div style={{
                  height: '120px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  position: 'relative',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    height: `${height}%`,
                    backgroundColor: '#ef4444',
                    borderRadius: '8px 8px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {count > 0 ? count : ''}
                  </div>
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '6px',
                  color: '#1e293b',
                  backgroundColor: '#f1f5f9',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1'
                }}>
                  Zone {zone}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#475569',
                  fontWeight: '600'
                }}>
                  {percentage}%
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Légende zones */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '32px',
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px'
        }}>
          <span style={{ 
            fontSize: '16px', 
            fontWeight: '700',
            color: '#1e293b'
          }}>Zones 1-3 (Son Terrain)</span>
          <span style={{ 
            fontSize: '16px', 
            fontWeight: '700',
            color: '#1e293b'
          }}>Zones 4-6 (Terrain Adverse)</span>
        </div>
      </div>
    );
  };

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
            📊 MES STATISTIQUES
          </h1>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '2px solid #e2e8f0',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            {/* Statistiques générales */}
            {fencerStats && (
              <div style={{
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
                marginBottom: '20px'
              }}>
                <div style={{
                  backgroundColor: '#f0f9ff',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '2px solid #0ea5e9',
                  textAlign: 'center',
                  minWidth: '120px'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#0ea5e9' }}>
                    {fencerStats.totalMatches || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    MATCHS TOTAUX
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#f0fdf4',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '2px solid #22c55e',
                  textAlign: 'center',
                  minWidth: '120px'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>
                    {fencerStats.victories || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    VICTOIRES
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#fef2f2',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '2px solid #ef4444',
                  textAlign: 'center',
                  minWidth: '120px'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                    {fencerStats.defeats || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    DÉFAITES
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#fffbeb',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '2px solid #f59e0b',
                  textAlign: 'center',
                  minWidth: '120px'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                    {fencerStats.victoryRatio || 0}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    RATIO VICTOIRE
                  </div>
                </div>
              </div>
            )}
            <label style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1e293b'
            }}>
              Sélectionner un escrimeur:
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <label style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                🤺 Escrimeur :
              </label>
              <select
                value={selectedFencer}
                onChange={(e) => setSelectedFencer(e.target.value)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: 'white',
                  color: '#1e293b',
                  minWidth: '200px',
                  cursor: 'pointer'
                }}
              >
                <option value="">Sélectionner un escrimeur</option>
                {fencers.map(fencer => (
                  <option key={fencer} value={fencer}>{fencer.toUpperCase()}</option>
                ))}
              </select>
            </div>
            {selectedFencer && (
              <button
                onClick={handleExportExcel}
                style={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📊 Export Excel
              </button>
            )}
          </div>
        </div>

        {selectedFencer && fencerStats && (
          <div>
            {/* Résumé des touches */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              border: '2px solid #e2e8f0',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'center',
              gap: '40px',
              flexWrap: 'wrap'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#16a34a' }}>
                  {fencerStats.totalTouchesGiven}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Touches Données</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626' }}>
                  {fencerStats.totalTouchesReceived}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Touches Reçues</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>
                  {fencerStats.totalTouchesGiven + fencerStats.totalTouchesReceived > 0 ? 
                    Math.round((fencerStats.totalTouchesGiven / (fencerStats.totalTouchesGiven + fencerStats.totalTouchesReceived)) * 100) : 0}%
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Efficacité Globale</div>
              </div>
            </div>

            {/* Camemberts Touches Données et Reçues */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              border: '2px solid #e2e8f0',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                📊 Répartition par Nature d'Actions
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '40px',
                alignItems: 'center'
              }}>
                {/* Camembert Touches Données */}
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#16a34a',
                    marginBottom: '16px'
                  }}>
                    Touches DONNÉES
                  </h4>
                  {renderActionPieChart(fencerStats.touchesGiven, fencerStats.totalTouchesGiven, 'given')}
                </div>
                
                {/* Camembert Touches Reçues */}
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#dc2626',
                    marginBottom: '16px'
                  }}>
                    Touches REÇUES
                  </h4>
                  {renderActionPieChart(fencerStats.touchesReceived, fencerStats.totalTouchesReceived, 'received')}
                </div>
              </div>
            </div>

            {/* Graphique en Barres Comparatif */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              border: '2px solid #e2e8f0',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                📈 Comparaison par Actions
              </h3>
              {renderComparisonBarChart(fencerStats.touchesGiven, fencerStats.touchesReceived)}
            </div>

            {/* Distribution par Zones - Touches Données */}
            {renderZoneDistributionChart(fencerStats.zoneDistribution)}

            {/* Distribution par Zones - Touches Reçues */}
            {renderZoneDistributionReceivedChart(fencerStats.zoneDistributionReceived)}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyStatsPage;
