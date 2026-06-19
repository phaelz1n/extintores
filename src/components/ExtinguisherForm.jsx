import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { formatPlate } from '../utils/formatters';
import vehiclesData from '../data/vehicles.json';

const ExtinguisherForm = ({ extinguisher, user, onSave, onCancel }) => {
  const [formData, setFormData] = useState(() => {
    if (extinguisher) {
      const isPending = extinguisher.serial_number && extinguisher.serial_number.startsWith('PENDENTE-');
      return {
        ...extinguisher,
        serial_number: isPending ? '' : extinguisher.serial_number,
        expiration_date: isPending ? '' : extinguisher.expiration_date,
        has_extinguisher: isPending ? true : (extinguisher.has_extinguisher ?? true),
        has_metroplan_seal: isPending ? false : extinguisher.has_metroplan_seal,
        is_full: isPending ? true : extinguisher.is_full
      };
    }
    return {
      vehicle_plate: '',
      prefix: '',
      serial_number: '',
      expiration_date: '',
      is_full: true,
      has_metroplan_seal: false,
      has_extinguisher: true
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let finalValue = type === 'checkbox' ? checked : value;
    if (name === 'vehicle_plate') {
      finalValue = formatPlate(value);
      
      if (finalValue) {
        const filtered = vehiclesData.filter(v => 
          v.plate.replace(/[^A-Z0-9]/ig, '').toLowerCase().includes(finalValue.replace(/[^A-Z0-9]/ig, '').toLowerCase()) || 
          v.prefix.toLowerCase().includes(finalValue.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 10));
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleSelectSuggestion = (vehicle) => {
    setFormData(prev => ({
      ...prev,
      vehicle_plate: vehicle.plate,
      prefix: vehicle.prefix
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let finalData = { ...formData };
      const vehiclePlateUpper = finalData.vehicle_plate.toUpperCase();

      // Verificar duplicidade de placa
      let query = supabase
        .from('extinguishers')
        .select('id')
        .eq('vehicle_plate', vehiclePlateUpper);
        
      if (extinguisher && extinguisher.id) {
        query = query.neq('id', extinguisher.id);
      }

      const { data: existingPlates, error: checkError } = await query;
      if (checkError) throw checkError;
      
      if (existingPlates && existingPlates.length > 0) {
        setError('Já existe uma inspeção cadastrada para esta placa. Edite o cadastro existente.');
        setLoading(false);
        return;
      }
      
      if (!finalData.has_extinguisher) {
        finalData.serial_number = `SEM EXTINTOR - ${vehiclePlateUpper}`;
        finalData.expiration_date = '2099-12-31';
        finalData.is_full = false;
      } else if (!finalData.serial_number || finalData.serial_number.trim() === '') {
        finalData.serial_number = `ILEGÍVEL - ${vehiclePlateUpper}`;
      }

      const dataToSave = {
        ...finalData,
        vehicle_plate: vehiclePlateUpper,
        updated_at: new Date().toISOString()
      };

      if (extinguisher && extinguisher.id) {
        // Update
        const { error: updateError } = await supabase
          .from('extinguishers')
          .update(dataToSave)
          .eq('id', extinguisher.id);
        
        if (updateError) throw updateError;

        if (user) {
          await supabase.from('extinguisher_logs').insert([{
            extinguisher_id: extinguisher.id,
            user_id: user.id,
            action: 'UPDATE',
            details: dataToSave
          }]);
        }
      } else {
        // Insert
        const { data: insertedData, error: insertError } = await supabase
          .from('extinguishers')
          .insert([dataToSave])
          .select()
          .single();
          
        if (insertError) throw insertError;

        if (user && insertedData) {
          await supabase.from('extinguisher_logs').insert([{
            extinguisher_id: insertedData.id,
            user_id: user.id,
            action: 'INSERT',
            details: dataToSave
          }]);
        }
      }
      
      onSave();
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar. Verifique se o número de série ou placa já existem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
            {extinguisher ? 'Editar Cadastro' : 'Novo Cadastro'}
          </h2>
          <button onClick={onCancel} style={{ fontSize: '1.5rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          
          <div className="form-group" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--surface-color)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <input 
              type="checkbox" 
              name="has_extinguisher" 
              checked={formData.has_extinguisher} 
              onChange={handleChange} 
              id="has_extinguisher_checkbox"
              style={{ width: 'auto' }}
            />
            <label htmlFor="has_extinguisher_checkbox" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold' }}>Veículo possui extintor?</label>
          </div>

          <div className="flex-gap">
            <div className="form-group" style={{ flex: 1, position: 'relative' }} ref={wrapperRef}>
              <label>Placa do Veículo</label>
              <input 
                type="text" 
                name="vehicle_plate" 
                value={formData.vehicle_plate} 
                onChange={handleChange} 
                placeholder="ABC-1234"
                required 
                maxLength={10}
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, 
                  backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', 
                  borderRadius: '6px', marginTop: '4px', padding: 0, listStyle: 'none', 
                  maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {suggestions.map((v, i) => (
                    <li 
                      key={i} 
                      onClick={() => handleSelectSuggestion(v)}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                      onMouseOver={(e) => e.target.style.backgroundColor = 'var(--background-color)'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <strong>{v.plate}</strong> - {v.prefix}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Prefixo</label>
              <input 
                type="text" 
                name="prefix" 
                value={formData.prefix} 
                onChange={handleChange} 
                placeholder="Ex: 1024"
                required 
              />
            </div>
          </div>

          {formData.has_extinguisher && (
            <>
              <div className="form-group">
                <label>Número de Série do Extintor</label>
                <input 
                  type="text" 
                  name="serial_number" 
                  value={formData.serial_number} 
                  onChange={handleChange} 
                  placeholder="Deixe em branco se estiver ilegível"
                />
              </div>

              <div className="form-group">
                <label>Data de Vencimento</label>
                <input 
                  type="date" 
                  name="expiration_date" 
                  value={formData.expiration_date ? formData.expiration_date.split('T')[0] : ''} 
                  onChange={handleChange} 
                  required={formData.has_extinguisher}
                />
              </div>
            </>
          )}

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            {formData.has_extinguisher && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  name="is_full" 
                  checked={formData.is_full} 
                  onChange={handleChange} 
                  id="is_full_checkbox"
                  style={{ width: 'auto' }}
                />
                <label htmlFor="is_full_checkbox" style={{ margin: 0, cursor: 'pointer' }}>Extintor está Cheio (Pronto para uso)</label>
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                name="has_metroplan_seal" 
                checked={formData.has_metroplan_seal} 
                onChange={handleChange} 
                id="has_metroplan_seal_checkbox"
                style={{ width: 'auto' }}
              />
              <label htmlFor="has_metroplan_seal_checkbox" style={{ margin: 0, cursor: 'pointer' }}>Veículo possui selo da Metroplan</label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button type="button" onClick={onCancel} className="btn-secondary" style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtinguisherForm;
