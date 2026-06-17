import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../services/supabase';
import { Plus, Trash2, Users, Edit, Activity, CheckCircle, XCircle } from 'lucide-react';
import { formatCPF, formatDate } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { user, updateUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'logs'
  const [logFilter, setLogFilter] = useState('ALL');

  // New user state
  const [newCpf, setNewCpf] = useState('');
  const [newName, setNewName] = useState('');
  const [userError, setUserError] = useState('');

  // Edit user state
  const [editingUser, setEditingUser] = useState(null);
  const [editCpf, setEditCpf] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('extinguisher_logs')
      .select('*, profiles(name, cpf)')
      .order('created_at', { ascending: false });
    if (data) setLogs(data);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserError('');
    const cleanCPF = newCpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) {
      setUserError('CPF inválido.');
      return;
    }

    const { error, data: newUserData } = await supabase.from('profiles').insert([{ cpf: cleanCPF, name: newName || 'Usuário', role: 'user' }]).select().single();
    
    if (error) {
      setUserError('Erro ao adicionar. O CPF já está cadastrado?');
    } else {
      if (user && newUserData) {
        await supabase.from('extinguisher_logs').insert([{
          user_id: user.id,
          action: 'USER_INSERT',
          details: { name: newUserData.name, cpf: newUserData.cpf, role: newUserData.role }
        }]);
      }
      setNewCpf('');
      setNewName('');
      fetchUsers();
    }
  };

  const handleDeleteUser = async (id, role) => {
    if (role === 'admin') {
      alert('Não é recomendado excluir administradores por aqui, mude o perfil deles primeiro.');
      return;
    }
    if (window.confirm('Excluir este usuário?')) {
      const deletedUser = users.find(u => u.id === id);
      await supabase.from('profiles').delete().eq('id', id);
      
      if (user && deletedUser) {
        await supabase.from('extinguisher_logs').insert([{
          user_id: user.id,
          action: 'USER_DELETE',
          details: { name: deletedUser.name, cpf: deletedUser.cpf, role: deletedUser.role }
        }]);
      }
      fetchUsers();
    }
  };

  const startEditUser = (user) => {
    setEditingUser(user);
    setEditCpf(user.cpf);
    setEditName(user.name);
    setEditRole(user.role);
    setEditError('');
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditError('');
    const cleanCPF = editCpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) {
      setEditError('CPF inválido.');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ cpf: cleanCPF, name: editName, role: editRole })
      .eq('id', editingUser.id);
      
    if (error) {
      setEditError('Erro ao atualizar. Verifique os dados.');
    } else {
      if (user) {
        await supabase.from('extinguisher_logs').insert([{
          user_id: user.id,
          action: 'USER_UPDATE',
          details: { 
            name: editName, cpf: cleanCPF, role: editRole, 
            old_name: editingUser.name, old_cpf: editingUser.cpf, old_role: editingUser.role 
          }
        }]);
      }

      if (user && editingUser.id === user.id) {
        updateUser({ cpf: cleanCPF, name: editName, role: editRole });
      }
      setEditingUser(null);
      fetchUsers();
    }
  };

  const filteredLogs = logs.filter(log => logFilter === 'ALL' || log.action === logFilter);

  return (
    <div style={{ paddingBottom: '40px' }}>
      <Navbar />
      
      <main className="app-container" style={{ maxWidth: '800px', marginTop: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <button 
            onClick={() => setActiveTab('users')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              color: activeTab === 'users' ? 'var(--primary-color)' : 'var(--text-muted)',
              fontWeight: activeTab === 'users' ? '600' : '400',
              fontSize: '1.2rem', background: 'none', border: 'none', cursor: 'pointer'
            }}
          >
            <Users size={24} />
            Gestão de Usuários
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              color: activeTab === 'logs' ? 'var(--primary-color)' : 'var(--text-muted)',
              fontWeight: activeTab === 'logs' ? '600' : '400',
              fontSize: '1.2rem', background: 'none', border: 'none', cursor: 'pointer'
            }}
          >
            <Activity size={24} />
            Logs do Sistema
          </button>
        </div>

        {activeTab === 'users' ? (
          <div>
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Adicionar Usuário</h3>
              {userError && <div className="alert alert-danger" style={{ padding: '8px', marginBottom: '16px' }}>{userError}</div>}
              <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="Nome do Usuário" 
                  required 
                  style={{ flex: 1, minWidth: '200px' }}
                />
                <input 
                  type="text" 
                  value={newCpf} 
                  onChange={(e) => setNewCpf(formatCPF(e.target.value))} 
                  placeholder="CPF: 000.000.000-00" 
                  maxLength={14}
                  required 
                  style={{ flex: 1, minWidth: '150px' }}
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
                    <div style={{ fontWeight: '600' }}>{u.name} <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', fontSize: '0.9rem' }}>({formatCPF(u.cpf)})</span></div>
                    <div style={{ fontSize: '0.85rem', color: u.role === 'admin' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: u.role === 'admin' ? 'bold' : 'normal' }}>
                      Função: {u.role === 'admin' ? 'Administrador' : 'Usuário Padrão'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => startEditUser(u)} className="btn-secondary" style={{ padding: '8px' }}>
                      <Edit size={16} />
                    </button>
                    {u.role !== 'admin' && (
                      <button onClick={() => handleDeleteUser(u.id, u.role)} className="btn-secondary" style={{ padding: '8px', color: 'var(--danger-color)' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h2>Histórico de Alterações em Extintores</h2>
              <select 
                value={logFilter} 
                onChange={(e) => setLogFilter(e.target.value)}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'inherit' }}
              >
                <option value="ALL">Todos os Registros</option>
                <option value="LOGIN">Entrada no Sistema</option>
                <option value="INSERT">Inclusão de Extintor</option>
                <option value="UPDATE">Alteração de Extintor</option>
                <option value="DELETE">Exclusão de Extintor</option>
                <option value="USER_INSERT">Inclusão de Usuário</option>
                <option value="USER_UPDATE">Alteração de Usuário</option>
                <option value="USER_DELETE">Exclusão de Usuário</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {filteredLogs.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  Nenhum log encontrado para este filtro.
                </div>
              ) : filteredLogs.map(log => (
                <div key={log.id} className="list-item" style={{ flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: log.action === 'INSERT' || log.action === 'USER_INSERT' ? 'var(--success-color)' : 
                             log.action === 'DELETE' || log.action === 'USER_DELETE' ? 'var(--danger-color)' : 
                             log.action === 'LOGIN' ? 'var(--primary-color)' : 'var(--warning-color)' 
                    }}>
                      {log.action === 'INSERT' ? 'INCLUSÃO DE EXTINTOR' : 
                       log.action === 'DELETE' ? 'EXCLUSÃO DE EXTINTOR' : 
                       log.action === 'UPDATE' ? 'ALTERAÇÃO DE EXTINTOR' : 
                       log.action === 'USER_INSERT' ? 'INCLUSÃO DE USUÁRIO' :
                       log.action === 'USER_DELETE' ? 'EXCLUSÃO DE USUÁRIO' :
                       log.action === 'USER_UPDATE' ? 'ALTERAÇÃO DE USUÁRIO' :
                       log.action === 'LOGIN' ? 'ENTRADA NO SISTEMA' : log.action}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.95rem' }}>
                    <strong>Usuário:</strong> {log.profiles ? log.profiles.name : 'Desconhecido'} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({log.profiles ? formatCPF(log.profiles.cpf) : ''})</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', marginTop: '4px', background: 'var(--surface-color)', padding: '8px', borderRadius: '4px' }}>
                    <strong>Detalhes:</strong>
                    {log.details ? (
                      <div style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {log.action === 'LOGIN' && log.details.message ? (
                          <span>{log.details.message}</span>
                        ) : log.action === 'DELETE' ? (
                          <span>Veículo: {log.details.plate} | Prefixo: {log.details.prefix} | Nº Série: {log.details.serial}</span>
                        ) : log.action === 'USER_DELETE' || log.action === 'USER_INSERT' ? (
                          <span>Nome: {log.details.name} | CPF: {formatCPF(log.details.cpf || '')} | Função: {log.details.role === 'admin' ? 'Admin' : 'Padrão'}</span>
                        ) : log.action === 'USER_UPDATE' ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                            <div><strong>Nome Antigo:</strong> {log.details.old_name}</div>
                            <div><strong>Nome Novo:</strong> {log.details.name}</div>
                            <div><strong>Função Antiga:</strong> {log.details.old_role === 'admin' ? 'Admin' : 'Padrão'}</div>
                            <div><strong>Função Nova:</strong> {log.details.role === 'admin' ? 'Admin' : 'Padrão'}</div>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                            {log.details.vehicle_plate && <div><strong>Placa:</strong> {log.details.vehicle_plate}</div>}
                            {log.details.prefix && <div><strong>Prefixo:</strong> {log.details.prefix}</div>}
                            {log.details.serial_number && <div><strong>Nº Série:</strong> {log.details.serial_number}</div>}
                            {log.details.expiration_date && <div><strong>Vencimento:</strong> {new Date(log.details.expiration_date).toLocaleDateString('pt-BR')}</div>}
                            {log.details.is_full !== undefined && <div><strong>Status:</strong> {log.details.is_full ? 'Cheio' : 'Usado'}</div>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> Sem detalhes</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de Edição de Usuário */}
        {editingUser && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Editar Usuário</h2>
                <button onClick={() => setEditingUser(null)} style={{ fontSize: '1.5rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
              </div>

              {editError && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{editError}</div>}

              <form onSubmit={handleEditUser}>
                <div className="form-group">
                  <label>Nome do Usuário</label>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>CPF</label>
                  <input 
                    type="text" 
                    value={editCpf} 
                    onChange={(e) => setEditCpf(formatCPF(e.target.value))} 
                    maxLength={14}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Função</label>
                  <select 
                    value={editRole} 
                    onChange={(e) => setEditRole(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                  >
                    <option value="user">Usuário Padrão</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary" style={{ flex: 1 }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
