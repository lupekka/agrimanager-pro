import { WeatherData } from '../types';
import { weatherAdviceMap } from '../utils/constants';

// Cache in memoria per evitare richieste duplicate
let locationCache: { lat: number; lon: number; city: string; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

export const weatherService = {
  // 🔵 FUNZIONI GPS (OTTIMIZZATE)
  async getUserLocationByGPS(): Promise<{ lat: number; lon: number; city: string } | null> {
    // Controlla cache in memoria
    if (locationCache && Date.now() - locationCache.timestamp < CACHE_DURATION) {
      return { lat: locationCache.lat, lon: locationCache.lon, city: locationCache.city };
    }

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log("GPS non supportato");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocoding con timeout e cache
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=it`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || "Posizione attuale";
            
            // Aggiorna cache
            locationCache = { lat: latitude, lon: longitude, city, timestamp: Date.now() };
            
            resolve({ lat: latitude, lon: longitude, city });
          } catch {
            clearTimeout(timeoutId);
            resolve({ lat: latitude, lon: longitude, city: "Posizione attuale" });
          }
        },
        () => resolve(null),
        { timeout: 8000, enableHighAccuracy: true }
      );
    });
  },

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=it`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      const data = await response.json();
      return data.address?.city || data.address?.town || data.address?.village || "Posizione attuale";
    } catch {
      return "Posizione attuale";
    }
  },

  async searchLocation(query: string): Promise<Array<{ name: string; lat: number; lon: number; country: string }>> {
    if (!query.trim()) return [];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=it`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      const data = await response.json();
      return data.results?.map((r: any) => ({
        name: r.name,
        lat: r.latitude,
        lon: r.longitude,
        country: r.country
      })) || [];
    } catch {
      return [];
    }
  },

  saveUserLocation(lat: number, lon: number, city: string) {
    const data = { lat, lon, city, timestamp: Date.now() };
    localStorage.setItem('userPreferredLocation', JSON.stringify(data));
    // Aggiorna anche cache in memoria
    locationCache = data;
  },

  getUserPreferredLocation(): { lat: number; lon: number; city: string } | null {
    const saved = localStorage.getItem('userPreferredLocation');
    return saved ? JSON.parse(saved) : null;
  },

  async getUserLocationByIP() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const ipResponse = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const ipData = await ipResponse.json();
      return {
        lat: ipData.latitude,
        lon: ipData.longitude,
        city: ipData.city || ipData.region || "Posizione sconosciuta"
      };
    } catch (error) {
      console.error("Errore geolocalizzazione IP:", error);
      return { lat: 41.9028, lon: 12.4964, city: "Roma" };
    }
  },

async fetchWeather(lat?: number, lon?: number): Promise<Partial<WeatherData>> {
  try {
    let location;
    let cityName = '';

    // Se sono state passate coordinate, usa quelle (priorità massima)
    if (lat && lon) {
      cityName = await this.reverseGeocode(lat, lon);
      location = { lat, lon };
    }
    // Altrimenti prova con la località preferita
    else {
      const preferred = this.getUserPreferredLocation();
      if (preferred) {
        location = { lat: preferred.lat, lon: preferred.lon };
        cityName = preferred.city;
      } else {
        // Altrimenti GPS
        const gpsLocation = await this.getUserLocationByGPS();
        if (gpsLocation) {
          location = { lat: gpsLocation.lat, lon: gpsLocation.lon };
          cityName = gpsLocation.city;
        } else {
          // Fallback IP
          const ipLocation = await this.getUserLocationByIP();
          location = { lat: ipLocation.lat, lon: ipLocation.lon };
          cityName = ipLocation.city;
        }
      }
    }

    // Chiamata API meteo con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    
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
    
    const weatherData = {
      icon: weatherInfo.icon,
      temp: temperature,
      desc: weatherInfo.description,
      advice: weatherInfo.advice,
      location: cityName || location.city || "Posizione sconosciuta",
      forecast: dailyForecast,
      loading: false,
      error: null
    };
    
    // Salva in cache SOLO se non sono state passate coordinate
    if (!lat && !lon) {
      this.cacheWeather(weatherData);
    }
    
    return weatherData;
    
  } catch (error) {
    console.error("Errore meteo:", error);
    return {
      icon: "☀️",
      temp: 18,
      desc: "Dati non disponibili",
      advice: "VERIFICARE CONNESSIONE",
      location: "Non rilevata",
      loading: false,
      error: "Errore meteo"
    };
  }
},
  getCachedWeather(): WeatherData | null {
    const cached = localStorage.getItem('agriWeather');
    if (cached) {
      const weatherData = JSON.parse(cached);
      if (Date.now() - weatherData.timestamp < 60 * 60 * 1000) {
        return weatherData;
      }
    }
    return null;
  },

  cacheWeather(data: WeatherData) {
    localStorage.setItem('agriWeather', JSON.stringify({
      ...data,
      timestamp: Date.now()
    }));
  }
};
