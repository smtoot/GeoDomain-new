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

// Popular domain categories/keywords
export const domainCategories: CategoryData[] = [
  {
    id: "hotels",
    name: "Hotels & Accommodation",
    description: "Hotel chains, boutique hotels, resorts, and accommodation services",
    examples: ["TexasHotels.com", "FloridaResorts.com", "NYCHotels.com"],
    industries: ["Hospitality", "Travel", "Tourism"]
  },
  {
    id: "restaurants",
    name: "Restaurants & Food",
    description: "Restaurants, cafes, food delivery, and culinary services",
    examples: ["ChicagoRestaurants.com", "PizzaDelivery.com", "FineDining.com"],
    industries: ["Food & Beverage", "Hospitality", "Retail"]
  },
  {
    id: "real-estate",
    name: "Real Estate",
    description: "Real estate agencies, property management, and real estate services",
    examples: ["MiamiRealEstate.com", "TexasProperties.com", "HomeSales.com"],
    industries: ["Real Estate", "Property Management", "Construction"]
  },
  {
    id: "law",
    name: "Legal Services",
    description: "Law firms, legal services, and legal consultation",
    examples: ["TexasLawyers.com", "PersonalInjury.com", "LegalHelp.com"],
    industries: ["Legal Services", "Professional Services"]
  },
  {
    id: "dentists",
    name: "Dental Services",
    description: "Dental practices, orthodontics, and dental care",
    examples: ["FloridaDentists.com", "DentalCare.com", "Orthodontics.com"],
    industries: ["Healthcare", "Medical Services"]
  },
  {
    id: "doctors",
    name: "Medical Services",
    description: "Medical practices, clinics, and healthcare services",
    examples: ["TexasDoctors.com", "MedicalCare.com", "HealthClinics.com"],
    industries: ["Healthcare", "Medical Services"]
  },
  {
    id: "insurance",
    name: "Insurance",
    description: "Insurance agencies, brokers, and insurance services",
    examples: ["TexasInsurance.com", "AutoInsurance.com", "LifeInsurance.com"],
    industries: ["Insurance", "Financial Services"]
  },
  {
    id: "cars",
    name: "Automotive",
    description: "Car dealerships, auto services, and automotive businesses",
    examples: ["TexasCars.com", "AutoSales.com", "CarDealers.com"],
    industries: ["Automotive", "Retail", "Services"]
  },
  {
    id: "plumbers",
    name: "Plumbing Services",
    description: "Plumbing contractors, repair services, and plumbing supplies",
    examples: ["TexasPlumbers.com", "PlumbingRepair.com", "PlumbingServices.com"],
    industries: ["Construction", "Home Services", "Contracting"]
  },
  {
    id: "electricians",
    name: "Electrical Services",
    description: "Electrical contractors, repair services, and electrical work",
    examples: ["FloridaElectricians.com", "ElectricalRepair.com", "ElectricServices.com"],
    industries: ["Construction", "Home Services", "Contracting"]
  },
  {
    id: "roofing",
    name: "Roofing Services",
    description: "Roofing contractors, repair services, and roofing materials",
    examples: ["TexasRoofing.com", "RoofingContractors.com", "RoofRepair.com"],
    industries: ["Construction", "Home Services", "Contracting"]
  },
  {
    id: "landscaping",
    name: "Landscaping",
    description: "Landscaping services, garden design, and outdoor maintenance",
    examples: ["FloridaLandscaping.com", "GardenDesign.com", "LandscapeServices.com"],
    industries: ["Home Services", "Landscaping", "Outdoor Services"]
  },
  {
    id: "cleaning",
    name: "Cleaning Services",
    description: "House cleaning, commercial cleaning, and janitorial services",
    examples: ["TexasCleaning.com", "HouseCleaning.com", "CommercialCleaning.com"],
    industries: ["Home Services", "Commercial Services", "Maintenance"]
  },
  {
    id: "moving",
    name: "Moving Services",
    description: "Moving companies, relocation services, and storage solutions",
    examples: ["TexasMoving.com", "MovingCompanies.com", "RelocationServices.com"],
    industries: ["Transportation", "Logistics", "Home Services"]
  },
  {
    id: "fitness",
    name: "Fitness & Health",
    description: "Gyms, fitness centers, personal training, and health clubs",
    examples: ["TexasFitness.com", "GymMembership.com", "PersonalTraining.com"],
    industries: ["Health & Fitness", "Wellness", "Sports"]
  },
  {
    id: "salons",
    name: "Beauty & Salons",
    description: "Hair salons, beauty salons, spas, and beauty services",
    examples: ["TexasSalons.com", "HairSalons.com", "BeautyServices.com"],
    industries: ["Beauty", "Personal Care", "Wellness"]
  },
  {
    id: "tattoos",
    name: "Tattoo & Piercing",
    description: "Tattoo parlors, piercing studios, and body art services",
    examples: ["TexasTattoos.com", "TattooStudios.com", "BodyArt.com"],
    industries: ["Beauty", "Personal Care", "Art"]
  },
  {
    id: "pet-services",
    name: "Pet Services",
    description: "Pet grooming, veterinary services, and pet care",
    examples: ["TexasPetServices.com", "PetGrooming.com", "VetServices.com"],
    industries: ["Pet Services", "Veterinary", "Animal Care"]
  },
  {
    id: "childcare",
    name: "Childcare & Education",
    description: "Daycares, preschools, tutoring services, and educational programs",
    examples: ["TexasChildcare.com", "DaycareCenters.com", "TutoringServices.com"],
    industries: ["Education", "Childcare", "Family Services"]
  },
  {
    id: "technology",
    name: "Technology",
    description: "IT services, software development, and technology consulting",
    examples: ["TexasTech.com", "ITServices.com", "SoftwareDevelopment.com"],
    industries: ["Technology", "Information Technology", "Consulting"]
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

// Popular US states for domain targeting
export const popularStates = [
  "Texas",
  "Florida",
  "California",
  "New York",
  "Illinois",
  "Pennsylvania",
  "Ohio",
  "Georgia",
  "North Carolina",
  "Michigan",
  "New Jersey",
  "Virginia",
  "Washington",
  "Arizona",
  "Massachusetts",
  "Tennessee",
  "Indiana",
  "Missouri",
  "Maryland",
  "Colorado",
  "Wisconsin",
  "Minnesota",
  "South Carolina",
  "Alabama",
  "Louisiana",
  "Kentucky",
  "Oregon",
  "Oklahoma",
  "Connecticut",
  "Utah",
  "Iowa",
  "Nevada",
  "Arkansas",
  "Mississippi",
  "Kansas",
  "New Mexico",
  "Nebraska",
  "West Virginia",
  "Idaho",
  "Hawaii",
  "New Hampshire",
  "Maine",
  "Montana",
  "Rhode Island",
  "Delaware",
  "South Dakota",
  "North Dakota",
  "Alaska",
  "Vermont",
  "Wyoming"
];

// Popular US cities for domain targeting
export const popularCities = [
  // Texas
  "Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Lubbock",
  // Florida
  "Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Tallahassee", "Fort Lauderdale", "Port St. Lucie", "Cape Coral",
  // California
  "Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach", "Oakland", "Bakersfield", "Anaheim",
  // New York
  "New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon", "Schenectady", "Utica",
  // Illinois
  "Chicago", "Aurora", "Rockford", "Joliet", "Naperville", "Springfield", "Peoria", "Elgin", "Waukegan", "Champaign",
  // Pennsylvania
  "Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Bethlehem", "Lancaster", "Harrisburg", "Altoona",
  // Ohio
  "Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton", "Lorain", "Hamilton",
  // Georgia
  "Atlanta", "Augusta", "Columbus", "Macon", "Savannah", "Athens", "Sandy Springs", "Roswell", "Albany", "Johns Creek",
  // North Carolina
  "Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington", "High Point", "Greenville",
  // Michigan
  "Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Lansing", "Ann Arbor", "Flint", "Dearborn", "Livonia", "Westland"
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
