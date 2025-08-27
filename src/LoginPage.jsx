import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { setSecureItem, getSecureItem, removeSecureItem, validateAndSanitize } from './secureStorage';
import { createSecureSession, validateSession } from './sessionManager';
import { logger } from './performanceOptimizer';
import './responsive.css';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Inscription (simplifié - email + mot de passe uniquement)
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState(null);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Affichage : login ou signup ?
  const [showSignup, setShowSignup] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!supabase) {
        // Mode local sans Supabase
        console.log('Mode local: connexion simulée');
        onLogin();
        return;
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        // Utiliser uniquement les profils locaux - pas d'appel à Supabase profiles
        const userId = data.user.id;
        
        // Vérifier s'il y a des données en attente d'inscription (chiffrées)
        const pendingProfile = getSecureItem('pendingProfile');
        if (pendingProfile && pendingProfile.nom && pendingProfile.prenom && pendingProfile.club_id && pendingProfile.type) {
          // Créer le profil local avec les données d'inscription
          const localProfile = {
            id: userId,
            nom: validateAndSanitize.text(pendingProfile.nom),
            prenom: validateAndSanitize.text(pendingProfile.prenom),
            club_id: pendingProfile.club_id,
            type: pendingProfile.type,
            is_admin_validated: false
          };
          
          // Créer une session sécurisée
          createSecureSession(userId, localProfile);
          removeSecureItem('pendingProfile');
        } else {
          // Créer une session même sans profil complet
          createSecureSession(userId, { id: userId });
        }
        
        onLogin && onLogin(data?.user);
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError(null);
    setSignupSuccess(false);
    
    logger.debug('Tentative d\'inscription avec:', { email: signupEmail, passwordLength: signupPassword?.length });
    
    // Validation sécurisée des entrées
    const emailValid = validateAndSanitize.email(signupEmail);
    const passwordValid = validateAndSanitize.password(signupPassword);
    
    logger.debug('Validation:', { emailValid, passwordValid });
    
    if (!emailValid) {
      logger.warn('Email invalide:', signupEmail);
      setSignupError('Format d\'email invalide');
      setSignupLoading(false);
      return;
    }
    
    if (!passwordValid) {
      logger.warn('Mot de passe invalide, longueur:', signupPassword?.length);
      setSignupError('Le mot de passe doit contenir au moins 8 caractères');
      setSignupLoading(false);
      return;
    }
    
    try {
      if (!supabase) {
        // Mode local sans Supabase
        console.log('Mode local: inscription simulée');
        onLogin();
        return;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
      });
      
      setSignupLoading(false);
      if (error) {
        setSignupError(error.message);
      } else {
        // Inscription réussie - la configuration du profil se fera après la première connexion
        setSignupSuccess(true);
        setSignupEmail('');
        setSignupPassword('');
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      setSignupError('Erreur lors de l\'inscription');
      setSignupLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(false);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
    setForgotLoading(false);
    if (error) {
      setForgotError(error.message);
    } else {
      setForgotSuccess(true);
      setForgotEmail('');
    }
  };

  const [maxCardWidth, setMaxCardWidth] = useState(window.innerWidth >= 900 ? 800 : '95vw');
  const [minCardHeight, setMinCardHeight] = useState(window.innerWidth >= 900 ? 350 : 0);
  const [titleFontSize, setTitleFontSize] = useState(window.innerWidth >= 900 ? 2.5 : 1.6);
  const [descFontSize, setDescFontSize] = useState(window.innerWidth >= 900 ? 1.15 : 1);
  const [pad, setPad] = useState(window.innerWidth >= 900 ? '48px 48px 40px 48px' : 'clamp(20px, 5vw, 32px)');
  useEffect(() => {
    function handleResize() {
      const isDesktop = window.innerWidth >= 900;
      setMaxCardWidth(isDesktop ? 800 : '95vw');
      setMinCardHeight(isDesktop ? 350 : 0);
      setTitleFontSize(isDesktop ? 2.5 : 1.6);
      setDescFontSize(isDesktop ? 1.15 : 1);
      setPad(isDesktop ? '48px 48px 40px 48px' : 'clamp(20px, 5vw, 32px)');
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      minHeight: '100svh',
      minHeight: '100vh', // fallback
      width: '100vw',
      background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflowY: 'auto',
      overflowX: 'hidden',
      boxSizing: 'border-box',
      padding: 'max(2vw, 8px)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: maxCardWidth,
        minHeight: minCardHeight,
        margin: '0 auto',
        background: 'rgba(34,46,58,0.97)',
        borderRadius: 16,
        boxShadow: '0 8px 32px 0 rgba(56,189,248,0.10)',
        padding: pad,
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{ color: '#38bdf8', fontSize: `${titleFontSize}rem`, fontWeight: 800, letterSpacing: 2, margin: 0 }}>Aramis Fighter App</h1>
          <div style={{ color: '#cbd5e1', fontSize: `${descFontSize}rem`, marginTop: 10, fontWeight: 400 }}>
            Analyse et gestion des assauts d'escrimeurs
          </div>
        </div>
        {showForgot ? (
          <>
            <h2 style={{ textAlign: 'center', color: '#38bdf8', fontWeight: 700 }}>Mot de passe oublié</h2>
            <form onSubmit={handleForgot}>
              <div style={{ marginBottom: 16 }}>
                <label>Email<br />
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
                </label>
              </div>
              {forgotError && <div style={{ color: 'salmon', marginBottom: 12 }}>{forgotError}</div>}
              {forgotSuccess && <div style={{ color: 'lightgreen', marginBottom: 12 }}>Un email de réinitialisation a été envoyé !</div>}
              <button type="submit" style={{ width: '100%', padding: 10, background: '#38bdf8', color: '#222', border: 'none', borderRadius: 4 }} disabled={forgotLoading}>
                {forgotLoading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </form>
            <div style={{ marginTop: 18, textAlign: 'center' }}>
              <a href="#" style={{ color: '#38bdf8', textDecoration: 'underline' }} onClick={() => setShowForgot(false)}>
                Retour à la connexion
              </a>
            </div>
          </>
        ) : showSignup ? (
          <>
            <h2 style={{ textAlign: 'center', color: '#38bdf8', fontWeight: 700 }}>Inscription</h2>
            <form onSubmit={handleSignup}>
              <div style={{ marginBottom: 16 }}>
                <label>Email<br />
                  <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
                </label>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Mot de passe<br />
                  <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
                </label>
              </div>
              {signupError && <div style={{ color: 'salmon', marginBottom: 12 }}>{signupError}</div>}
              {signupSuccess && <div style={{ color: 'lightgreen', marginBottom: 12 }}>Inscription réussie ! Vérifie tes emails pour valider le compte.</div>}
              <button type="submit" style={{ width: '100%', padding: 10, background: '#38bdf8', color: '#222', border: 'none', borderRadius: 4 }} disabled={signupLoading}>
                {signupLoading ? 'Inscription...' : "S'inscrire"}
              </button>
            </form>
            <div style={{ marginTop: 18, textAlign: 'center' }}>
              <a href="#" style={{ color: '#38bdf8', textDecoration: 'underline' }} onClick={() => setShowSignup(false)}>
                Déjà un compte ? Connexion
              </a>
            </div>
          </>
        ) : (
          <>
            <h2>Connexion</h2>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 16 }}>
                <label>Email<br />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
                </label>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Mot de passe<br />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
                </label>
              </div>
              {error && <div style={{ color: 'salmon', marginBottom: 12 }}>{error}</div>}
              <button type="submit" style={{ width: '100%', padding: 10, background: '#38bdf8', color: '#222', border: 'none', borderRadius: 4 }} disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
            <div style={{ marginTop: 18, textAlign: 'center' }}>
              <a href="#" style={{ color: '#38bdf8', textDecoration: 'underline', marginRight: 10 }} onClick={() => setShowSignup(true)}>
                Créer un compte
              </a>
              <a href="#" style={{ color: '#38bdf8', textDecoration: 'underline' }} onClick={() => setShowForgot(true)}>
                Mot de passe oublié ?
              </a>
            </div>
          </>
        )}
      </div>
      {/* Style global pour éviter tout débordement */}
      <style>{`
        html, body { margin: 0; padding: 0; overflow-x: hidden; background: none !important; }
      `}</style>
    </div>
  );
}
