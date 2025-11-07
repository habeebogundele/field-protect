import { NextRequest, NextResponse } from 'next/server';
import { weatherService } from '@/lib/services/weatherService';
import { getUserFromRequest } from '../../../lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { lat: string; lon: string } }
) {
  const authResult = await getUserFromRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const latitude = parseFloat(params.lat);
    const longitude = parseFloat(params.lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { message: 'Valid latitude and longitude are required' },
        { status: 400 }
      );
    }

    const weather = await weatherService.getCurrentWeather(latitude, longitude);
    return NextResponse.json(weather);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json(
      { message: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}
