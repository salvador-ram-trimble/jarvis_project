import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';

/**
 * Returns a function that goes back one page, like the browser's back button, so leaving a form doesn't
 * add a history entry. When the page was opened directly (no earlier page in the app), it replaces the
 * current entry with `fallback` instead.
 */
export function useGoBack() {
  const navigate = useNavigate();
  const { key } = useLocation();

  return useCallback(
    (fallback: string) => {
      // React Router gives the first entry of a session the key "default".
      if (key === 'default') {
        navigate(fallback, { replace: true });
      } else {
        navigate(-1);
      }
    },
    [navigate, key],
  );
}
