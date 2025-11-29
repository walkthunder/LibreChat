import { useEffect, useRef } from 'react';
import { useAnonymousLoginMutation } from '~/data-provider';
import { getOrGenerateFingerprint } from '~/utils/browserFingerprint';

interface UseAnonymousLoginProps {
  enabled: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

/**
 * Hook for automatic anonymous login based on browser fingerprint
 */
export const useAnonymousLogin = ({ enabled, onSuccess, onError }: UseAnonymousLoginProps) => {
  const hasAttempted = useRef(false);
  const anonymousLoginMutation = useAnonymousLoginMutation({
    onSuccess: (data) => {
      console.log('[useAnonymousLogin] Anonymous login successful');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('[useAnonymousLogin] Anonymous login failed:', error);
      onError?.(error);
    },
  });

  useEffect(() => {
    if (!enabled || hasAttempted.current || anonymousLoginMutation.isLoading) {
      return;
    }

    const attemptAnonymousLogin = async () => {
      try {
        hasAttempted.current = true;
        console.log('[useAnonymousLogin] Attempting anonymous login...');
        
        const fingerprint = await getOrGenerateFingerprint();
        console.log('[useAnonymousLogin] Generated fingerprint');
        
        anonymousLoginMutation.mutate({ fingerprint });
      } catch (error) {
        console.error('[useAnonymousLogin] Error generating fingerprint:', error);
        onError?.(error);
      }
    };

    attemptAnonymousLogin();
  }, [enabled]);

  return {
    isLoading: anonymousLoginMutation.isLoading,
    isError: anonymousLoginMutation.isError,
    error: anonymousLoginMutation.error,
  };
};

export default useAnonymousLogin;
