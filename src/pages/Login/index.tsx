import './styles.css';

import React, { useState } from 'react';

import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 1. Inicializamos os hooks aqui
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 2. Usamos o signIn do contexto (ele já gerencia o token por debaixo dos panos)
      await signIn(email, password);
      
      // 3. Redirecionamos para a Visão Geral após o sucesso
      navigate('/'); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h3 className="login-logo">Controle de Estoque</h3>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          
          <div className="mb-3">
            <label htmlFor="emailInput" className="form-label">E-mail</label>
            <input 
              type="email" 
              className="form-control" 
              id="emailInput" 
              placeholder="admin@sistema.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="passwordInput" className="form-label">Senha</label>
            <input 
              type="password" 
              className="form-control" 
              id="passwordInput"
              placeholder="******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-100" 
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}