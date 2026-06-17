import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../services/supabase';
import ExtinguisherForm from '../components/ExtinguisherForm';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { formatDate, formatCPF } from '../utils/formatters';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('extinguishers'); // 'extinguishers' | 'users'
  
  // Extinguishers State
  const [extinguishers, setExtinguishers] = useState([]);
  const [showExtForm, setShowExtForm] = useState(false);
  const [editingExt, setEditingExt] = useState(null);
  
  // Users State
  const [users, setUsers] = useState([]);
  const [newCpf, setNewCpf] = useState('');
  const [userError, setUserError] = useState('');

  useEffect(() => {
    if (activeTab === 'extinguishers') {
      fetchExtinguishers();
    } else {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchExtinguishers = async () => {
    const { data } = await supabase.from('extinguishers').select('*').order('created_at', { ascending: false });
    if (data) setExtinguishers(data);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  const handleDeleteExtinguisher = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      await supabase.from('extinguishers').delete().eq('id', id);
      fetchExtinguishers();
    }
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
          <button 
            className={`btn-secondary ${activeTab === 'extinguishers' ? 'active-tab' : ''}`}
            style={{ borderColor: activeTab === 'extinguishers' ? 'var(--primary-color)' : 'var(--border-color)', color: activeTab === 'extinguishers' ? 'var(--primary-color)' : 'inherit' }}
            onClick={() => setActiveTab('extinguishers')}
          >
            Gestão de Extintores
          </button>
          <button 
            className={`btn-secondary ${activeTab === 'users' ? 'active-tab' : ''}`}
            style={{ borderColor: activeTab === 'users' ? 'var(--primary-color)' : 'var(--border-color)', color: activeTab === 'users' ? 'var(--primary-color)' : 'inherit' }}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            Gestão de Usuários
          </button>
        </div>

        {activeTab === 'extinguishers' && (
          <div>
            <div className="header">
              <h2>Extintores</h2>
              <button className="btn-primary" style={{ width: 'auto' }} onClick={() => { setEditingExt(null); setShowExtForm(true); }}>
                <Plus size={18} /> Novo Extintor
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {extinguishers.map(ext => (
                <div key={ext.id} className="list-item" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{ext.vehicle_plate} - {ext.prefix}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Série: {ext.serial_number} | Vence: {formatDate(ext.expiration_date)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setEditingExt(ext); setShowExtForm(true); }} className="btn-secondary" style={{ padding: '8px' }}>
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteExtinguisher(ext.id)} className="btn-secondary" style={{ padding: '8px', color: 'var(--danger-color)' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
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
        )}

        {showExtForm && (
          <ExtinguisherForm 
            extinguisher={editingExt} 
            onSave={() => { setShowExtForm(false); fetchExtinguishers(); }} 
            onCancel={() => setShowExtForm(false)} 
          />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
