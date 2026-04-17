// src/hooks/useWeather.ts

const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY ?? 'c9e9eb367233cb959d24ff54b9f83801';

export interface WeatherData {
  temp: number;
  weather: string;
  weatherEmoji: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  pressure: number;
  visibility: number;
}

export interface ForecastPoint {
  time: string;      // "14:00"
  date: string;      // "오늘" | "내일" | "모레"
  temp: number;
  tempMin: number;
  tempMax: number;
  emoji: string;
  label: string;
  humidity: number;
  pop: number;       // 강수 확률 0~100
}

function getWeatherEmoji(icon: string): string {
  const map: Record<string, string> = {
    '01d':'☀️','01n':'🌙','02d':'⛅','02n':'☁️',
    '03d':'☁️','03n':'☁️','04d':'☁️','04n':'☁️',
    '09d':'🌧️','09n':'🌧️','10d':'🌦️','10n':'🌧️',
    '11d':'⛈️','11n':'⛈️','13d':'❄️','13n':'❄️',
    '50d':'🌫️','50n':'🌫️',
  };
  return map[icon] ?? '🌡️';
}

function translateDescription(desc: string): string {
  const map: Record<string, string> = {
    'clear sky':'맑음','few clouds':'구름 조금',
    'scattered clouds':'구름 많음','broken clouds':'흐림',
    'overcast clouds':'흐림','shower rain':'소나기',
    'rain':'비','light rain':'가벼운 비','moderate rain':'비',
    'heavy intensity rain':'강한 비','thunderstorm':'뇌우',
    'snow':'눈','light snow':'가벼운 눈','mist':'안개',
    'fog':'짙은 안개','haze':'연무','dust':'황사',
    'drizzle':'이슬비','light intensity drizzle':'약한 이슬비',
  };
  return map[desc.toLowerCase()] ?? desc;
}

// ── 현재 날씨 ─────────────────────────────────────────────
export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`
  );
  if (!res.ok) throw new Error(`OpenWeather API 실패: ${res.status}`);
  const d = await res.json();
  return {
    temp:       Math.round(d.main.temp),
    weather:    translateDescription(d.weather[0].description),
    weatherEmoji: getWeatherEmoji(d.weather[0].icon),
    humidity:   d.main.humidity,
    windSpeed:  Math.round(d.wind.speed * 10) / 10,
    feelsLike:  Math.round(d.main.feels_like),
    pressure:   d.main.pressure,
    visibility: Math.round((d.visibility ?? 10000) / 100) / 10, // km
  };
}

// ── 24시간 예보 (3시간 간격 × 8 = 24h) ───────────────────
export async function fetchForecast(lat: number, lng: number): Promise<ForecastPoint[]> {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric&cnt=16`
  );
  if (!res.ok) throw new Error(`Forecast API 실패: ${res.status}`);
  const d = await res.json();

  const today = new Date().toDateString();
  const tomorrow = new Date(Date.now() + 86400000).toDateString();

  return d.list.slice(0, 16).map((item: any) => {
    const dt = new Date(item.dt * 1000);
    const dayStr = dt.toDateString();
    const dateLabel = dayStr === today ? '오늘' : dayStr === tomorrow ? '내일' : '모레';
    const hour = dt.getHours().toString().padStart(2, '0');

    return {
      time: `${hour}:00`,
      date: dateLabel,
      temp: Math.round(item.main.temp),
      tempMin: Math.round(item.main.temp_min),
      tempMax: Math.round(item.main.temp_max),
      emoji: getWeatherEmoji(item.weather[0].icon),
      label: translateDescription(item.weather[0].description),
      humidity: item.main.humidity,
      pop: Math.round((item.pop ?? 0) * 100),
    };
  });
}