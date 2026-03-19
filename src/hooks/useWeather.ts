import { useState, useCallback, useEffect } from 'react';
import { WeatherData } from '../types';
import { weatherService } from '../services/weatherService';
import { useAuth } from './useAuth';

// Interfaccia per i risultati della ricerca
interface LocationResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  admin1?: string;
}

export const useWeather = () => {
  const { userData } = useAuth(); // Prendiamo i dati dell'utente loggato
  const [weather, setWeather] = useState<WeatherData>({
    icon: "☀️",
    temp: 18,
    desc: "Caricamento...",
    advice: "PREVISIONE IN AGGIORNAMENTO",
    location: userData?.location || "Seleziona una località",
    loading: false,
    error: null
  });

  // Funzione per cercare località
  const searchLocation = useCallback(async (query: string): Promise<LocationResult[]> => {
    if (!query.trim()) return [];
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=it`
      );
      const data = await response.json();
      return data.results?.map((r: any) => ({
        name: r.name,
        lat: r.latitude,
        lon: r.longitude,
        country: r.country,
        admin1: r.admin1
      })) || [];
    } catch (error) {
      console.error('Errore ricerca località:', error);
      return [];
    }
  }, []);

  // Funzione per ottenere le coordinate di una località dal nome
  const getCoordinatesFromLocation = useCallback(async (locationName: string): Promise<{ lat: number; lon: number; name: string } | null> => {
    const results = await searchLocation(locationName);
    if (results.length > 0) {
      const first = results[0];
      return {
        lat: first.lat,
        lon: first.lon,
        name: first.name
      };
    }
    return null;
  }, [searchLocation]);

  // Funzione per impostare una località e ottenere il meteo
  const setLocation = useCallback(async (lat: number, lon: number, cityName: string) => {
    setWeather(prev => ({ ...prev, loading: true, error: null }));
   const data = await weatherService.fetchWeather();  // Senza parametri!
   setWeather({
  icon: data.icon || '☀️',
  temp: data.temp ?? 18,
  desc: data.desc || 'Sereno',
  advice: data.advice || 'LAVORI ALL'APERTO',
  location: cityName,
  forecast: data.forecast || [],
  loading: false,
  error: data.error || null
});
  }, []);

  // Carica il meteo della località dell'utente al primo avvio
  useEffect(() => {
    const loadUserLocationWeather = async () => {
      // Se l'utente ha una località salvata
      if (userData?.location) {
        const coords = await getCoordinatesFromLocation(userData.location);
        if (coords) {
          await setLocation(coords.lat, coords.lon, coords.name);
        } else {
          // Se non trova la località, mette un messaggio di errore
          setWeather(prev => ({
            ...prev,
            error: `Località "${userData.location}" non trovata`,
            loading: false
          }));
        }
      } else {
        // Se non c'è località, carica comunque con un fallback (Roma)
        const defaultCoords = await getCoordinatesFromLocation('Roma');
        if (defaultCoords) {
          await setLocation(defaultCoords.lat, defaultCoords.lon, defaultCoords.name);
        }
      }
    };

    loadUserLocationWeather();
  }, [userData?.location]); // Ricarica se cambia la località dell'utente

  return {
    weather,
    searchLocation,
    setLocation,
  };
};
