import { WeatherData } from '../types';
import { weatherAdviceMap } from '../utils/constants';

export const weatherService = {
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
      return { lat: 41.9028, lon: 12.4964, city: "Roma" }; // Default
    }
  },

  async fetchWeather(): Promise<Partial<WeatherData>> {
    try {
      const location = await this.getUserLocationByIP();
      
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
        error: null
      };
      
    } catch (error) {
      console.error("Errore meteo:", error);
      return {
        icon: "☀️",
        temp: 18,
        desc: "Dati non disponibili",
        advice: "VERIFICARE CONNESSIONE",
        location: "Non rilevata",
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