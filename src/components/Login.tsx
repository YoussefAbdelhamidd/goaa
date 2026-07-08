import React, { useState } from 'react';
import bannerImage from '../assets/banner.png';
import logo from '../assets/Main logo.png';

interface LoginProps {
  onLogin: (username: string, password: string, initialDrawer: number) => boolean;
  onToggleLanguage: () => void;
  language: 'en' | 'ar';
  translations: {
    login: string;
    number: string;
    password: string;
    initialDrawer: string;
  };
  onAdminClick: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onToggleLanguage, language, translations, onAdminClick }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [initialDrawer, setInitialDrawer] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password && initialDrawer) {
      const drawerAmount = parseFloat(initialDrawer);
      if (!isNaN(drawerAmount) && drawerAmount >= 0) {
        const success = onLogin(username, password, drawerAmount);
        setError(!success);
      }
    }
  };

  return (
    <div className="login">
      <button onClick={onToggleLanguage} className="login-lang-toggle">
        {language === 'en' ? 'AR' : 'EN'}
      </button>
      <div className="login-hero">
        <img src={bannerImage} alt="Gooba banner" className="login-banner" />
      </div>

      <div className="login-card">
        <div className="login-brand-mark">
          <img src={logo} alt="Gooba" />
          <div>
            <span>Gooba POS</span>
            <strong>Shift Login</strong>
          </div>
        </div>
        <div className="login-card-header">
          <h2>{translations.login}</h2>
          <p>Enter your cashier credentials to start your shift.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label>{translations.number}:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(false);
              }}
              required
            />
          </div>
          <div className="login-field">
            <label>{translations.password}:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              required
            />
          </div>
          <div className="login-field">
            <label>{translations.initialDrawer}:</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={initialDrawer}
              onChange={(e) => setInitialDrawer(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          {error && <p className="login-error">Invalid username or password.</p>}
          <button type="submit">{translations.login}</button>
        </form>
        <button type="button" className="admin-link" onClick={onAdminClick}>
          Admin
        </button>
      </div>
    </div>
  );
};

export default Login;
