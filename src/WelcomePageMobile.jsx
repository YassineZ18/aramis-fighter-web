import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Icône de déconnexion
const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function WelcomePage({ onLogout }) {
  const [prenom, setPrenom] = useState('');

  useEffect(() => {
    async function fetchPrenom() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('prenom')
          .eq('id', user.id)
          .single();
        if (data?.prenom) setPrenom(data.prenom);
      }
    }
    fetchPrenom();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f8fafc',
      padding: '0 20px',
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      {/* Bouton de déconnexion en haut à droite */}
      <button
        onClick={onLogout}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '10px 16px',
          backgroundColor: 'white',
          color: '#ef4444',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 100,
        }}
      >
        <LogoutIcon />
        <span>Déconnexion</span>
      </button>
      
      {/* Contenu principal centré */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        paddingTop: '60px', // Espace pour le bouton de déconnexion
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '16px',
          lineHeight: '1.2',
        }}>
          Bienvenue sur<br />Aramis Fighter{prenom ? `,<br />${prenom}` : ''} !
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          marginBottom: '0',
          maxWidth: '300px',
          lineHeight: '1.5',
        }}>
          Vous êtes connecté avec succès.
        </p>
      </div>
    </div>
  );
}
