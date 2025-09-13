import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const [categories, states, cities, priceRanges] = await Promise.all([
      // Get all categories (show all, not just those with domains)
      prisma.domainCategory.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              domains: {
                where: { status: 'VERIFIED' }
              }
            }
          }
        }
      }),
      // Get all states (show all, not just those with domains)
      prisma.uSState.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          abbreviation: true,
          _count: {
            select: {
              domains: {
                where: { status: 'VERIFIED' }
              }
            }
          }
        }
      }),
      // Get all cities (show all, not just those with domains)
      prisma.uSCity.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          state: {
            select: {
              name: true,
              abbreviation: true
            }
          },
          _count: {
            select: {
              domains: {
                where: { status: 'VERIFIED' }
              }
            }
          }
        }
      }),
      // Get price ranges
      prisma.domain.aggregate({
        where: { status: 'VERIFIED' },
        _min: { price: true },
        _max: { price: true },
        _avg: { price: true },
      }),
    ]);

    const result = {
      success: true,
      data: {
        categories: categories.map(c => ({ value: c.name, count: c._count.domains })),
        states: states.map(s => ({ value: s.name, count: s._count.domains })),
        cities: cities.map(c => ({ 
          value: c.name, 
          state: c.state.name,
          stateAbbr: c.state.abbreviation,
          count: c._count.domains 
        })),
        priceRanges: {
          min: priceRanges._min.price || 0,
          max: priceRanges._max.price || 0,
          average: priceRanges._avg.price || 0,
        },
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
