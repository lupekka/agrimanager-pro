import { WeatherData } from '../types';
import { weatherAdviceMap } from '../utils/constants';

// Servizio di geocoding gratuito (Open-Meteo) [citation:9]
const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_GEOCODING_API = 'https://nominatim.openstreetmap.org/reverse'; // [citation:1]

export const weatherService = {
  /**
   * Ottiene la posizione via GPS (richiede permesso)
   */
  async getUserLocationByGPS(): Promise<{ lat: number; lon: number; city: string } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log("GPS non supportato");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Usa reverse geocoding per ottenere il nome della città [citation:1]
          try {
            const city = await this.reverseGeocode(latitude, longitude);
            resolve({ lat: latitude, lon: longitude, city });
          } catch (error) {
            // Se fallisce il reverse geocoding, restituisci solo le coordinate
            resolve({ lat: latitude, lon: longitude, city: "Posizione attuale" });
          }
        },
        (error) => {
          console.log("GPS negato o errore:", error);
          resolve(null);
        },
        { 
          timeout: 10000,
          enableHighAccuracy: true 
        }
      );
    });
  },

  /**
   * Reverse geocoding: coordinate → nome città [citation:1]
   */
  async reverseGeocode(lat: number, lon: number): Promise<string> {
    const url = new URL(REVERSE_GEOCODING_API);
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());
    url.searchParams.set('format', 'json');
    url.searchParams.set('accept-language', 'it');

    try {
      const response = await fetch(url.toString(), {
        headers: { 'User-Agent': 'AgriManager Pro' }
      });
      
      if (!response.ok) return "Posizione sconosciuta";
      
      const data = await response.json();
      
      // Estrai il nome della città/locality [citation:1]
      const address = data.address || {};
      return address.city || address.town || address.village || address.municipality || "Posizione sconosciuta";
      
    } catch (error) {
      console.error("Errore reverse geocoding:", error);
      return "Posizione sconosciuta";
    }
  },

  /**
   * Geocoding: nome città → coordinate [citation:9]
   */
  async searchLocation(query: string): Promise<Array<{ name: string; lat: number; lon: number; country: string }>> {
    try {
      const url = new URL(GEOCODING_API_URL);
      url.searchParams.set('name', query);
      url.searchParams.set('count', '5'); // massimo 5 risultati
      url.searchParams.set('language', 'it');

      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return [];
      }

      return data.results.map((r: any) => ({
        name: r.name,
        lat: r.latitude,
        lon: r.longitude,
        country: r.country,
        admin1: r.admin1 // regione/provincia
      }));
      
    } catch (error) {
      console.error("Errore geocoding:", error);
      return [];
    }
  },

  /**
   * Ottiene la posizione (GPS se possibile, altrimenti IP)
   */
  async getUserLocation(): Promise<{ lat: number; lon: number; city: string; source: 'gps' | 'ip' }> {
    // 1. Prova con GPS
    const gpsLocation = await this.getUserLocationByGPS();
    if (gpsLocation) {
      return { ...gpsLocation, source: 'gps' };
    }

    // 2. Fallback su IP [metodo esistente]
    try {
      const ipResponse = await fetch('https://ipapi.co/json/');
      const ipData = await ipResponse.json();
      return {
        lat: ipData.latitude,
        lon: ipData.longitude,
        city: ipData.city || ipData.region || "Posizione sconosciuta",
        source: 'ip'
      };
    } catch (error) {
      // Fallback a Roma se tutto fallisce
      return {
        lat: 41.9028,
        lon: 12.4964,
        city: "Roma (default)",
        source: 'ip'
      };
    }
  },

  /**
   * Permette all'utente di salvare una località preferita
   */
  saveUserLocation(lat: number, lon: number, city: string) {
    localStorage.setItem('userPreferredLocation', JSON.stringify({
      lat,
      lon,
      city,
      timestamp: Date.now()
    }));
  },

  /**
   * Recupera la località preferita salvata
   */
  getUserPreferredLocation(): { lat: number; lon: number; city: string } | null {
    const saved = localStorage.getItem('userPreferredLocation');
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  },

  /**
   * Versione aggiornata di fetchWeather con supporto GPS
   */
  async fetchWeather(useGPS: boolean = true, customLocation?: { lat: number; lon: number; city: string }): Promise<Partial<WeatherData>> {
    try {
      let location;
      
      // Se è stata passata una località personalizzata
      if (customLocation) {
        location = customLocation;
      } 
      // Altrimenti usa GPS/IP
      else if (useGPS) {
        location = await this.getUserLocation();
      } 
      // Fallback su IP
      else {
        const ipLocation = await this.getUserLocationByIP(); // metodo esistente
        location = { ...ipLocation, source: 'ip' };
      }

      // Chiamata API meteo (uguale a prima)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`
      );
      
      const data = await response.json();
      const weatherCode = data.current_weather.weathercode;
      const weatherInfo = weatherAdviceMap[weatherCode] || { 
        icon: "☀️", 
        description: "Variabile", 
        advice: "VERIFICARE CONDIZIONI LOCALI" 
      };
      
      const temperature = Math.round(data.current_weather.temperature);
      
      const dailyForecast = data.daily.time.slice(0, 3).map((date: string, index: number) => ({
        date: new Date(date).toLocaleDateString('it-IT', { weekday: 'short' }),
        max: Math.round(data.daily.temperature_2m_max[index]),
        min: Math.round(data.daily.temperature_2m_min[index]),
        icon: weatherAdviceMap[data.daily.weathercode[index]]?.icon || "☀️"
      }));
      
      return {
        icon: weatherInfo.icon,
        temp: temperature,
        desc: weatherInfo.description,
        advice: weatherInfo.advice,
        location: location.city,
        forecast: dailyForecast,
        loading: false,
        error: null,
        source: location.source
      };
      
    } catch (error) {
      console.error("Errore meteo:", error);
      return {
        icon: "☀️",
        temp: 18,
        desc: "Dati non disponibili",
        advice: "VERIFICARE CONNESSIONE",
        location: "Non rilevata",
        loading: false,
        error: "Errore meteo",
        forecast: []
      };
    }
  },

  // Mantieni i metodi esistenti
  async getUserLocationByIP() { /* ... come prima ... */ },
  getCachedWeather(): WeatherData | null { /* ... come prima ... */ },
  cacheWeather(data: WeatherData) { /* ... come prima ... */ }
};
