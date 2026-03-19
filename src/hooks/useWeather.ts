import { useState, useEffect } from 'react';
import { WeatherData } from '../types';
import { weatherService } from '../services/weatherService';

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData>({
    icon: "☀️",
    temp: 18,
    desc: "Caricamento...",
    advice: "PREVISIONE IN AGGIORNAMENTO",
    location: "Rilevamento posizione...",
    loading: true,
    error: null
  });

  const [useGPS, setUseGPS] = useState<boolean>(true); // Nuovo stato per GPS

  // Carica la preferenza GPS salvata
  useEffect(() => {
    const savedGPS = localStorage.getItem('useGPS');
    if (savedGPS !== null) {
      setUseGPS(savedGPS === 'true');
    }
  }, []);

  const fetchWeather = async (forceGPS?: boolean, customLocation?: { lat: number; lon: number; city: string }) => {
    setWeather(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // 1. Se è stata passata una località personalizzata (es. da ricerca manuale)
      if (customLocation) {
        const data = await weatherService.fetchWeather(true, customLocation);
        const newWeather = {
          ...weather,
          ...data,
          loading: false,
          location: customLocation.city
        } as WeatherData;
        
        setWeather(newWeather);
        weatherService.cacheWeather(newWeather);
        
        // Salva come preferenza
        weatherService.saveUserLocation(
          customLocation.lat, 
          customLocation.lon, 
          customLocation.city
        );
        return;
      }

      // 2. Prova con cache
      const cached = weatherService.getCachedWeather();
      if (cached) {
        setWeather({ ...cached, loading: false });
        return;
      }
      
      // 3. Determina se usare GPS (forceGPS sovrascrive lo stato)
      const shouldUseGPS = forceGPS !== undefined ? forceGPS : useGPS;
      
      // 4. Chiamata API
      const data = await weatherService.fetchWeather(shouldUseGPS);
      const newWeather = {
        ...weather,
        ...data,
        loading: false
      } as WeatherData;
      
      setWeather(newWeather);
      weatherService.cacheWeather(newWeather);
      
    } catch (error) {
      setWeather(prev => ({
        ...prev,
        loading: false,
        error: "Errore meteo"
      }));
    }
  };

  // Funzione per attivare/disattivare GPS
  const toggleGPS = (enabled: boolean) => {
    setUseGPS(enabled);
    localStorage.setItem('useGPS', String(enabled));
    fetchWeather(enabled); // Ricarica con nuova modalità
  };

  // Funzione per cercare una località manualmente
  const searchLocation = async (query: string) => {
    return await weatherService.searchLocation(query);
  };

  // Funzione per impostare una località personalizzata
  const setCustomLocation = (lat: number, lon: number, city: string) => {
    fetchWeather(false, { lat, lon, city });
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(() => fetchWeather(useGPS), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // Non mettiamo useGPS nelle dipendenze per evitare loop

  return { 
    weather, 
    refreshWeather: fetchWeather,
    toggleGPS,
    searchLocation,
    setCustomLocation,
    useGPS
  };
};
