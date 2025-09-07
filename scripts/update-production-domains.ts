import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateProductionDomains() {
  try {
    console.log('🌍 Starting production domains update...');

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

    // Get all existing domains
    const domains = await prisma.domain.findMany({
      select: { id: true, name: true, description: true }
    });

    console.log(`📊 Found ${domains.length} domains to update`);

    // Update each domain with appropriate category and state
    for (const domain of domains) {
      let categoryId = null;
      let stateId = null;
      let cityId = null;

      const name = domain.name.toLowerCase();
      const description = domain.description?.toLowerCase() || '';

      // Assign category based on domain name/description
      if (name.includes('real') || name.includes('estate') || description.includes('real estate')) {
        categoryId = categories.find(c => c.name.includes('Real Estate'))?.id;
      } else if (name.includes('health') || name.includes('medical') || description.includes('healthcare')) {
        categoryId = categories.find(c => c.name.includes('Healthcare'))?.id;
      } else if (name.includes('tech') || name.includes('software') || description.includes('technology')) {
        categoryId = categories.find(c => c.name.includes('Technology'))?.id;
      } else if (name.includes('finance') || name.includes('bank') || description.includes('financial')) {
        categoryId = categories.find(c => c.name.includes('Banking'))?.id;
      } else if (name.includes('restaurant') || name.includes('food') || description.includes('restaurant')) {
        categoryId = categories.find(c => c.name.includes('Restaurants'))?.id;
      } else if (name.includes('education') || name.includes('learning') || description.includes('education')) {
        categoryId = categories.find(c => c.name.includes('Education'))?.id;
      } else if (name.includes('auto') || name.includes('car') || description.includes('automotive')) {
        categoryId = categories.find(c => c.name.includes('Automotive'))?.id;
      } else if (name.includes('crypto') || name.includes('bitcoin') || description.includes('cryptocurrency')) {
        categoryId = categories.find(c => c.name.includes('Banking'))?.id; // Finance category
      } else if (name.includes('fitness') || name.includes('gym') || description.includes('fitness')) {
        categoryId = categories.find(c => c.name.includes('Fitness'))?.id;
      } else {
        // Default to Technology Services if no match
        categoryId = categories.find(c => c.name.includes('Technology'))?.id;
      }

      // Assign state based on domain name (some domains have city names)
      if (name.includes('miami') || name.includes('florida')) {
        stateId = states.find(s => s.name === 'Florida')?.id;
      } else if (name.includes('newyork') || name.includes('nyc') || name.includes('new york')) {
        stateId = states.find(s => s.name === 'New York')?.id;
      } else if (name.includes('boston') || name.includes('massachusetts')) {
        stateId = states.find(s => s.name === 'Massachusetts')?.id;
      } else if (name.includes('chicago') || name.includes('illinois')) {
        stateId = states.find(s => s.name === 'Illinois')?.id;
      } else if (name.includes('losangeles') || name.includes('california')) {
        stateId = states.find(s => s.name === 'California')?.id;
      } else if (name.includes('texas')) {
        stateId = states.find(s => s.name === 'Texas')?.id;
      } else if (name.includes('washington')) {
        stateId = states.find(s => s.name === 'Washington')?.id;
      } else {
        // Default to California for national domains
        stateId = states.find(s => s.name === 'California')?.id;
      }

      // Update the domain
      await prisma.domain.update({
        where: { id: domain.id },
        data: {
          categoryId,
          stateId,
          cityId
        }
      });

      console.log(`✅ Updated ${domain.name}: category=${categoryId ? 'assigned' : 'null'}, state=${stateId ? 'assigned' : 'null'}`);
    }

    console.log('🎉 Production domains update completed!');

    // Verify the results
    const updatedDomains = await prisma.domain.findMany({
      select: {
        id: true,
        name: true,
        category: { select: { name: true } },
        state: { select: { name: true } },
        city: { select: { name: true } }
      }
    });

    console.log('\n📊 Updated domains:');
    updatedDomains.forEach(domain => {
      console.log(`${domain.name}: ${domain.category?.name || 'No category'}, ${domain.state?.name || 'No state'}`);
    });

  } catch (error) {
    console.error('❌ Error updating production domains:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProductionDomains();
