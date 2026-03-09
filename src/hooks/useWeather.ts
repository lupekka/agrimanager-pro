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

  const fetchWeather = async () => {
    setWeather(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const cached = weatherService.getCachedWeather();
      if (cached) {
        setWeather({ ...cached, loading: false });
        return;
      }
      
      const data = await weatherService.fetchWeather();
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

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { weather, refreshWeather: fetchWeather };
};