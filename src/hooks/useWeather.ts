import { useState, useEffect, useCallback } from 'react';
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

  const [useGPS, setUseGPS] = useState<boolean>(true);
  const [customLocation, setCustomLocation] = useState<{ lat: number; lon: number; city: string } | null>(null);

  // Carica preferenze all'avvio
  useEffect(() => {
    const savedGPS = localStorage.getItem('useGPS');
    if (savedGPS !== null) {
      setUseGPS(savedGPS === 'true');
    }
    
    const savedLocation = weatherService.getUserPreferredLocation();
    if (savedLocation) {
      setCustomLocation(savedLocation);
    }
  }, []);

  const fetchWeather = useCallback(async (forceGPS?: boolean, manualLocation?: { lat: number; lon: number; city: string }) => {
    setWeather(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // 1. Se è stata passata una località manuale
      if (manualLocation) {
        const data = await weatherService.fetchWeather(true); // true = usa GPS? non importa, usiamo manualLocation dopo
        const newWeather = {
          ...weather,
          ...data,
          location: manualLocation.city,
          loading: false
        } as WeatherData;
        
        setWeather(newWeather);
        weatherService.cacheWeather(newWeather);
        setCustomLocation(manualLocation);
        setUseGPS(false);
        return;
      }

      // 2. Prova con cache (solo se non abbiamo customLocation)
      if (!customLocation) {
        const cached = weatherService.getCachedWeather();
        if (cached) {
          setWeather({ ...cached, loading: false });
          return;
        }
      }
      
      // 3. Determina se usare GPS
      const shouldUseGPS = forceGPS !== undefined ? forceGPS : useGPS;
      
      // 4. Se abbiamo una località salvata e non vogliamo GPS, usala
      if (!shouldUseGPS && customLocation) {
        const data = await weatherService.fetchWeather(true);
        const newWeather = {
          ...weather,
          ...data,
          location: customLocation.city,
          loading: false
        } as WeatherData;
        setWeather(newWeather);
        weatherService.cacheWeather(newWeather);
        return;
      }
      
      // 5. Chiamata API normale (con o senza GPS)
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
  }, [weather, useGPS, customLocation]);

  const toggleGPS = (enabled: boolean) => {
    setUseGPS(enabled);
    localStorage.setItem('useGPS', String(enabled));
    if (enabled) {
      setCustomLocation(null);
    }
    fetchWeather(enabled);
  };

  const searchLocation = async (query: string) => {
    return await weatherService.searchLocation(query);
  };

  const setManualLocation = (lat: number, lon: number, city: string) => {
    fetchWeather(false, { lat, lon, city });
  };

  // Effetto iniziale
  useEffect(() => {
    fetchWeather();
    const interval = setInterval(() => fetchWeather(useGPS), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // fetchWeather non nelle dipendenze per evitare loop

  return { 
    weather, 
    refreshWeather: fetchWeather,
    toggleGPS,
    searchLocation,
    setManualLocation,
    useGPS,
    customLocation
  };
};
