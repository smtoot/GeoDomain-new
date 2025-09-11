import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/security/auth';
import { PrismaClient } from '@prisma/client';
import { domainCategories, popularStates, popularCities } from '@/lib/categories';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('🌱 Starting admin data seed via API...');

    // Seed Categories - Clear existing and add only essential 15
    console.log('📋 Clearing existing categories and seeding essential 15...');
    
    // First, delete all existing categories to ensure clean slate
    await prisma.domainCategory.deleteMany({});
    console.log('🗑️ Cleared all existing categories');
    
    const categoryData = domainCategories.map((category, index) => ({
      name: category.name,
      description: category.description,
      examples: category.examples.join(', '), // Convert array to comma-separated string
      industries: category.industries.join(', '), // Convert array to comma-separated string
      sortOrder: index,
    }));

    // Create only the essential 15 categories
    for (const category of categoryData) {
      await prisma.domainCategory.create({
        data: category,
      });
    }
    console.log(`✅ Created ${categoryData.length} essential categories`);

    // Seed States
    console.log('🗺️ Seeding states...');
    const stateData = popularStates.map((stateName, index) => {
      // Get state abbreviation (simple mapping for major states)
      const stateAbbreviations: { [key: string]: string } = {
        'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
        'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
        'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
        'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
        'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
        'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
        'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
        'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
        'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
        'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
      };

      return {
        name: stateName,
        abbreviation: stateAbbreviations[stateName] || stateName.substring(0, 2).toUpperCase(),
        sortOrder: index,
      };
    });

    const createdStates = [];
    for (const state of stateData) {
      const createdState = await prisma.uSState.upsert({
        where: { name: state.name },
        update: state,
        create: state,
      });
      createdStates.push(createdState);
    }
    console.log(`✅ Created/Updated ${createdStates.length} states`);

    // Seed Cities
    console.log('🏙️ Seeding cities...');
    const cityData = popularCities.map((cityName, index) => {
      // Map cities to states (simplified mapping for top cities)
      const cityStateMapping: { [key: string]: string } = {
        'New York City': 'New York',
        'Los Angeles': 'California',
        'Chicago': 'Illinois',
        'Houston': 'Texas',
        'Phoenix': 'Arizona',
        'Philadelphia': 'Pennsylvania',
        'San Antonio': 'Texas',
        'San Diego': 'California',
        'Dallas': 'Texas',
        'San Jose': 'California',
        'Austin': 'Texas',
        'Jacksonville': 'Florida',
        'Fort Worth': 'Texas',
        'Columbus': 'Ohio',
        'Charlotte': 'North Carolina',
        'San Francisco': 'California',
        'Indianapolis': 'Indiana',
        'Seattle': 'Washington',
        'Denver': 'Colorado',
        'Washington': 'District of Columbia',
        'Boston': 'Massachusetts',
        'El Paso': 'Texas',
        'Nashville': 'Tennessee',
        'Detroit': 'Michigan',
        'Oklahoma City': 'Oklahoma',
        'Portland': 'Oregon',
        'Las Vegas': 'Nevada',
        'Memphis': 'Tennessee',
        'Louisville': 'Kentucky',
        'Baltimore': 'Maryland',
        'Milwaukee': 'Wisconsin',
        'Albuquerque': 'New Mexico',
        'Tucson': 'Arizona',
        'Fresno': 'California',
        'Sacramento': 'California',
        'Mesa': 'Arizona',
        'Kansas City': 'Missouri',
        'Atlanta': 'Georgia',
        'Long Beach': 'California',
        'Colorado Springs': 'Colorado',
        'Raleigh': 'North Carolina',
        'Miami': 'Florida',
        'Virginia Beach': 'Virginia',
        'Omaha': 'Nebraska',
        'Oakland': 'California',
        'Minneapolis': 'Minnesota',
        'Tulsa': 'Oklahoma',
        'Arlington': 'Texas',
        'Tampa': 'Florida',
        'New Orleans': 'Louisiana'
      };

      const stateName = cityStateMapping[cityName];
      const state = createdStates.find(s => s.name === stateName);
      
      return {
        name: cityName,
        stateId: state?.id || '',
        sortOrder: index,
      };
    }).filter(city => city.stateId); // Only include cities with valid state mappings

    for (const city of cityData) {
      await prisma.uSCity.upsert({
        where: { 
          name_stateId: {
            name: city.name,
            stateId: city.stateId
          }
        },
        update: city,
        create: city,
      });
    }
    console.log(`✅ Created/Updated ${cityData.length} cities`);

    console.log('\n🎉 Admin data seeding completed!');

    return NextResponse.json({
      success: true,
      message: `Admin data seeded successfully with ${categoryData.length} essential categories`,
      data: {
        categories: categoryData.length,
        states: createdStates.length,
        cities: cityData.length
      }
    });

  } catch (error) {
    console.error('❌ Error during admin data seeding:', error);
    return NextResponse.json(
      { 
        error: 'Failed to seed admin data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
