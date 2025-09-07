import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check if tables exist by trying to query them
    const results = {
      domainCategories: { exists: false, count: 0, error: null },
      usStates: { exists: false, count: 0, error: null },
      usCities: { exists: false, count: 0, error: null },
      domains: { exists: false, count: 0, error: null }
    };

    // Test domainCategories table
    try {
      const categoryCount = await prisma.domainCategory.count();
      results.domainCategories = { exists: true, count: categoryCount, error: null };
    } catch (error: any) {
      results.domainCategories = { exists: false, count: 0, error: error.message };
    }

    // Test usStates table
    try {
      const stateCount = await prisma.uSState.count();
      results.usStates = { exists: true, count: stateCount, error: null };
    } catch (error: any) {
      results.usStates = { exists: false, count: 0, error: error.message };
    }

    // Test usCities table
    try {
      const cityCount = await prisma.uSCity.count();
      results.usCities = { exists: true, count: cityCount, error: null };
    } catch (error: any) {
      results.usCities = { exists: false, count: 0, error: error.message };
    }

    // Test domains table
    try {
      const domainCount = await prisma.domain.count();
      results.domains = { exists: true, count: domainCount, error: null };
    } catch (error: any) {
      results.domains = { exists: false, count: 0, error: error.message };
    }

    return NextResponse.json({
      success: true,
      tables: results,
      message: 'Database table status checked'
    });

  } catch (error: any) {
    console.error('Database test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Error checking database tables'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
