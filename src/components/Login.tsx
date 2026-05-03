import React, { useState } from 'react';

interface LoginProps {
  onLogin: (number: string, password: string, initialDrawer: number) => void;
  translations: {
    login: string;
    number: string;
    password: string;
    initialDrawer: string;
  };
}

const Login: React.FC<LoginProps> = ({ onLogin, translations }) => {
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
      <h2>{translations.login}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>{translations.number}:</label>
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label>{translations.password}:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
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
  );
};

export default Login;