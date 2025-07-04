import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@/lib/supabase';

interface DatabaseHealth {
  isHealthy: boolean;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export function useDatabaseHealth() {
  const [health, setHealth] = useState<DatabaseHealth>({
    isHealthy: false,
    isLoading: true,
    error: null,
    lastChecked: null,
  });

  const supabase = createClientComponentClient();

  const checkHealth = async () => {
    setHealth(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simple test query to check if flows table is accessible
      const { error } = await supabase
        .from('flows')
        .select('id')
        .limit(1);

      if (error) {
        setHealth({
          isHealthy: false,
          isLoading: false,
          error: error.message,
          lastChecked: new Date(),
        });
      } else {
        setHealth({
          isHealthy: true,
          isLoading: false,
          error: null,
          lastChecked: new Date(),
        });
      }
    } catch (err) {
      setHealth({
        isHealthy: false,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        lastChecked: new Date(),
      });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return {
    ...health,
    recheckHealth: checkHealth,
  };
}
