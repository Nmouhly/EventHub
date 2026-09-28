import { useEffect, useState } from 'react';
export default function useResource(fetcher, dependencies = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    (async () => {
      try {
        const data = await fetcher();
        if (active) setState({ data, loading: false, error: null });
      } catch (error) {
        if (active) setState({ data: null, loading: false, error });
      }
    })();
    return () => {
      active = false;
    };
  }, [...dependencies, version]);
  return { ...state, refresh: () => setVersion((v) => v + 1) };
}
