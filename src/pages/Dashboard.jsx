import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../services/supabase';
import { AlertTriangle, Download, Search, CheckCircle, XCircle } from 'lucide-react';
import { exportToExcel } from '../utils/excel';
import { formatDate } from '../utils/formatters';
import { addDays, isBefore, parseISO } from 'date-fns';

const Dashboard = () => {
  const [extinguishers, setExtinguishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expiringAlerts, setExpiringAlerts] = useState([]);

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
                  Veículo: <strong>{ext.vehicle_plate}</strong> (Prefixo: {ext.prefix}) - Vence em: {formatDate(ext.expiration_date)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="header" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Extintores Cadastrados</h2>
          
          <button 
            onClick={() => exportToExcel(extinguishers)}
            className="btn-secondary"
            style={{ fontSize: '0.9rem' }}
          >
            <Download size={18} />
            Baixar Relatório Excel
          </button>
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
              <div key={ext.id} className="list-item">
                <div className="list-item-header">
                  <div className="list-item-title">
                    Veículo: {ext.vehicle_plate}
                  </div>
                  {ext.is_full ? (
                    <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={12} /> Cheio
                    </span>
                  ) : (
                    <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <XCircle size={12} /> Usado/Vazio
                    </span>
                  )}
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
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
