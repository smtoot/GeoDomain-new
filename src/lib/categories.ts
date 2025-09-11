// Comprehensive domain categories and industries for GeoDomainLand
// This supports the enhanced geographic scope system

export interface CategoryData {
  id: string;
  name: string;
  description: string;
  examples: string[];
  industries: string[];
}

export interface IndustryData {
  id: string;
  name: string;
  description: string;
  categories: string[];
  examples: string[];
}

// Essential 15 categories for geo-targeted domains
export const domainCategories: CategoryData[] = [
  // Business & Professional Services (4 categories)
  {
    id: "business-consulting",
    name: "Business & Consulting",
    description: "Business services, consulting, management, and advisory services",
    examples: ["TexasBusiness.com", "BusinessConsulting.com", "ManagementServices.com"],
    industries: ["Business", "Consulting", "Professional Services"]
  },
  {
    id: "legal-services",
    name: "Legal Services",
    description: "Law firms, legal consultation, attorneys, and legal services",
    examples: ["TexasLawyers.com", "LegalServices.com", "PersonalInjury.com"],
    industries: ["Legal Services", "Professional Services"]
  },
  {
    id: "real-estate",
    name: "Real Estate",
    description: "Real estate agencies, property management, and real estate services",
    examples: ["MiamiRealEstate.com", "TexasProperties.com", "HomeSales.com"],
    industries: ["Real Estate", "Property Management"]
  },
  {
    id: "marketing-advertising",
    name: "Marketing & Advertising",
    description: "Marketing agencies, advertising services, and digital marketing",
    examples: ["TexasMarketing.com", "DigitalMarketing.com", "AdvertisingAgencies.com"],
    industries: ["Marketing", "Advertising", "Digital Services"]
  },

  // Healthcare & Wellness (3 categories)
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Medical practices, clinics, and healthcare services",
    examples: ["TexasHealthcare.com", "MedicalCare.com", "HealthClinics.com"],
    industries: ["Healthcare", "Medical Services"]
  },
  {
    id: "dental-services",
    name: "Dental Services",
    description: "Dental practices, orthodontics, and dental care",
    examples: ["FloridaDentists.com", "DentalCare.com", "Orthodontics.com"],
    industries: ["Healthcare", "Medical Services"]
  },
  {
    id: "fitness-wellness",
    name: "Fitness & Wellness",
    description: "Gyms, fitness centers, and wellness services",
    examples: ["TexasFitness.com", "Gyms.com", "WellnessCenters.com"],
    industries: ["Fitness", "Health", "Wellness"]
  },

  // Home Services (3 categories)
  {
    id: "home-services",
    name: "Home Services",
    description: "Plumbing, electrical, HVAC, roofing, and home contractors",
    examples: ["TexasPlumbers.com", "ElectricalServices.com", "HVACRepair.com"],
    industries: ["Home Services", "Contracting", "Maintenance"]
  },
  {
    id: "cleaning-services",
    name: "Cleaning Services",
    description: "House cleaning, commercial cleaning, and janitorial services",
    examples: ["TexasCleaning.com", "HouseCleaning.com", "CommercialCleaning.com"],
    industries: ["Home Services", "Commercial Services"]
  },
  {
    id: "landscaping",
    name: "Landscaping",
    description: "Landscaping services, garden design, and outdoor maintenance",
    examples: ["FloridaLandscaping.com", "GardenDesign.com", "LandscapeServices.com"],
    industries: ["Home Services", "Landscaping", "Outdoor Services"]
  },

  // Food & Hospitality (2 categories)
  {
    id: "restaurants-food",
    name: "Restaurants & Food",
    description: "Restaurants, cafes, food delivery, and culinary services",
    examples: ["ChicagoRestaurants.com", "PizzaDelivery.com", "FineDining.com"],
    industries: ["Food & Beverage", "Hospitality"]
  },
  {
    id: "hotels-accommodation",
    name: "Hotels & Accommodation",
    description: "Hotels, resorts, vacation rentals, and accommodation services",
    examples: ["TexasHotels.com", "FloridaResorts.com", "VacationRentals.com"],
    industries: ["Hospitality", "Travel", "Tourism"]
  },

  // Automotive (2 categories)
  {
    id: "automotive",
    name: "Automotive",
    description: "Car dealerships, auto services, and automotive businesses",
    examples: ["TexasCars.com", "AutoSales.com", "CarDealers.com"],
    industries: ["Automotive", "Retail", "Services"]
  },
  {
    id: "auto-repair",
    name: "Auto Repair",
    description: "Auto repair shops, mechanics, and automotive services",
    examples: ["TexasAutoRepair.com", "Mechanics.com", "AutoServices.com"],
    industries: ["Automotive", "Repair Services", "Maintenance"]
  },

  // Technology (1 category)
  {
    id: "technology-services",
    name: "Technology Services",
    description: "IT services, software development, and technology consulting",
    examples: ["TexasTech.com", "SoftwareDevelopment.com", "ITServices.com"],
    industries: ["Technology", "Software", "IT Services"]
  }
];

// Industry classifications
export const industries: IndustryData[] = [
  {
    id: "hospitality",
    name: "Hospitality",
    description: "Hotels, restaurants, and accommodation services",
    categories: ["hotels", "restaurants"],
    examples: ["TexasHotels.com", "FloridaRestaurants.com"]
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Medical services, dental care, and healthcare providers",
    categories: ["doctors", "dentists", "fitness"],
    examples: ["TexasDoctors.com", "FloridaDentists.com"]
  },
  {
    id: "real-estate",
    name: "Real Estate",
    description: "Property sales, rentals, and real estate services",
    categories: ["real-estate"],
    examples: ["MiamiRealEstate.com", "TexasProperties.com"]
  },
  {
    id: "legal",
    name: "Legal Services",
    description: "Law firms and legal consultation services",
    categories: ["law"],
    examples: ["TexasLawyers.com", "LegalServices.com"]
  },
  {
    id: "automotive",
    name: "Automotive",
    description: "Car sales, auto services, and automotive businesses",
    categories: ["cars"],
    examples: ["TexasCars.com", "AutoDealers.com"]
  },
  {
    id: "home-services",
    name: "Home Services",
    description: "Home improvement, maintenance, and repair services",
    categories: ["plumbers", "electricians", "roofing", "landscaping", "cleaning"],
    examples: ["TexasPlumbers.com", "FloridaLandscaping.com"]
  },
  {
    id: "transportation",
    name: "Transportation",
    description: "Moving services, logistics, and transportation",
    categories: ["moving"],
    examples: ["TexasMoving.com", "MovingServices.com"]
  },
  {
    id: "beauty",
    name: "Beauty & Personal Care",
    description: "Salons, spas, and personal care services",
    categories: ["salons", "tattoos"],
    examples: ["TexasSalons.com", "BeautyServices.com"]
  },
  {
    id: "pet-services",
    name: "Pet Services",
    description: "Pet care, grooming, and veterinary services",
    categories: ["pet-services"],
    examples: ["TexasPetServices.com", "PetCare.com"]
  },
  {
    id: "education",
    name: "Education & Childcare",
    description: "Schools, daycares, and educational services",
    categories: ["childcare"],
    examples: ["TexasChildcare.com", "EducationServices.com"]
  },
  {
    id: "technology",
    name: "Technology",
    description: "IT services, software, and technology consulting",
    categories: ["technology"],
    examples: ["TexasTech.com", "ITServices.com"]
  },
  {
    id: "insurance",
    name: "Insurance",
    description: "Insurance agencies and financial services",
    categories: ["insurance"],
    examples: ["TexasInsurance.com", "InsuranceServices.com"]
  }
];

// Geographic scope options
export const geographicScopes = [
  {
    value: "NATIONAL",
    label: "National (USA)",
    description: "Domain targets the entire United States",
    examples: ["USAHotels.com", "AmericanRestaurants.com"]
  },
  {
    value: "STATE",
    label: "State",
    description: "Domain targets a specific state",
    examples: ["TexasHotels.com", "FloridaRestaurants.com"]
  },
  {
    value: "CITY",
    label: "City",
    description: "Domain targets a specific city",
    examples: ["HoustonHotels.com", "MiamiRestaurants.com"]
  }
];

// All 50 US states for domain targeting (alphabetical order)
export const popularStates = [
  "Alabama",
  "Alaska", 
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming"
];

// Top 50 US cities by population for domain targeting
export const popularCities = [
  // Top 50 US cities by population (2023 estimates)
  "New York City",     // 1. New York, NY
  "Los Angeles",       // 2. Los Angeles, CA
  "Chicago",           // 3. Chicago, IL
  "Houston",           // 4. Houston, TX
  "Phoenix",           // 5. Phoenix, AZ
  "Philadelphia",      // 6. Philadelphia, PA
  "San Antonio",       // 7. San Antonio, TX
  "San Diego",         // 8. San Diego, CA
  "Dallas",            // 9. Dallas, TX
  "San Jose",          // 10. San Jose, CA
  "Austin",            // 11. Austin, TX
  "Jacksonville",      // 12. Jacksonville, FL
  "Fort Worth",        // 13. Fort Worth, TX
  "Columbus",          // 14. Columbus, OH
  "Charlotte",         // 15. Charlotte, NC
  "San Francisco",     // 16. San Francisco, CA
  "Indianapolis",      // 17. Indianapolis, IN
  "Seattle",           // 18. Seattle, WA
  "Denver",            // 19. Denver, CO
  "Washington",        // 20. Washington, DC
  "Boston",            // 21. Boston, MA
  "El Paso",           // 22. El Paso, TX
  "Nashville",         // 23. Nashville, TN
  "Detroit",           // 24. Detroit, MI
  "Oklahoma City",     // 25. Oklahoma City, OK
  "Portland",          // 26. Portland, OR
  "Las Vegas",         // 27. Las Vegas, NV
  "Memphis",           // 28. Memphis, TN
  "Louisville",        // 29. Louisville, KY
  "Baltimore",         // 30. Baltimore, MD
  "Milwaukee",         // 31. Milwaukee, WI
  "Albuquerque",       // 32. Albuquerque, NM
  "Tucson",            // 33. Tucson, AZ
  "Fresno",            // 34. Fresno, CA
  "Sacramento",        // 35. Sacramento, CA
  "Mesa",              // 36. Mesa, AZ
  "Kansas City",       // 37. Kansas City, MO
  "Atlanta",           // 38. Atlanta, GA
  "Long Beach",        // 39. Long Beach, CA
  "Colorado Springs",  // 40. Colorado Springs, CO
  "Raleigh",           // 41. Raleigh, NC
  "Miami",             // 42. Miami, FL
  "Virginia Beach",    // 43. Virginia Beach, VA
  "Omaha",             // 44. Omaha, NE
  "Oakland",           // 45. Oakland, CA
  "Minneapolis",       // 46. Minneapolis, MN
  "Tulsa",             // 47. Tulsa, OK
  "Arlington",         // 48. Arlington, TX
  "Tampa",             // 49. Tampa, FL
  "New Orleans"        // 50. New Orleans, LA
];

// Utility functions
export function getCategoryById(id: string): CategoryData | undefined {
  return domainCategories.find(category => category.id === id);
}

export function getIndustryById(id: string): IndustryData | undefined {
  return industries.find(industry => industry.id === id);
}

export function getCategoriesByIndustry(industryId: string): CategoryData[] {
  const industry = getIndustryById(industryId);
  if (!industry) return [];
  
  return domainCategories.filter(category => 
    industry.categories.includes(category.id)
  );
}

export function getIndustriesByCategory(categoryId: string): IndustryData[] {
  return industries.filter(industry => 
    industry.categories.includes(categoryId)
  );
}

export function getGeographicScopeByValue(value: string) {
  return geographicScopes.find(scope => scope.value === value);
}

// Domain name generation helpers
export function generateDomainName(
  geographicScope: string,
  state?: string,
  city?: string,
  category?: string
): string {
  let location = "";
  
  switch (geographicScope) {
    case "NATIONAL":
      location = "USA";
      break;
    case "STATE":
      location = state || "";
      break;
    case "CITY":
      location = city || "";
      break;
  }
  
  const categoryName = category || "Business";
  return `${location}${categoryName}.com`.replace(/\s+/g, "");
}

export function getDomainExamples(
  geographicScope: string,
  category?: string
): string[] {
  const categoryData = category ? getCategoryById(category) : null;
  const examples = categoryData?.examples || [];
  
  return examples.filter(example => {
    switch (geographicScope) {
      case "NATIONAL":
        return example.includes("USA") || example.includes("American");
      case "STATE":
        return example.includes("Texas") || example.includes("Florida") || example.includes("California");
      case "CITY":
        return example.includes("Houston") || example.includes("Miami") || example.includes("Chicago");
      default:
        return true;
    }
  });
}
