import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/** Volta no histórico interno; se não houver, cai em `fallback`. */
export function useNavigateBack(fallback = '/') {
  const navigate = useNavigate();
  return useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallback);
  }, [fallback, navigate]);
}
