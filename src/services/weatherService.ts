import { WeatherData } from '../types';
import { weatherAdviceMap } from '../utils/constants';

export const weatherService = {
  // 🔵 FUNZIONI GPS (NUOVE)
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
          const city = await this.reverseGeocode(latitude, longitude);
          resolve({ lat: latitude, lon: longitude, city });
        },
        (error) => {
          console.log("GPS negato o errore:", error);
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  },

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=it`
      );
      const data = await response.json();
      return data.address?.city || data.address?.town || data.address?.village || "Posizione attuale";
    } catch {
      return "Posizione attuale";
    }
  },

  async searchLocation(query: string): Promise<Array<{ name: string; lat: number; lon: number; country: string }>> {
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=it`
      );
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
    localStorage.setItem('userPreferredLocation', JSON.stringify({ lat, lon, city, timestamp: Date.now() }));
  },

  getUserPreferredLocation(): { lat: number; lon: number; city: string } | null {
    const saved = localStorage.getItem('userPreferredLocation');
    return saved ? JSON.parse(saved) : null;
  },

  // 🔵 FUNZIONI ESISTENTI (LE MANTIENI)
  async getUserLocationByIP() {
    try {
      const ipResponse = await fetch('https://ipapi.co/json/');
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

  // 🔵 NUOVA VERSIONE DI fetchWeather CON SUPPORTO GPS
 async fetchWeather(useGPS: boolean = true): Promise<Partial<WeatherData>> {
  try {
    let location;

    // 1. Prova con la località preferita salvata
    const preferred = this.getUserPreferredLocation();
    if (preferred) {
      location = preferred;
      console.log('📍 [PREFERITA]', location); // 🔍 LOG
    }
    // 2. Altrimenti GPS (se richiesto)
    else if (useGPS) {
      const gpsLocation = await this.getUserLocationByGPS();
      location = gpsLocation || await this.getUserLocationByIP();
      console.log('📍 [GPS/IP]', location); // 🔍 LOG
    }
    // 3. Fallback su IP
    else {
      location = await this.getUserLocationByIP();
      console.log('📍 [IP]', location); // 🔍 LOG
    }

    console.log('📍 [FINALE]', location); // 🔍 LOG

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`
    );
    
    console.log('📡 [URL]', response.url); // 🔍 LOG
    
    const data = await response.json();
    console.log('📊 [TEMP RICEVUTA]', data.current_weather.temperature); // 🔍 LOG
    
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
      location: location.city,
      forecast: dailyForecast,
      loading: false,
      error: null
    };
    
    // Salva in cache
    this.cacheWeather(weatherData);
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

  // 🔵 FUNZIONI ESISTENTI (IDENTICHE)
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
