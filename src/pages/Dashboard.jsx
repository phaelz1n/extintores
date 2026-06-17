import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../services/supabase';
import { AlertTriangle, Download, Search, CheckCircle, XCircle, Plus, Edit, Trash2 } from 'lucide-react';
import ExtinguisherForm from '../components/ExtinguisherForm';
import { exportToExcel } from '../utils/excel';
import { formatDate, formatPlate } from '../utils/formatters';
import { addDays, isBefore, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [extinguishers, setExtinguishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expiringAlerts, setExpiringAlerts] = useState([]);
  const [showExtForm, setShowExtForm] = useState(false);
  const [editingExt, setEditingExt] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchExtinguishers();
  }, []);

  const fetchExtinguishers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('extinguishers')
      .select('*')
      .order('expiration_date', { ascending: true });

    if (error) {
      console.error('Error fetching data:', error);
    } else {
      setExtinguishers(data);
      checkExpirations(data);
    }
    setLoading(false);
  };

  const checkExpirations = (data) => {
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);
    
    const expiring = data.filter(ext => {
      const expDate = parseISO(ext.expiration_date);
      // is expiring in less than 30 days or already expired
      return isBefore(expDate, thirtyDaysFromNow);
    });

    setExpiringAlerts(expiring);
  };

  const handleDeleteExtinguisher = async (ext) => {
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      await supabase.from('extinguishers').delete().eq('id', ext.id);
      
      if (user) {
        await supabase.from('extinguisher_logs').insert([{
          extinguisher_id: ext.id,
          user_id: user.id,
          action: 'DELETE',
          details: { plate: ext.vehicle_plate, prefix: ext.prefix, serial: ext.serial_number }
        }]);
      }

      fetchExtinguishers();
    }
  };

  const filteredExtinguishers = extinguishers.filter(ext => 
    ext.vehicle_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ext.prefix.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ext.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: '40px' }}>
      <Navbar />
      
      <main className="app-container" style={{ maxWidth: '800px', marginTop: '20px' }}>
        
        {expiringAlerts.length > 0 && (
          <div className="alert alert-danger" style={{ flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '8px' }}>
              <AlertTriangle size={20} />
              Atenção! Extintores vencidos ou próximos ao vencimento:
            </div>
            <ul style={{ paddingLeft: '24px', margin: 0, fontSize: '0.9rem' }}>
              {expiringAlerts.map(ext => (
                <li key={ext.id} style={{ marginBottom: '4px' }}>
                  Veículo: <strong>{formatPlate(ext.vehicle_plate)}</strong> (Prefixo: {ext.prefix}) - Vence em: {formatDate(ext.expiration_date)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="header" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Extintores Cadastrados</h2>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className="btn-primary" 
              style={{ width: 'auto', fontSize: '0.9rem' }} 
              onClick={() => { setEditingExt(null); setShowExtForm(true); }}
            >
              <Plus size={18} /> Novo Extintor
            </button>
            <button 
              onClick={() => exportToExcel(extinguishers)}
              className="btn-secondary"
              style={{ fontSize: '0.9rem' }}
            >
              <Download size={18} />
              Baixar Relatório
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
          <input 
            type="text" 
            placeholder="Buscar por placa, prefixo ou nº série..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Carregando extintores...
          </div>
        ) : filteredExtinguishers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Nenhum extintor encontrado.
          </div>
        ) : (
          <div>
            {filteredExtinguishers.map(ext => (
              <div key={ext.id} className="list-item" style={{ position: 'relative' }}>
                <div className="list-item-header">
                  <div className="list-item-title">
                    Veículo: {formatPlate(ext.vehicle_plate)}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {ext.is_full ? (
                      <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={12} /> Cheio
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={12} /> Usado
                      </span>
                    )}
                  </div>
                </div>
                <div className="list-item-details">
                  <div className="detail-row">
                    <strong>Prefixo:</strong> {ext.prefix}
                  </div>
                  <div className="detail-row">
                    <strong>Nº Série:</strong> {ext.serial_number}
                  </div>
                  <div className="detail-row">
                    <strong>Vencimento:</strong> 
                    <span style={{ 
                      color: expiringAlerts.some(a => a.id === ext.id) ? 'var(--danger-color)' : 'inherit',
                      fontWeight: expiringAlerts.some(a => a.id === ext.id) ? 'bold' : 'normal'
                    }}>
                      {formatDate(ext.expiration_date)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <button onClick={() => { setEditingExt(ext); setShowExtForm(true); }} className="btn-secondary" style={{ flex: 1, padding: '8px' }}>
                    <Edit size={16} /> Editar
                  </button>
                  <button onClick={() => handleDeleteExtinguisher(ext)} className="btn-secondary" style={{ flex: 1, padding: '8px', color: 'var(--danger-color)' }}>
                    <Trash2 size={16} /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showExtForm && (
          <ExtinguisherForm 
            extinguisher={editingExt} 
            user={user}
            onSave={() => { setShowExtForm(false); fetchExtinguishers(); }} 
            onCancel={() => setShowExtForm(false)} 
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
