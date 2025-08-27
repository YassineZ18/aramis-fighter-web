import React, { useState } from 'react';

const ACTIONS = [
  "Attaque Simple",
  "Attaque Composée",
  "Attaque avec Fer",
  "Contre-Temps",
  "Remise Attaque",
  "Contre-Attaque",
  "Attaque dans l'attaque",
  "Parade-Riposte",
  "Remise Riposte",
  "Retour en garde"
];

const initialTireur = {
  nom: '',
  club: '',
  main: '',
  poignee: '',
};

const initialScores = ACTIONS.reduce((acc, act) => {
  acc[act] = '';
  return acc;
}, {});

export default function FeuilleDeTouches() {
  const [tireurG, setTireurG] = useState({ ...initialTireur });
  const [tireurD, setTireurD] = useState({ ...initialTireur });
  const [scoresG, setScoresG] = useState({ ...initialScores });
  const [scoresD, setScoresD] = useState({ ...initialScores });
  const [vainqueur, setVainqueur] = useState('');
  const [score, setScore] = useState('');

  // Handlers
  function handleTireurChange(side, field, value) {
    if (side === 'G') setTireurG({ ...tireurG, [field]: value });
    else setTireurD({ ...tireurD, [field]: value });
  }
  function handleScoreChange(side, action, value) {
    if (side === 'G') setScoresG({ ...scoresG, [action]: value.replace(/\D/g, '') });
    else setScoresD({ ...scoresD, [action]: value.replace(/\D/g, '') });
  }

  function handleReset() {
    setTireurG({ ...initialTireur });
    setTireurD({ ...initialTireur });
    setScoresG({ ...initialScores });
    setScoresD({ ...initialScores });
    setVainqueur('');
    setScore('');
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, background: 'rgba(34,46,58,0.97)', borderRadius: 16, boxShadow: '0 8px 32px 0 rgba(56,189,248,0.10)' }}>
      <h2 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 12 }}>Feuille de touches</h2>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
        {/* Tireur G */}
        <div style={{ minWidth: 200, flex: 1 }}>
          <h4 style={{ color: '#ef4444' }}>Tireur G</h4>
          <input placeholder="Nom" value={tireurG.nom} onChange={e => handleTireurChange('G', 'nom', e.target.value)} style={inputStyle} />
          <input placeholder="Club" value={tireurG.club} onChange={e => handleTireurChange('G', 'club', e.target.value)} style={inputStyle} />
          <input placeholder="Main (G/D)" value={tireurG.main} onChange={e => handleTireurChange('G', 'main', e.target.value)} style={inputStyle} />
          <input placeholder="Poignée" value={tireurG.poignee} onChange={e => handleTireurChange('G', 'poignee', e.target.value)} style={inputStyle} />
        </div>
        {/* Tireur D */}
        <div style={{ minWidth: 200, flex: 1 }}>
          <h4 style={{ color: '#22c55e' }}>Tireur D</h4>
          <input placeholder="Nom" value={tireurD.nom} onChange={e => handleTireurChange('D', 'nom', e.target.value)} style={inputStyle} />
          <input placeholder="Club" value={tireurD.club} onChange={e => handleTireurChange('D', 'club', e.target.value)} style={inputStyle} />
          <input placeholder="Main (G/D)" value={tireurD.main} onChange={e => handleTireurChange('D', 'main', e.target.value)} style={inputStyle} />
          <input placeholder="Poignée" value={tireurD.poignee} onChange={e => handleTireurChange('D', 'poignee', e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(30,41,59,0.95)' }}>
          <thead>
            <tr>
              <th style={thStyle}></th>
              <th style={thStyle}>Tireur G</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Tireur D</th>
            </tr>
          </thead>
          <tbody>
            {ACTIONS.map(action => (
              <tr key={action}>
                <td style={tdStyle}><input style={scoreInputStyle} value={scoresG[action]} onChange={e => handleScoreChange('G', action, e.target.value)} /></td>
                <td style={{ ...tdStyle, color: '#cbd5e1', fontWeight: 500 }}>{action}</td>
                <td style={tdStyle}><input style={scoreInputStyle} value={scoresD[action]} onChange={e => handleScoreChange('D', action, e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <input placeholder="Vainqueur" value={vainqueur} onChange={e => setVainqueur(e.target.value)} style={{ ...inputStyle, flex: 2 }} />
        <input placeholder="Score (ex: 15-12)" value={score} onChange={e => setScore(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        <button style={btnStyle} onClick={handleReset}>Réinitialiser</button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  marginBottom: 6,
  padding: 8,
  borderRadius: 8,
  border: '1px solid #334155',
  background: '#1e293b',
  color: '#f1f5f9',
  fontSize: 15,
};
const thStyle = {
  padding: 8,
  background: '#334155',
  color: '#38bdf8',
  fontWeight: 700,
  border: '1px solid #475569',
};
const tdStyle = {
  padding: 6,
  textAlign: 'center',
  border: '1px solid #334155',
};
const scoreInputStyle = {
  width: 40,
  textAlign: 'center',
  borderRadius: 4,
  border: '1px solid #475569',
  background: '#0f172a',
  color: '#f1f5f9',
};
const btnStyle = {
  padding: '10px 20px',
  background: 'linear-gradient(90deg, #38bdf8 60%, #0ea5e9 100%)',
  color: '#222',
  border: 'none',
  borderRadius: 12,
  fontWeight: 700,
  fontSize: 16,
  boxShadow: '0 2px 16px 0 rgba(56,189,248,0.10)',
  cursor: 'pointer',
  marginLeft: 8,
};
