import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('extintores_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const loginWithCPF = async (cpf) => {
    setLoading(true);
    try {
      // Clean CPF
      const cleanCPF = cpf.replace(/\D/g, '');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('cpf', cleanCPF)
        .single();

      if (error || !data) {
        throw new Error('CPF não encontrado ou sem permissão de acesso.');
      }

      setUser(data);
      localStorage.setItem('extintores_user', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('extintores_user');
  };

  const updateUser = (newUserData) => {
    const updated = { ...user, ...newUserData };
    setUser(updated);
    localStorage.setItem('extintores_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loginWithCPF, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
