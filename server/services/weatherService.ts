// Weather Service for Agricultural Spraying Conditions
export class WeatherService {
  private apiKey: string | undefined;
  private isEnabled: boolean;

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.isEnabled = Boolean(this.apiKey);
    
    if (!this.isEnabled) {
      console.warn('Weather service disabled - missing OPENWEATHER_API_KEY');
    }
  }

  /**
   * Get current weather conditions for spraying decisions
   * @param lat Latitude of the field
   * @param lon Longitude of the field
   * @returns Weather data with spraying recommendations
   */
  async getCurrentWeather(lat: number, lon: number) {
    if (!this.isEnabled || !this.apiKey) {
      // Return mock data for development
      return {
        location: { lat, lon },
        current: {
          temperature: 22.1,
          humidity: 65,
          pressure: 1013.2,
          windSpeed: 8.5, // km/h
          windDirection: 225, // degrees
          windGust: 12.0,
          visibility: 10000,
          uvIndex: 4,
          conditions: "Clear",
          icon: "01d"
        },
        sprayConditions: {
          recommendation: "GOOD",
          reason: "Optimal wind speed and temperature conditions",
          windSpeedStatus: "GOOD", // 2-15 km/h is optimal
          temperatureStatus: "GOOD", // 10-25°C is optimal  
          humidityStatus: "GOOD", // 40-70% is optimal
          deltaT: 8.5, // Temperature-humidity relationship for evaporation
        },
        forecast: {
          nextHour: "Clear conditions expected",
          next6Hours: "No precipitation expected",
          next24Hours: "Winds 5-10 km/h, partly cloudy"
        },
        lastUpdated: new Date().toISOString()
      };
    }

    try {
      // Call OpenWeatherMap Current Weather API
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      // Get 5-day forecast for spray planning
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&cnt=8`
      );

      const forecastData = forecastResponse.ok ? await forecastResponse.json() : null;

      // Convert wind speed from m/s to km/h
      const windSpeedKmh = data.wind?.speed ? data.wind.speed * 3.6 : 0;
      const windGustKmh = data.wind?.gust ? data.wind.gust * 3.6 : windSpeedKmh;

      // Calculate spray conditions
      const sprayConditions = this.evaluateSprayConditions(
        data.main.temp,
        data.main.humidity,
        windSpeedKmh,
        data.wind?.deg || 0
      );

      return {
        location: { lat, lon },
        current: {
          temperature: data.main.temp,
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: windSpeedKmh,
          windDirection: data.wind?.deg || 0,
          windGust: windGustKmh,
          visibility: data.visibility || 10000,
          uvIndex: data.uvi || 0,
          conditions: data.weather[0]?.description || "Unknown",
          icon: data.weather[0]?.icon || "01d"
        },
        sprayConditions,
        forecast: this.processForecast(forecastData),
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Weather API error:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  /**
   * Evaluate if current conditions are suitable for spraying
   */
  private evaluateSprayConditions(temp: number, humidity: number, windSpeed: number, windDirection: number) {
    const conditions = {
      windSpeedStatus: "POOR" as "GOOD" | "CAUTION" | "POOR",
      temperatureStatus: "POOR" as "GOOD" | "CAUTION" | "POOR", 
      humidityStatus: "POOR" as "GOOD" | "CAUTION" | "POOR",
      recommendation: "NO_SPRAY" as "GOOD" | "CAUTION" | "NO_SPRAY",
      reason: "",
      deltaT: 0
    };

    // Evaluate wind speed (optimal: 3-15 km/h)
    if (windSpeed >= 3 && windSpeed <= 15) {
      conditions.windSpeedStatus = "GOOD";
    } else if (windSpeed >= 2 && windSpeed <= 20) {
      conditions.windSpeedStatus = "CAUTION";
    } else {
      conditions.windSpeedStatus = "POOR";
    }

    // Evaluate temperature (optimal: 10-25°C)
    if (temp >= 10 && temp <= 25) {
      conditions.temperatureStatus = "GOOD";
    } else if (temp >= 5 && temp <= 30) {
      conditions.temperatureStatus = "CAUTION";
    } else {
      conditions.temperatureStatus = "POOR";
    }

    // Evaluate humidity (optimal: 40-70%)
    if (humidity >= 40 && humidity <= 70) {
      conditions.humidityStatus = "GOOD";
    } else if (humidity >= 30 && humidity <= 80) {
      conditions.humidityStatus = "CAUTION";
    } else {
      conditions.humidityStatus = "POOR";
    }

    // Calculate Delta T (temperature - dew point approximation)
    const dewPoint = temp - ((100 - humidity) / 5);
    conditions.deltaT = Math.round((temp - dewPoint) * 10) / 10;

    // Overall recommendation
    const goodConditions = [conditions.windSpeedStatus, conditions.temperatureStatus, conditions.humidityStatus]
      .filter(status => status === "GOOD").length;

    const poorConditions = [conditions.windSpeedStatus, conditions.temperatureStatus, conditions.humidityStatus]
      .filter(status => status === "POOR").length;

    if (poorConditions > 0) {
      conditions.recommendation = "NO_SPRAY";
      conditions.reason = this.getSprayIssues(conditions);
    } else if (goodConditions >= 2) {
      conditions.recommendation = "GOOD";
      conditions.reason = "Favorable conditions for spraying";
    } else {
      conditions.recommendation = "CAUTION";
      conditions.reason = "Marginal conditions - monitor closely";
    }

    return conditions;
  }

  private getSprayIssues(conditions: any): string {
    const issues = [];
    
    if (conditions.windSpeedStatus === "POOR") {
      issues.push("Wind speed outside safe range");
    }
    if (conditions.temperatureStatus === "POOR") {
      issues.push("Temperature too high/low");
    }
    if (conditions.humidityStatus === "POOR") {
      issues.push("Humidity too high/low");
    }

    return issues.join(", ");
  }

  private processForecast(forecastData: any) {
    if (!forecastData?.list) {
      return {
        nextHour: "Forecast unavailable",
        next6Hours: "Forecast unavailable", 
        next24Hours: "Forecast unavailable"
      };
    }

    const next6Hours = forecastData.list.slice(0, 2); // 6 hours (3-hour intervals)
    const next24Hours = forecastData.list.slice(0, 8); // 24 hours

    return {
      nextHour: "Conditions stable",
      next6Hours: this.summarizeForecast(next6Hours),
      next24Hours: this.summarizeForecast(next24Hours)
    };
  }

  private summarizeForecast(forecastList: any[]): string {
    if (!forecastList.length) return "No forecast data";

    const avgWind = forecastList.reduce((sum, item) => sum + (item.wind?.speed || 0) * 3.6, 0) / forecastList.length;
    const maxWind = Math.max(...forecastList.map(item => (item.wind?.speed || 0) * 3.6));
    const hasRain = forecastList.some(item => item.weather?.[0]?.main === "Rain");

    let summary = `Wind ${Math.round(avgWind)}-${Math.round(maxWind)} km/h`;
    if (hasRain) {
      summary += ", rain expected";
    }

    return summary;
  }
}

export const weatherService = new WeatherService();