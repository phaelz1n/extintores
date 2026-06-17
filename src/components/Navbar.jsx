import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Shield } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { formatCPF } from '../utils/formatters';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ backgroundColor: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="/logo.png" alt="Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
        <span style={{ fontWeight: '600', fontSize: '1.1rem', display: 'none' }} className="mobile-hide">
          Controle de Extintores
        </span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-color)' }}>{user?.name || 'Usuário'}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            CPF: {user?.cpf ? formatCPF(user.cpf) : ''} • {user?.role === 'admin' ? 'Admin' : 'Padrão'}
          </div>
        </div>
        
        {user?.role === 'admin' && (
          <Link to="/admin" className="btn-secondary" style={{ padding: '8px', border: 'none' }} title="Painel Admin">
            <Shield size={20} />
          </Link>
        )}
        
        <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px', border: 'none', color: 'var(--danger-color)' }} title="Sair">
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
