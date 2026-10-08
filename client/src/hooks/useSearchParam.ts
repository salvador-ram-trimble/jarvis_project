import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

/**
 * One query-string parameter as state, such as a list's sort or filter, so it survives going to a record
 * and coming back, and can be shared as a link. Setting it to `defaultValue` (or '') removes it from the URL.
 * Changes replace the current history entry.
 */
export function useSearchParam(name: string, defaultValue = '') {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(name) ?? defaultValue;

  const setValue = useCallback(
    (next: string) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          if (next === defaultValue || next === '') {
            params.delete(name);
          } else {
            params.set(name, next);
          }
          return params;
        },
        { replace: true },
      );
    },
    [name, defaultValue, setSearchParams],
  );

  return [value, setValue] as const;
}
