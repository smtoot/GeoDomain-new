import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Test if cities table exists
    const cities = await prisma.uSCity.findMany({
      take: 5,
      include: { state: true }
    });

    // Test if states table exists
    const states = await prisma.uSState.findMany({
      take: 5
    });

    return NextResponse.json({
      success: true,
      citiesCount: cities.length,
      statesCount: states.length,
      sampleCities: cities,
      sampleStates: states,
      message: 'Cities and states tables are accessible'
    });

  } catch (error: any) {
    console.error('Cities test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      message: 'Error accessing cities or states tables'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
