import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;

    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
    });
  }, [location.pathname, location.search]);
}
