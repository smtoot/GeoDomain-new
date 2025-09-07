import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createGeoDomains() {
  try {
    console.log('🌍 Starting geo domains creation...');

    // Get all categories, states, and cities
    const categories = await prisma.domainCategory.findMany({
      select: { id: true, name: true }
    });

    const states = await prisma.uSState.findMany({
      select: { id: true, name: true, abbreviation: true }
    });

    const cities = await prisma.uSCity.findMany({
      select: { id: true, name: true, stateId: true, state: { select: { name: true, abbreviation: true } } }
    });

    console.log(`📊 Found ${categories.length} categories, ${states.length} states, ${cities.length} cities`);

    // Get a user to be the owner
    const owner = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!owner) {
      throw new Error('No admin user found to own domains');
    }

    // Create geo-related domains
    const geoDomains = [
      // Real Estate Domains
      {
        name: 'miamirealestate.com',
        price: 25000,
        priceType: 'FIXED',
        description: 'Premium Miami real estate domain for luxury properties and waterfront homes.',
        geographicScope: 'CITY',
        category: 'Real Estate',
        state: 'Florida',
        city: 'Miami',
        status: 'VERIFIED'
      },
      {
        name: 'californiarealestate.com',
        price: 35000,
        priceType: 'MAKE_OFFER',
        description: 'Premium California real estate domain for luxury properties and beachfront homes.',
        geographicScope: 'STATE',
        category: 'Real Estate',
        state: 'California',
        city: null,
        status: 'VERIFIED'
      },
      {
        name: 'newyorkproperties.com',
        price: 45000,
        priceType: 'NEGOTIABLE',
        description: 'Premium New York real estate domain for luxury Manhattan and Brooklyn properties.',
        geographicScope: 'STATE',
        category: 'Real Estate',
        state: 'New York',
        city: null,
        status: 'VERIFIED'
      },

      // Healthcare Domains
      {
        name: 'bostonhealthcare.com',
        price: 18000,
        priceType: 'FIXED',
        description: 'Premium Boston healthcare domain for medical services and hospitals.',
        geographicScope: 'CITY',
        category: 'Healthcare Services',
        state: 'Massachusetts',
        city: 'Boston',
        status: 'VERIFIED'
      },
      {
        name: 'texasmedical.com',
        price: 22000,
        priceType: 'FIXED',
        description: 'Premium Texas medical domain for healthcare providers and medical centers.',
        geographicScope: 'STATE',
        category: 'Healthcare Services',
        state: 'Texas',
        city: null,
        status: 'VERIFIED'
      },

      // Technology Domains
      {
        name: 'siliconvalleytech.com',
        price: 50000,
        priceType: 'MAKE_OFFER',
        description: 'Premium Silicon Valley technology domain for startups and tech companies.',
        geographicScope: 'CITY',
        category: 'Technology Services',
        state: 'California',
        city: 'San Francisco',
        status: 'VERIFIED'
      },
      {
        name: 'seattletech.com',
        price: 28000,
        priceType: 'FIXED',
        description: 'Premium Seattle technology domain for software companies and tech startups.',
        geographicScope: 'CITY',
        category: 'Technology Services',
        state: 'Washington',
        city: 'Seattle',
        status: 'VERIFIED'
      },

      // Restaurant & Food Domains
      {
        name: 'chicagorestaurants.com',
        price: 15000,
        priceType: 'FIXED',
        description: 'Premium Chicago restaurant domain for fine dining and food services.',
        geographicScope: 'CITY',
        category: 'Restaurants & Food',
        state: 'Illinois',
        city: 'Chicago',
        status: 'VERIFIED'
      },
      {
        name: 'neworleansfood.com',
        price: 12000,
        priceType: 'NEGOTIABLE',
        description: 'Premium New Orleans food domain for Cajun cuisine and local restaurants.',
        geographicScope: 'CITY',
        category: 'Restaurants & Food',
        state: 'Louisiana',
        city: 'New Orleans',
        status: 'VERIFIED'
      },

      // Legal Services Domains
      {
        name: 'washingtonlaw.com',
        price: 20000,
        priceType: 'FIXED',
        description: 'Premium Washington DC legal services domain for law firms and attorneys.',
        geographicScope: 'CITY',
        category: 'Legal Services',
        state: 'District of Columbia',
        city: 'Washington',
        status: 'VERIFIED'
      },
      {
        name: 'floridalawyers.com',
        price: 18000,
        priceType: 'FIXED',
        description: 'Premium Florida legal services domain for law firms and legal professionals.',
        geographicScope: 'STATE',
        category: 'Legal Services',
        state: 'Florida',
        city: null,
        status: 'VERIFIED'
      },

      // Automotive Domains
      {
        name: 'detroitauto.com',
        price: 25000,
        priceType: 'MAKE_OFFER',
        description: 'Premium Detroit automotive domain for car dealerships and auto services.',
        geographicScope: 'CITY',
        category: 'Automotive',
        state: 'Michigan',
        city: 'Detroit',
        status: 'VERIFIED'
      },
      {
        name: 'texasauto.com',
        price: 15000,
        priceType: 'FIXED',
        description: 'Premium Texas automotive domain for car dealerships and auto repair services.',
        geographicScope: 'STATE',
        category: 'Automotive',
        state: 'Texas',
        city: null,
        status: 'VERIFIED'
      },

      // Education Domains
      {
        name: 'bostoneducation.com',
        price: 16000,
        priceType: 'FIXED',
        description: 'Premium Boston education domain for universities and educational services.',
        geographicScope: 'CITY',
        category: 'Education Services',
        state: 'Massachusetts',
        city: 'Boston',
        status: 'VERIFIED'
      },
      {
        name: 'californiauniversities.com',
        price: 30000,
        priceType: 'MAKE_OFFER',
        description: 'Premium California education domain for universities and colleges.',
        geographicScope: 'STATE',
        category: 'Education Services',
        state: 'California',
        city: null,
        status: 'VERIFIED'
      },

      // Financial Services Domains
      {
        name: 'wallstreetfinance.com',
        price: 75000,
        priceType: 'MAKE_OFFER',
        description: 'Premium Wall Street financial services domain for investment firms and banks.',
        geographicScope: 'CITY',
        category: 'Banking & Finance',
        state: 'New York',
        city: 'New York',
        status: 'VERIFIED'
      },
      {
        name: 'chicagofinance.com',
        price: 25000,
        priceType: 'FIXED',
        description: 'Premium Chicago financial services domain for banks and investment firms.',
        geographicScope: 'CITY',
        category: 'Banking & Finance',
        state: 'Illinois',
        city: 'Chicago',
        status: 'VERIFIED'
      },

      // National Domains
      {
        name: 'usahotels.com',
        price: 45000,
        priceType: 'MAKE_OFFER',
        description: 'Premium national hotel domain for USA-wide hotel chains and hospitality.',
        geographicScope: 'NATIONAL',
        category: 'Hotels & Accommodation',
        state: null,
        city: null,
        status: 'VERIFIED'
      },
      {
        name: 'usainvestment.com',
        price: 55000,
        priceType: 'MAKE_OFFER',
        description: 'Premium national investment domain for USA-wide financial services.',
        geographicScope: 'NATIONAL',
        category: 'Investment Services',
        state: null,
        city: null,
        status: 'VERIFIED'
      }
    ];

    // Delete existing domains
    console.log('🗑️ Deleting existing domains...');
    await prisma.domain.deleteMany({});

    // Create new geo domains
    console.log('🌍 Creating geo domains...');
    for (const domainData of geoDomains) {
      // Find matching category, state, and city
      const category = categories.find(c => c.name === domainData.category);
      const state = states.find(s => s.name === domainData.state);
      const city = domainData.city ? cities.find(c => c.name === domainData.city && c.state.name === domainData.state) : null;

      if (!category) {
        console.warn(`⚠️ Category not found: ${domainData.category}`);
        continue;
      }

      if (!state) {
        console.warn(`⚠️ State not found: ${domainData.state}`);
        continue;
      }

      if (domainData.city && !city) {
        console.warn(`⚠️ City not found: ${domainData.city}, ${domainData.state}`);
        continue;
      }

      // Create the domain
      await prisma.domain.create({
        data: {
          name: domainData.name,
          price: domainData.price,
          priceType: domainData.priceType,
          description: domainData.description,
          geographicScope: domainData.geographicScope,
          categoryId: category.id,
          stateId: state.id,
          cityId: city?.id || null,
          status: domainData.status,
          ownerId: owner.id,
          publishedAt: new Date(),
          registrar: 'Network Solutions',
          expirationDate: new Date('2026-12-31'),
          metaTitle: `${domainData.name} - Premium ${domainData.category} Domain`,
          metaDescription: domainData.description
        }
      });

      console.log(`✅ Created ${domainData.name}`);
    }

    console.log('🎉 Geo domains creation completed!');

    // Verify the results
    const createdDomains = await prisma.domain.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        geographicScope: true,
        category: { select: { name: true } },
        state: { select: { name: true } },
        city: { select: { name: true } }
      }
    });

    console.log('\n📊 Created domains:');
    createdDomains.forEach(domain => {
      const location = domain.geographicScope === 'NATIONAL' ? 'National' :
                      domain.geographicScope === 'STATE' ? domain.state?.name :
                      domain.city ? `${domain.city.name}, ${domain.state?.name}` : 'Unknown';
      console.log(`${domain.name}: $${domain.price} - ${domain.category?.name} - ${location}`);
    });

  } catch (error) {
    console.error('❌ Error creating geo domains:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createGeoDomains();
