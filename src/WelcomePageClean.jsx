import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './responsive.css';

// Icônes SVG
const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StatsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function WelcomePage({ onLogout }) {
  const [prenom, setPrenom] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleCardClick = (action) => {
    switch(action) {
      case 'new':
        window.location.href = '/nouveau-match';
        break;
      case 'files':
        window.location.href = '/mes-fichiers';
        break;
      case 'stats':
        window.location.href = '/statistiques';
        break;
      default:
        break;
    }
  };

  // Style du logo
  const logoStyle = {
    textAlign: 'center',
    marginBottom: isMobile ? '24px' : '32px',
    paddingTop: isMobile ? '16px' : '24px',
  };

  // Style du titre principal
  const titleStyle = {
    fontSize: isMobile ? '24px' : '28px',
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: '8px'
  };

  // Style du sous-titre
  const subtitleStyle = {
    fontSize: isMobile ? '14px' : '16px',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: '32px'
  };

  // Style du conteneur des cartes
  const cardsContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '0 16px',
    maxWidth: '500px',
    margin: '0 auto'
  };

  // Style pour une carte de fonctionnalité
  const featureCardStyle = (bgColor) => ({
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto 20px',
    padding: '24px',
    backgroundColor: bgColor,
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '1px solid #e2e8f0',
    color: bgColor === '#3b82f6' ? 'white' : '#1e293b',
  });

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f8fafc',
      padding: isMobile ? '0 16px 20px' : '0 20px 40px',
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      {/* Bouton de déconnexion en haut à droite */}
      <button
        onClick={onLogout}
        style={{
          position: 'fixed',
          top: isMobile ? '16px' : '24px',
          right: isMobile ? '16px' : '24px',
          padding: isMobile ? '8px 12px' : '10px 16px',
          backgroundColor: 'white',
          color: '#ef4444',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          fontWeight: '600',
          fontSize: isMobile ? '14px' : '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          zIndex: 100,
          transition: 'all 0.2s',
        }}
      >
        <LogoutIcon />
        <span>Déconnexion</span>
      </button>
      
      <div style={{
        maxWidth: '480px',
        margin: '0 auto',
        paddingTop: isMobile ? '20px' : '40px',
      }}>
        {/* Logo */}
        <div style={logoStyle}>
          <div style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: '900', color: '#1e293b', marginBottom: '4px' }}>
            ARAMIS
          </div>
          <div style={{ 
            fontSize: isMobile ? '32px' : '40px', 
            fontWeight: '900', 
            color: '#3b82f6',
            position: 'relative',
            display: 'inline-block'
          }}>
            FIGHTER
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: '100%',
              height: '4px',
              backgroundColor: '#3b82f6',
              borderRadius: '2px'
            }} />
          </div>
        </div>

        {/* Titre et sous-titre */}
        <h1 style={titleStyle}>
          Bonjour{prenom ? ` ${prenom}` : ''} !
        </h1>
        <p style={subtitleStyle}>
          Que souhaitez-vous faire aujourd'hui ?
        </p>

        {/* Cartes de fonctionnalités */}
        <div style={cardsContainerStyle}>
          {/* Carte Nouveau match */}
          <div 
            style={featureCardStyle('#3b82f6')}
            onClick={() => handleCardClick('new')}
          >
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}>
              <PlusIcon style={{ color: 'white' }} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '16px 0 8px', color: 'white' }}>Nouveau match</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
              Créer une nouvelle feuille de match
            </p>
          </div>

          {/* Carte Mes fichiers */}
          <div 
            style={featureCardStyle('white')}
            onClick={() => handleCardClick('files')}
          >
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#e0f2fe',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}>
              <FileIcon style={{ color: '#0ea5e9' }} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '16px 0 8px', color: '#1e293b' }}>Mes fichiers</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Accéder à mes feuilles de touches
            </p>
          </div>

          {/* Carte Statistiques */}
          <div 
            style={featureCardStyle('white')}
            onClick={() => handleCardClick('stats')}
          >
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#f0fdf4',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}>
              <StatsIcon style={{ color: '#10b981' }} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '16px 0 8px', color: '#1e293b' }}>Statistiques</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Consulter mes statistiques
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
