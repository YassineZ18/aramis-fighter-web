import React, { useState, useEffect } from 'react';

export default function DoubleTouchDetailPage({ redFencerName, greenFencerName, onBack, onValidate }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentStep, setCurrentStep] = useState(1); // 1 = Red fencer, 2 = Green fencer
  
  // Données pour l'escrimeur rouge
  const [redSelectedZone, setRedSelectedZone] = useState(null);
  const [redSelectedActionType, setRedSelectedActionType] = useState(null);
  const [redSelectedActionDetail, setRedSelectedActionDetail] = useState(null);
  
  // Données pour l'escrimeur vert
  const [greenSelectedZone, setGreenSelectedZone] = useState(null);
  const [greenSelectedActionType, setGreenSelectedActionType] = useState(null);
  const [greenSelectedActionDetail, setGreenSelectedActionDetail] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isRedStep = currentStep === 1;
  const currentFencerColor = isRedStep ? 'red' : 'green';
  const currentFencerName = isRedStep ? redFencerName : greenFencerName;
  const headerColor = isRedStep ? '#dc2626' : '#16a34a';

  // États pour l'escrimeur actuel
  const selectedZone = isRedStep ? redSelectedZone : greenSelectedZone;
  const selectedActionType = isRedStep ? redSelectedActionType : greenSelectedActionType;
  const selectedActionDetail = isRedStep ? redSelectedActionDetail : greenSelectedActionDetail;

  const setSelectedZone = isRedStep ? setRedSelectedZone : setGreenSelectedZone;
  const setSelectedActionType = isRedStep ? setRedSelectedActionType : setGreenSelectedActionType;
  const setSelectedActionDetail = isRedStep ? setRedSelectedActionDetail : setGreenSelectedActionDetail;

  const canProceed = selectedZone && selectedActionType && selectedActionDetail;

  const handleNext = () => {
    if (currentStep === 1) {
      // Passer à l'escrimeur vert
      setCurrentStep(2);
    } else {
      // Valider les deux touches
      const doubleTouchData = {
        red: {
          zone: redSelectedZone,
          actionType: redSelectedActionType,
          actionDetail: redSelectedActionDetail,
          fencer: 'red',
          fencerName: redFencerName
        },
        green: {
          zone: greenSelectedZone,
          actionType: greenSelectedActionType,
          actionDetail: greenSelectedActionDetail,
          fencer: 'green',
          fencerName: greenFencerName
        }
      };
      onValidate(doubleTouchData);
    }
  };

  const handleActionSelect = (actionType, actionDetail) => {
    if (isRedStep) {
      setRedSelectedActionType(actionType);
      setRedSelectedActionDetail(actionDetail);
    } else {
      setGreenSelectedActionType(actionType);
      setGreenSelectedActionDetail(actionDetail);
    }
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
        backgroundColor: headerColor,
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
      }}>
        <h1 style={{
          fontSize: '20px',
          fontWeight: '800',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          DOUBLE TOUCH - FENCER {currentFencerColor.toUpperCase()}
        </h1>
        
        {/* Bouton menu (3 lignes) */}
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

      {/* Indicateur d'étape */}
      <div style={{
        backgroundColor: '#e5e7eb',
        padding: '12px 20px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '600',
        color: '#1f2937',
      }}>
        Étape {currentStep}/2 - {currentFencerName || (isRedStep ? 'Rouge' : 'Vert')}
      </div>

      {/* Contenu principal */}
      <div style={{
        flex: 1,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '400px',
        margin: '0 auto',
        width: '100%',
      }}>
        
        {/* Section STRIP */}
        <div>
          <div style={{
            backgroundColor: '#e5e7eb',
            padding: '12px',
            textAlign: 'center',
            fontWeight: '700',
            fontSize: '16px',
            color: '#1f2937',
            marginBottom: '12px',
            border: '2px solid #9ca3af',
          }}>
            STRIP
          </div>
          
          {/* Boutons zones 1-6 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '4px',
            marginBottom: '12px',
          }}>
            {[1, 2, 3, 4, 5, 6].map((zone) => (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                style={{
                  backgroundColor: selectedZone === zone ? headerColor : 
                                 zone <= 3 ? '#ef4444' : '#22c55e',
                  color: 'white',
                  border: selectedZone === zone ? '3px solid #1f2937' : 'none',
                  padding: '16px 8px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {zone}
              </button>
            ))}
          </div>
          
          {/* Gradient bar */}
          <div style={{
            height: '8px',
            background: 'linear-gradient(to right, #ef4444, #22c55e)',
            marginBottom: '12px',
          }} />
          
          {/* Choose text */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <div style={{
              backgroundColor: '#e5e7eb',
              border: '2px solid #9ca3af',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1f2937',
            }}>
              CHOOSE 1 TO 6
            </div>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>OR ⇒</span>
          </div>
        </div>

        {/* Section ACTION */}
        <div>
          <div style={{
            backgroundColor: '#e5e7eb',
            padding: '12px',
            textAlign: 'center',
            fontWeight: '700',
            fontSize: '16px',
            color: '#1f2937',
            marginBottom: '16px',
            border: '2px solid #9ca3af',
          }}>
            ACTION
          </div>

          {/* Actions ATTACK */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'stretch',
              marginBottom: '8px',
            }}>
              <div style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '12px 8px',
                fontSize: '12px',
                fontWeight: '700',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
              }}>
                ATTACK
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {['SIMPLE', 'COMPOUND', 'WITH BLADE', 'REMISE ATT'].map((action) => (
                  <button
                    key={action}
                    onClick={() => handleActionSelect('ATTACK', action)}
                    style={{
                      backgroundColor: selectedActionType === 'ATTACK' && selectedActionDetail === action ? 
                                     '#1d4ed8' : 'white',
                      color: selectedActionType === 'ATTACK' && selectedActionDetail === action ? 
                             'white' : '#1f2937',
                      border: '2px solid #e5e7eb',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions COUNTER ATTACK */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'stretch',
              marginBottom: '8px',
            }}>
              <div style={{
                backgroundColor: '#22c55e',
                color: 'white',
                padding: '12px 8px',
                fontSize: '12px',
                fontWeight: '700',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
              }}>
                COUNTER ATTACK
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {['COUNTER ATTACK', 'ATTACK IN ATTACK', 'REMISE CA'].map((action) => (
                  <button
                    key={action}
                    onClick={() => handleActionSelect('COUNTER ATTACK', action)}
                    style={{
                      backgroundColor: selectedActionType === 'COUNTER ATTACK' && selectedActionDetail === action ? 
                                     '#16a34a' : 'white',
                      color: selectedActionType === 'COUNTER ATTACK' && selectedActionDetail === action ? 
                             'white' : '#1f2937',
                      border: '2px solid #e5e7eb',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions DEFENSE */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'stretch',
              marginBottom: '8px',
            }}>
              <div style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                padding: '12px 8px',
                fontSize: '12px',
                fontWeight: '700',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
              }}>
                DEFENSE
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {['PARRY RIPOSTE', 'ATTACK ON RECOVER', 'REMISE DEF'].map((action) => (
                  <button
                    key={action}
                    onClick={() => handleActionSelect('DEFENSE', action)}
                    style={{
                      backgroundColor: selectedActionType === 'DEFENSE' && selectedActionDetail === action ? 
                                     '#d97706' : 'white',
                      color: selectedActionType === 'DEFENSE' && selectedActionDetail === action ? 
                             'white' : '#1f2937',
                      border: '2px solid #e5e7eb',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Séparateur */}
        <div style={{
          width: '100%',
          height: '2px',
          backgroundColor: '#e5e7eb',
          margin: '20px 0',
        }} />

        {/* Bouton NEXT/VALIDATE */}
        <button
          onClick={handleNext}
          disabled={!canProceed}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: canProceed ? '#64748b' : '#94a3b8',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: canProceed ? 'pointer' : 'not-allowed',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.2s',
            marginBottom: '40px',
          }}
        >
          {currentStep === 1 ? 'NEXT → GREEN' : 'VALIDATE DOUBLE TOUCH'}
        </button>
      </div>
    </div>
  );
}
