interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  timestamp: string;
}

export const weatherService = {
  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      console.warn('OPENWEATHER_API_KEY not set, returning mock data');
      // Return mock data for development
      return {
        temperature: 22,
        humidity: 65,
        windSpeed: 12,
        windDirection: 180,
        description: 'Partly cloudy',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
        windDirection: data.wind.deg,
        description: data.weather[0].description,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Return mock data on error
      return {
        temperature: 22,
        humidity: 65,
        windSpeed: 12,
        windDirection: 180,
        description: 'Weather data temporarily unavailable',
        timestamp: new Date().toISOString(),
      };
    }
  },
};
