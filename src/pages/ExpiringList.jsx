import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../services/supabase';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { formatDate, formatPlate } from '../utils/formatters';
import { addDays, isBefore, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const ExpiringList = () => {
  const [expiringAlerts, setExpiringAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExpiringExtinguishers();
  }, []);

  const fetchExpiringExtinguishers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('extinguishers')
      .select('*')
      .order('expiration_date', { ascending: true });

    if (error) {
      console.error('Error fetching data:', error);
    } else {
      const today = new Date();
      const thirtyDaysFromNow = addDays(today, 30);
      
      const expiring = data.filter(ext => {
        if (ext.serial_number.startsWith('PENDENTE-') || ext.has_extinguisher === false) return false;
        const expDate = parseISO(ext.expiration_date);
        return isBefore(expDate, thirtyDaysFromNow);
      });

      setExpiringAlerts(expiring);
    }
    setLoading(false);
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      <Navbar />
      
      <main className="app-container" style={{ maxWidth: '800px', marginTop: '20px' }}>
        <button 
          onClick={() => navigate('/')} 
          className="btn-secondary" 
          style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}
        >
          <ArrowLeft size={18} /> Voltar para o Dashboard
        </button>

        <div className="header" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle color="var(--danger-color)" /> Veículos com Extintores Vencidos ou Próximos
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Carregando lista...
          </div>
        ) : expiringAlerts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Nenhum veículo com extintor vencido ou próximo ao vencimento.
          </div>
        ) : (
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {expiringAlerts.map((ext, index) => (
                <li 
                  key={ext.id} 
                  style={{ 
                    padding: '16px', 
                    borderBottom: index < expiringAlerts.length - 1 ? '1px solid var(--border-color)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                    Veículo: {formatPlate(ext.vehicle_plate)} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'normal' }}>(Prefixo: {ext.prefix})</span>
                  </div>
                  <div style={{ fontSize: '0.95rem' }}>
                    <strong>Nº Série:</strong> {ext.serial_number}
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--danger-color)', fontWeight: 'bold' }}>
                    Vence em: {formatDate(ext.expiration_date)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
};

export default ExpiringList;
