import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../services/supabase';
import { Plus, Trash2, Users } from 'lucide-react';
import { formatCPF } from '../utils/formatters';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [newCpf, setNewCpf] = useState('');
  const [userError, setUserError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserError('');
    const cleanCPF = newCpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) {
      setUserError('CPF inválido.');
      return;
    }

    const { error } = await supabase.from('profiles').insert([{ cpf: cleanCPF, role: 'user' }]);
    
    if (error) {
      setUserError('Erro ao adicionar. O CPF já está cadastrado?');
    } else {
      setNewCpf('');
      fetchUsers();
    }
  };

  const handleDeleteUser = async (id, role) => {
    if (role === 'admin') {
      alert('Não é possível excluir o administrador padrão.');
      return;
    }
    if (window.confirm('Excluir este usuário?')) {
      await supabase.from('profiles').delete().eq('id', id);
      fetchUsers();
    }
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      <Navbar />
      
      <main className="app-container" style={{ maxWidth: '800px', marginTop: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontWeight: '600', fontSize: '1.2rem' }}>
            <Users size={24} />
            Gestão de Usuários
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Adicionar Usuário (Acesso CPF)</h3>
            {userError && <div className="alert alert-danger" style={{ padding: '8px', marginBottom: '16px' }}>{userError}</div>}
            <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                value={newCpf} 
                onChange={(e) => setNewCpf(formatCPF(e.target.value))} 
                placeholder="000.000.000-00" 
                maxLength={14}
                required 
              />
              <button type="submit" className="btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap' }}>
                <Plus size={18} /> Adicionar
              </button>
            </form>
          </div>

          <div className="header">
            <h2>Usuários Cadastrados</h2>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {users.map(u => (
              <div key={u.id} className="list-item" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{formatCPF(u.cpf)}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Função: {u.role === 'admin' ? 'Administrador' : 'Usuário Padrão'}</div>
                </div>
                {u.role !== 'admin' && (
                  <button onClick={() => handleDeleteUser(u.id, u.role)} className="btn-secondary" style={{ padding: '8px', color: 'var(--danger-color)' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
