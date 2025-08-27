import React, { useState, useEffect } from 'react';
import { exportFencerAnalysis } from './excelExport';

const MyStatsPage = ({ onBack }) => {
  const [fencers, setFencers] = useState([]);
  const [selectedFencer, setSelectedFencer] = useState('');
  const [fencerStats, setFencerStats] = useState(null);

  useEffect(() => {
    // Load fencers from localStorage matches
    const matches = JSON.parse(localStorage.getItem('aramis_matches') || '[]');
    const fencerSet = new Set();
    matches.forEach(match => {
      if (match.redFencer) fencerSet.add(match.redFencer);
      if (match.greenFencer) fencerSet.add(match.greenFencer);
    });
    setFencers(Array.from(fencerSet).sort());
  }, []);

  useEffect(() => {
    if (selectedFencer) {
      const stats = calculateStats(selectedFencer);
      setFencerStats(stats);
    }
  }, [selectedFencer]);

  const getActionName = (action) => {
    // Convertir l'action React vers le code Excel pour cohérence
    const actionToExcelMapping = {
      'Attack Simple': 'AS',
      'Attack Compound': 'AC', 
      'Attack with Fer': 'AF',
      'Attack Riposte': 'AR',
      'Counter Simple': 'CS',
      'Counter Compound': 'CC',
      'Counter with Fer': 'CF',
      'Counter Riposte': 'CR',
      'Defense Simple': 'DS',
      'Defense Compound': 'DC',
      'Defense with Fer': 'DF',
      'Defense Riposte': 'DR',
      'Preparation Simple': 'PS',
      'Preparation Compound': 'PC',
      'Preparation with Fer': 'PF',
      'Preparation Riposte': 'PR'
    };
    
    return actionToExcelMapping[action] || action;
  };

  const calculateStats = (fencer) => {
    const matches = JSON.parse(localStorage.getItem('aramis_matches') || '[]');
    const stats = {
      touchesGiven: {},
      touchesReceived: {},
      actionEfficiency: {},
      zoneDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      totalTouchesGiven: 0,
      totalTouchesReceived: 0
    };

    // Initialize all action codes from Excel mapping
    const actionCodes = ['AS', 'AC', 'AF', 'AR', 'CS', 'CC', 'CF', 'CR', 'DS', 'DC', 'DF', 'DR', 'PS', 'PC', 'PF', 'PR'];
    actionCodes.forEach(code => {
      stats.touchesGiven[code] = 0;
      stats.touchesReceived[code] = 0;
      stats.actionEfficiency[code] = 0;
    });

    matches.forEach(match => {
      if (!match.touches || !Array.isArray(match.touches)) return;
      
      match.touches.forEach(touch => {
        const excelCode = getActionName(touch.action);
        
        if (touch.scorer === fencer) {
          stats.touchesGiven[excelCode]++;
          stats.totalTouchesGiven++;
          if (touch.zone) {
            stats.zoneDistribution[touch.zone]++;
          }
        } else if ((match.redFencer === fencer || match.greenFencer === fencer) && touch.scorer !== fencer) {
          stats.touchesReceived[excelCode]++;
          stats.totalTouchesReceived++;
        }
      });
    });

    // Calculate efficiency for each action using Excel logic
    actionCodes.forEach(code => {
      const given = stats.touchesGiven[code];
      const received = stats.touchesReceived[code];
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

  const getActionName = (action) => {
    // Convertir l'action React vers le code Excel pour cohérence
    const actionToExcelMapping = {
      'Attack Simple': 'AS',
      'Attack Compound': 'AC', 
      'Attack with Fer': 'AF',
      'Attack Riposte': 'AR',
      'Counter Simple': 'CS',
      'Counter Compound': 'CC',
      'Counter with Fer': 'CF',
      'Counter Riposte': 'CR',
      'Defense Simple': 'DS',
      'Defense Compound': 'DC',
      'Defense with Fer': 'DF',
      'Defense Riposte': 'DR',
      'Preparation Simple': 'PS',
      'Preparation Compound': 'PC',
      'Preparation with Fer': 'PF',
      'Preparation Riposte': 'PR'
    };
    
    return actionToExcelMapping[action] || action;
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
        minWidth: '280px',
        maxWidth: '320px',
        textAlign: 'center'
      }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '16px'
        }}>
          {title}
        </h4>
        
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
                strokeWidth="2"
              />
            );
          })}
          
          <text x={centerX} y={centerY - 5} textAnchor="middle" fontSize="20" fontWeight="bold" fill="#1e293b">
            {total}
          </text>
          <text x={centerX} y={centerY + 15} textAnchor="middle" fontSize="12" fill="#64748b">
            Total
          </text>
        </svg>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.map(([action, count], index) => {
            const percentage = Math.round((count / total) * 100);
            return (
              <div key={action} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: colors[index % colors.length],
                    borderRadius: '2px'
                  }} />
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>{action}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#64748b' }}>{count}</span>
                  <span style={{ color: '#8b5cf6', fontWeight: '600' }}>({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCircularCharts = () => {
    if (!fencerStats) return null;

    const givenActionData = Object.entries(fencerStats.actions)
      .filter(([, data]) => data.given > 0)
      .sort(([,a], [,b]) => b.given - a.given)
      .slice(0, 6);

    const receivedActionData = Object.entries(fencerStats.actions)
      .filter(([, data]) => data.received > 0)
      .sort(([,a], [,b]) => b.received - a.received)
      .slice(0, 6);

    const totalGiven = givenActionData.reduce((sum, [, data]) => sum + data.given, 0);
    const totalReceived = receivedActionData.reduce((sum, [, data]) => sum + data.received, 0);

    if (totalGiven === 0 && totalReceived === 0) return null;

    return (
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {totalGiven > 0 && renderPieChart(givenActionData, totalGiven, '✅ Touches Données', 'given')}
        {totalReceived > 0 && renderPieChart(receivedActionData, totalReceived, '❌ Touches Reçues', 'received')}
      </div>
    );
  };

  const renderActionChart = () => {
    if (!fencerStats) return null;

    const topActions = Object.entries(fencerStats.actions)
      .filter(([code, data]) => data.given > 0 || data.received > 0)
      .sort(([,a], [,b]) => (b.given + b.received) - (a.given + a.received))
      .slice(0, 8);

    if (topActions.length === 0) return null;

    const maxValue = Math.max(...topActions.map(([,data]) => Math.max(data.given, data.received)));

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        border: '2px solid #e2e8f0',
        marginBottom: '20px',
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '16px',
          textAlign: 'center',
        }}>
          ⚔️ Efficacité par Action
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#16a34a', borderRadius: '2px' }} />
            Touches Données
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#dc2626', borderRadius: '2px' }} />
            Touches Reçues
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {topActions.map(([code, data]) => {
            const givenPercentage = maxValue > 0 ? (data.given / maxValue) * 100 : 0;
            const receivedPercentage = maxValue > 0 ? (data.received / maxValue) * 100 : 0;
            const efficiency = data.received > 0 
              ? Math.round((data.given / (data.given + data.received)) * 100)
              : 100;
            
            return (
              <div key={code} style={{
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: '#fafafa',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#8b5cf6',
                      backgroundColor: '#f3f4f6',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      minWidth: '40px',
                      textAlign: 'center',
                    }}>
                      {code}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#64748b',
                    }}>
                      {getActionName(code)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: efficiency >= 70 ? '#16a34a' : efficiency >= 50 ? '#eab308' : '#dc2626',
                  }}>
                    {efficiency}%
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{
                      fontSize: '11px',
                      color: '#16a34a',
                      minWidth: '50px',
                      fontWeight: '600',
                    }}>
                      Données:
                    </span>
                    <div style={{
                      flex: 1,
                      height: '16px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      position: 'relative',
                    }}>
                      <div style={{
                        width: `${givenPercentage}%`,
                        height: '100%',
                        backgroundColor: '#16a34a',
                        borderRadius: '8px',
                      }} />
                    </div>
                    <span style={{
                      fontSize: '11px',
                      color: '#16a34a',
                      fontWeight: '600',
                      minWidth: '20px',
                    }}>
                      {data.given}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{
                      fontSize: '11px',
                      color: '#dc2626',
                      minWidth: '50px',
                      fontWeight: '600',
                    }}>
                      Reçues:
                    </span>
                    <div style={{
                      flex: 1,
                      height: '16px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      position: 'relative',
                    }}>
                      <div style={{
                        width: `${receivedPercentage}%`,
                        height: '100%',
                        backgroundColor: '#dc2626',
                        borderRadius: '8px',
                      }} />
                    </div>
                    <span style={{
                      fontSize: '11px',
                      color: '#dc2626',
                      fontWeight: '600',
                      minWidth: '20px',
                    }}>
                      {data.received}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderZoneChart = () => {
    if (!fencerStats) return null;

    const zoneData = [];
    for (let zone = 1; zone <= 6; zone++) {
      const given = fencerStats.zones.given[zone] || 0;
      const received = fencerStats.zones.received[zone] || 0;
      zoneData.push({ zone, given, received });
    }

    const totalGiven = zoneData.reduce((sum, d) => sum + d.given, 0);
    const totalReceived = zoneData.reduce((sum, d) => sum + d.received, 0);

    if (totalGiven === 0 && totalReceived === 0) return null;

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        border: '2px solid #e2e8f0',
        marginBottom: '20px',
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '16px',
          textAlign: 'center',
        }}>
          🏟️ Répartition par Zones du Terrain
        </h3>
        <p style={{
          fontSize: '12px',
          color: '#64748b',
          textAlign: 'center',
          marginBottom: '20px',
          fontStyle: 'italic',
        }}>
          Zones normalisées du point de vue de l'escrimeur sélectionné
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Touches DONNÉES */}
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            padding: '16px',
            border: '2px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '12px',
              gap: '12px'
            }}>
              {code}
            </span>
            <span style={{
              fontSize: '12px',
              color: '#64748b',
            }}>
              {getActionName(code)}
            </span>
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: '700',
            color: efficiency >= 70 ? '#16a34a' : efficiency >= 50 ? '#eab308' : '#dc2626',
          }}>
            {efficiency}%
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{
              fontSize: '11px',
              color: '#16a34a',
              minWidth: '50px',
              fontWeight: '600',
            }}>
              Données:
            </span>
            <div style={{
              flex: 1,
              height: '16px',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                width: `${givenPercentage}%`,
                height: '100%',
                backgroundColor: '#16a34a',
                borderRadius: '8px',
              }} />
            </div>
            <span style={{
              fontSize: '11px',
              color: '#16a34a',
              fontWeight: '600',
              minWidth: '20px',
            }}>
              {data.given}
            </span>
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: given > 0 ? 'white' : '#16a34a',
                      fontSize: '11px',
                      fontWeight: '700',
                      borderRight: zone < 6 ? '1px solid rgba(255,255,255,0.3)' : 'none',
                      position: 'relative'
                    }}
                  >
                    <div>{given}</div>
                    {given > 0 && (
                      <div style={{ fontSize: '9px', opacity: 0.9 }}>
                        {percentage}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div style={{
              display: 'flex',
              marginTop: '8px'
            }}>
              {zoneData.map(({ zone, given }) => {
                const width = totalGiven > 0 ? (given / totalGiven) * 100 : 16.67;
                return (
                  <div
                    key={`label-given-${zone}`}
                    style={{
                      flex: `0 0 ${width}%`,
                      textAlign: 'center',
                      fontSize: '10px',
                      fontWeight: '600',
                      color: '#64748b',
                      borderRight: zone < 6 ? '1px solid #e2e8f0' : 'none'
                    }}
                  >
                    {zone}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Touches REÇUES */}
          <div style={{
            backgroundColor: '#fef2f2',
            borderRadius: '8px',
            padding: '16px',
            border: '2px solid #fecaca'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '12px',
              gap: '12px'
            }}>
              <div style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                minWidth: '120px',
                textAlign: 'center'
              }}>
                Touches REÇUES
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              height: '40px',
              border: '2px solid #dc2626',
              borderRadius: '6px',
              overflow: 'hidden',
              backgroundColor: '#fef2f2'
            }}>
              {zoneData.map(({ zone, received }) => {
                const width = totalReceived > 0 ? (received / totalReceived) * 100 : 16.67;
                const percentage = totalReceived > 0 ? Math.round((received / totalReceived) * 100) : 0;
                
                return (
                  <div
                    key={`received-${zone}`}
                    style={{
                      flex: `0 0 ${width}%`,
                      backgroundColor: received > 0 ? '#dc2626' : '#fecaca',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: received > 0 ? 'white' : '#dc2626',
                      fontSize: '11px',
                      fontWeight: '700',
                      borderRight: zone < 6 ? '1px solid rgba(255,255,255,0.3)' : 'none',
                      position: 'relative'
                    }}
                  >
                    <div>{received}</div>
                    {received > 0 && (
                      <div style={{ fontSize: '9px', opacity: 0.9 }}>
                        {percentage}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div style={{
              display: 'flex',
              marginTop: '8px'
            }}>
              {zoneData.map(({ zone, received }) => {
                const width = totalReceived > 0 ? (received / totalReceived) * 100 : 16.67;
                return (
                  <div
                    key={`label-received-${zone}`}
                    style={{
                      flex: `0 0 ${width}%`,
                      textAlign: 'center',
                      fontSize: '10px',
                      fontWeight: '600',
                      color: '#64748b',
                      borderRight: zone < 6 ? '1px solid #e2e8f0' : 'none'
                    }}
                  >
                    {zone}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleExport = () => {
    if (selectedFencer) {
      exportFencerAnalysis(selectedFencer);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Header avec bouton retour */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '30px',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid #e2e8f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={onBack}
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#7c3aed';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#8b5cf6';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              ← Retour
            </button>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#1e293b',
              margin: 0,
            }}>
              📊 MY STATS
            </h1>
          </div>
        </div>

        {/* Sélection d'escrimeur */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #e2e8f0',
          marginBottom: '20px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            <label style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1e293b',
            }}>
              Sélectionner un escrimeur:
            </label>
            <select
              value={selectedFencer}
              onChange={(e) => setSelectedFencer(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '2px solid #8b5cf6',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: 'white',
                color: '#1e293b',
                minWidth: '200px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(139, 92, 246, 0.1)',
                transition: 'all 0.2s ease',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#7c3aed';
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#8b5cf6';
                e.target.style.boxShadow = '0 2px 4px rgba(139, 92, 246, 0.1)';
              }}
            >
              <option value="" style={{
                backgroundColor: '#f8fafc',
                color: '#64748b',
                fontStyle: 'italic',
              }}>
                -- Choisir un escrimeur --
              </option>
              {fencers.map(fencer => (
                <option 
                  key={fencer} 
                  value={fencer}
                  style={{
                    backgroundColor: 'white',
                    color: '#1e293b',
                    fontWeight: '600',
                    padding: '8px',
                  }}
                >
                  {fencer}
                </option>
              ))}
            </select>
            {selectedFencer && (
              <button
                onClick={handleExportExcel}
                style={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#15803d';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#16a34a';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                📊 Exporter Excel
              </button>
            )}
          </div>
        </div>

        {/* Message si aucun escrimeur disponible */}
        {fencers.length === 0 && (
          <div style={{
            backgroundColor: '#fef3c7',
            borderRadius: '12px',
            padding: '20px',
            border: '2px solid #f59e0b',
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#92400e',
              marginBottom: '8px',
            }}>
              📋 Aucun escrimeur trouvé
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#78350f',
              margin: 0,
            }}>
              Vous devez d'abord créer des matchs dans <strong>MY GAMES</strong> pour voir les statistiques des escrimeurs.
            </p>
          </div>
        )}

        {/* Statistiques générales */}
        {fencerStats && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '2px solid #e2e8f0',
            marginBottom: '20px',
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '16px',
              textAlign: 'center',
            }}>
              📈 Résumé - {selectedFencer}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
            }}>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>{fencerStats.totalMatches}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Matchs</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>{fencerStats.wins}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Victoires</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>{fencerStats.losses}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Défaites</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>{fencerStats.totalTouchesGiven}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Touches Données</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>{fencerStats.totalTouchesReceived}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Touches Reçues</div>
              </div>
            </div>
          </div>
        )}

        {/* Graphiques */}
        {fencerStats && (
          <>
            {renderCircularCharts()}
            {renderActionChart()}
            {renderZoneChart()}
          </>
        )}
      </div>
    </div>
  );
};

export default MyStatsPage;
