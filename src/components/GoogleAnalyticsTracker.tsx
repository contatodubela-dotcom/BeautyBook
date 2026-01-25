import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

export const GoogleAnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Envia um "pageview" para o Google sempre que a rota mudar
    ReactGA.send({ 
        hitType: "pageview", 
        page: location.pathname + location.search,
        title: document.title 
    });
  }, [location]);

  return null; // Este componente não renderiza nada visualmente
};