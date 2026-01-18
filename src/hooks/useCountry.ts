import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useCountry() {
  const [currency, setCurrency] = useState<'BRL' | 'USD'>('USD'); // Começa com Dólar por segurança
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocation() {
      try {
        // Chama a Edge Function que criamos
        const { data, error } = await supabase.functions.invoke('get-location');
        
        if (!error && data?.country === 'BR') {
          setCurrency('BRL');
        } else {
          setCurrency('USD');
        }
      } catch (err) {
        console.error('Erro ao detectar país, mantendo USD:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLocation();
  }, []);

  return { currency, loading };
}