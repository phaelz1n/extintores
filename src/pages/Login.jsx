import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { formatCPF } from '../utils/formatters';

const Login = () => {
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');
  const { loginWithCPF } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (cpf.replace(/\D/g, '').length !== 11) {
      setError('CPF inválido. Digite 11 números.');
      return;
    }

    const result = await loginWithCPF(cpf);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '150px', height: 'auto', marginBottom: '16px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Controle de Inspeções</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Acesso ao sistema interno</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="cpf">Seu CPF</label>
            <input 
              id="cpf"
              type="text" 
              placeholder="000.000.000-00" 
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              maxLength={14}
              required
            />
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
