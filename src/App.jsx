import { useState } from 'react'
import './App.css'
import LoginPage from './LoginPage';
import WelcomePage from './WelcomePage';

import { supabase } from './supabaseClient';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erreur lors de la déconnexion:', error.message);
        return; // Ne pas changer l'état si la déconnexion échoue
      }
      setIsLoggedIn(false);
      // Nettoyage du stockage local si nécessaire
      localStorage.removeItem('tempUserData');
    } catch (error) {
      console.error('Erreur inattendue lors de la déconnexion:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100svh',
      width: '100vw',
      background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
      overflowX: 'hidden',
      boxSizing: 'border-box',
      padding: 0,
      margin: 0,
      position: 'relative',
    }}>
      {isLoggedIn ? (
        <WelcomePage onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={() => setIsLoggedIn(true)} />
      )}
      <style>{`
        html, body { margin: 0; padding: 0; overflow-x: hidden; background: none !important; }
      `}</style>
    </div>
  );
}

export default App;
