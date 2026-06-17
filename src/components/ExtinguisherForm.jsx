import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { formatPlate } from '../utils/formatters';

const ExtinguisherForm = ({ extinguisher, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    extinguisher || {
      vehicle_plate: '',
      prefix: '',
      serial_number: '',
      expiration_date: '',
      is_full: true
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let finalValue = type === 'checkbox' ? checked : value;
    if (name === 'vehicle_plate') {
      finalValue = formatPlate(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToSave = {
        ...formData,
        vehicle_plate: formData.vehicle_plate.toUpperCase(),
        updated_at: new Date().toISOString()
      };

      if (extinguisher && extinguisher.id) {
        // Update
        const { error: updateError } = await supabase
          .from('extinguishers')
          .update(dataToSave)
          .eq('id', extinguisher.id);
        
        if (updateError) throw updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('extinguishers')
          .insert([dataToSave]);
          
        if (insertError) throw insertError;
      }
      
      onSave();
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar os dados. Verifique se o número de série já existe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
            {extinguisher ? 'Editar Extintor' : 'Novo Extintor'}
          </h2>
          <button onClick={onCancel} style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="flex-gap">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Placa do Veículo</label>
              <input 
                type="text" 
                name="vehicle_plate" 
                value={formData.vehicle_plate} 
                onChange={handleChange} 
                placeholder="ABC-1234"
                required 
                maxLength={10}
              />
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

          <div className="form-group">
            <label>Número de Série do Extintor</label>
            <input 
              type="text" 
              name="serial_number" 
              value={formData.serial_number} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Data de Vencimento</label>
            <input 
              type="date" 
              name="expiration_date" 
              value={formData.expiration_date ? formData.expiration_date.split('T')[0] : ''} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
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
