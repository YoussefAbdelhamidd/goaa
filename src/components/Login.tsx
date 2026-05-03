import React, { useState } from 'react';
import bannerImage from '../assets/banner.png';

interface LoginProps {
  onLogin: (number: string, password: string, initialDrawer: number) => void;
  onToggleLanguage: () => void;
  language: 'en' | 'ar';
  translations: {
    login: string;
    number: string;
    password: string;
    initialDrawer: string;
  };
}

const Login: React.FC<LoginProps> = ({ onLogin, onToggleLanguage, language, translations }) => {
  const [number, setNumber] = useState('');
  const [password, setPassword] = useState('');
  const [initialDrawer, setInitialDrawer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (number && password && initialDrawer) {
      const drawerAmount = parseFloat(initialDrawer);
      if (!isNaN(drawerAmount) && drawerAmount >= 0) {
        onLogin(number, password, drawerAmount);
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
        <div className="login-card-header">
          <h2>{translations.login}</h2>
          <p>Enter your cashier credentials to start your shift.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label>{translations.number}:</label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
            />
          </div>
          <div className="login-field">
            <label>{translations.password}:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <button type="submit">{translations.login}</button>
        </form>
      </div>
    </div>
  );
};

export default Login;