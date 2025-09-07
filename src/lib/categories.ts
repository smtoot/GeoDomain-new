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

// Comprehensive domain categories/keywords
export const domainCategories: CategoryData[] = [
  // Hospitality & Travel
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
    id: "travel",
    name: "Travel & Tourism",
    description: "Travel agencies, tour operators, and tourism services",
    examples: ["TexasTravel.com", "FloridaTours.com", "TravelAgencies.com"],
    industries: ["Travel", "Tourism", "Hospitality"]
  },
  {
    id: "vacation-rentals",
    name: "Vacation Rentals",
    description: "Short-term rentals, vacation homes, and rental properties",
    examples: ["FloridaRentals.com", "BeachHouses.com", "VacationHomes.com"],
    industries: ["Real Estate", "Hospitality", "Travel"]
  },

  // Real Estate & Property
  {
    id: "real-estate",
    name: "Real Estate",
    description: "Real estate agencies, property management, and real estate services",
    examples: ["MiamiRealEstate.com", "TexasProperties.com", "HomeSales.com"],
    industries: ["Real Estate", "Property Management", "Construction"]
  },
  {
    id: "property-management",
    name: "Property Management",
    description: "Property management companies and rental property services",
    examples: ["TexasPropertyManagement.com", "RentalProperties.com", "PropertyServices.com"],
    industries: ["Real Estate", "Property Management", "Services"]
  },
  {
    id: "home-construction",
    name: "Home Construction",
    description: "Home builders, construction companies, and building contractors",
    examples: ["TexasBuilders.com", "CustomHomes.com", "ConstructionCompanies.com"],
    industries: ["Construction", "Real Estate", "Building"]
  },

  // Professional Services
  {
    id: "law",
    name: "Legal Services",
    description: "Law firms, legal services, and legal consultation",
    examples: ["TexasLawyers.com", "PersonalInjury.com", "LegalHelp.com"],
    industries: ["Legal Services", "Professional Services"]
  },
  {
    id: "accounting",
    name: "Accounting Services",
    description: "Accounting firms, tax services, and financial consulting",
    examples: ["TexasAccounting.com", "TaxServices.com", "FinancialConsulting.com"],
    industries: ["Accounting", "Financial Services", "Professional Services"]
  },
  {
    id: "consulting",
    name: "Business Consulting",
    description: "Business consultants, management consulting, and advisory services",
    examples: ["TexasConsulting.com", "BusinessAdvisors.com", "ManagementConsulting.com"],
    industries: ["Consulting", "Professional Services", "Business"]
  },
  {
    id: "marketing",
    name: "Marketing & Advertising",
    description: "Marketing agencies, advertising services, and digital marketing",
    examples: ["TexasMarketing.com", "DigitalMarketing.com", "AdvertisingAgencies.com"],
    industries: ["Marketing", "Advertising", "Digital Services"]
  },

  // Healthcare & Medical
  {
    id: "healthcare",
    name: "Healthcare Services",
    description: "Medical practices, clinics, and healthcare services",
    examples: ["TexasHealthcare.com", "MedicalCare.com", "HealthClinics.com"],
    industries: ["Healthcare", "Medical Services"]
  },
  {
    id: "dentists",
    name: "Dental Services",
    description: "Dental practices, orthodontics, and dental care",
    examples: ["FloridaDentists.com", "DentalCare.com", "Orthodontics.com"],
    industries: ["Healthcare", "Medical Services"]
  },
  {
    id: "veterinarians",
    name: "Veterinary Services",
    description: "Veterinary clinics, animal hospitals, and pet care",
    examples: ["TexasVets.com", "AnimalHospitals.com", "PetCare.com"],
    industries: ["Healthcare", "Veterinary", "Pet Services"]
  },
  {
    id: "mental-health",
    name: "Mental Health Services",
    description: "Mental health clinics, counseling, and therapy services",
    examples: ["TexasTherapy.com", "MentalHealthClinics.com", "CounselingServices.com"],
    industries: ["Healthcare", "Mental Health", "Therapy"]
  },

  // Financial Services
  {
    id: "insurance",
    name: "Insurance",
    description: "Insurance agencies, brokers, and insurance services",
    examples: ["TexasInsurance.com", "AutoInsurance.com", "LifeInsurance.com"],
    industries: ["Insurance", "Financial Services"]
  },
  {
    id: "banking",
    name: "Banking & Finance",
    description: "Banks, credit unions, and financial institutions",
    examples: ["TexasBanking.com", "CreditUnions.com", "FinancialServices.com"],
    industries: ["Banking", "Financial Services", "Finance"]
  },
  {
    id: "investment",
    name: "Investment Services",
    description: "Investment firms, financial advisors, and wealth management",
    examples: ["TexasInvestment.com", "WealthManagement.com", "FinancialAdvisors.com"],
    industries: ["Investment", "Financial Services", "Wealth Management"]
  },

  // Automotive
  {
    id: "cars",
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
  {
    id: "auto-parts",
    name: "Auto Parts",
    description: "Auto parts stores, car accessories, and automotive supplies",
    examples: ["TexasAutoParts.com", "CarParts.com", "AutoAccessories.com"],
    industries: ["Automotive", "Retail", "Parts"]
  },

  // Home Services
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
    id: "hvac",
    name: "HVAC Services",
    description: "Heating, ventilation, and air conditioning services",
    examples: ["TexasHVAC.com", "AirConditioning.com", "HeatingServices.com"],
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
    id: "pest-control",
    name: "Pest Control",
    description: "Pest control services, exterminators, and pest management",
    examples: ["TexasPestControl.com", "Exterminators.com", "PestManagement.com"],
    industries: ["Home Services", "Pest Control", "Maintenance"]
  },

  // Technology & Digital
  {
    id: "technology",
    name: "Technology Services",
    description: "IT services, software development, and technology consulting",
    examples: ["TexasTech.com", "SoftwareDevelopment.com", "ITServices.com"],
    industries: ["Technology", "Software", "IT Services"]
  },
  {
    id: "web-design",
    name: "Web Design & Development",
    description: "Web design agencies, website development, and digital services",
    examples: ["TexasWebDesign.com", "WebsiteDevelopment.com", "DigitalAgencies.com"],
    industries: ["Technology", "Web Design", "Digital Services"]
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    description: "Cybersecurity services, data protection, and IT security",
    examples: ["TexasCybersecurity.com", "DataProtection.com", "ITSecurity.com"],
    industries: ["Technology", "Security", "IT Services"]
  },

  // Education & Training
  {
    id: "education",
    name: "Education Services",
    description: "Schools, tutoring services, and educational institutions",
    examples: ["TexasEducation.com", "TutoringServices.com", "EducationalInstitutions.com"],
    industries: ["Education", "Training", "Learning"]
  },
  {
    id: "training",
    name: "Professional Training",
    description: "Professional development, corporate training, and skill development",
    examples: ["TexasTraining.com", "ProfessionalDevelopment.com", "CorporateTraining.com"],
    industries: ["Education", "Training", "Professional Development"]
  },

  // Fitness & Wellness
  {
    id: "fitness",
    name: "Fitness & Wellness",
    description: "Gyms, fitness centers, and wellness services",
    examples: ["TexasFitness.com", "Gyms.com", "WellnessCenters.com"],
    industries: ["Fitness", "Health", "Wellness"]
  },
  {
    id: "spas",
    name: "Spas & Beauty",
    description: "Spas, beauty salons, and wellness treatments",
    examples: ["TexasSpas.com", "BeautySalons.com", "WellnessTreatments.com"],
    industries: ["Beauty", "Wellness", "Personal Care"]
  },

  // Transportation & Logistics
  {
    id: "moving",
    name: "Moving Services",
    description: "Moving companies, relocation services, and storage solutions",
    examples: ["TexasMoving.com", "MovingCompanies.com", "RelocationServices.com"],
    industries: ["Transportation", "Logistics", "Home Services"]
  },
  {
    id: "trucking",
    name: "Trucking & Logistics",
    description: "Trucking companies, freight services, and logistics",
    examples: ["TexasTrucking.com", "FreightServices.com", "LogisticsCompanies.com"],
    industries: ["Transportation", "Logistics", "Freight"]
  },

  // Retail & E-commerce
  {
    id: "retail",
    name: "Retail & E-commerce",
    description: "Retail stores, online shops, and e-commerce businesses",
    examples: ["TexasRetail.com", "OnlineStores.com", "EcommerceBusinesses.com"],
    industries: ["Retail", "E-commerce", "Sales"]
  },
  {
    id: "fashion",
    name: "Fashion & Apparel",
    description: "Clothing stores, fashion boutiques, and apparel businesses",
    examples: ["TexasFashion.com", "ClothingStores.com", "FashionBoutiques.com"],
    industries: ["Fashion", "Retail", "Apparel"]
  },

  // Entertainment & Events
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Entertainment venues, event planning, and entertainment services",
    examples: ["TexasEntertainment.com", "EventPlanning.com", "EntertainmentVenues.com"],
    industries: ["Entertainment", "Events", "Recreation"]
  },
  {
    id: "wedding",
    name: "Wedding Services",
    description: "Wedding planners, venues, and wedding-related services",
    examples: ["TexasWeddings.com", "WeddingPlanners.com", "WeddingVenues.com"],
    industries: ["Entertainment", "Events", "Wedding"]
  },

  // Agriculture & Food
  {
    id: "agriculture",
    name: "Agriculture & Farming",
    description: "Farms, agricultural services, and farming equipment",
    examples: ["TexasFarming.com", "AgriculturalServices.com", "FarmingEquipment.com"],
    industries: ["Agriculture", "Farming", "Food Production"]
  },
  {
    id: "food-service",
    name: "Food Service",
    description: "Catering services, food trucks, and food service businesses",
    examples: ["TexasCatering.com", "FoodTrucks.com", "FoodServiceBusinesses.com"],
    industries: ["Food Service", "Catering", "Hospitality"]
  },

  // Manufacturing & Industrial
  {
    id: "manufacturing",
    name: "Manufacturing",
    description: "Manufacturing companies, industrial services, and production",
    examples: ["TexasManufacturing.com", "IndustrialServices.com", "ProductionCompanies.com"],
    industries: ["Manufacturing", "Industrial", "Production"]
  },
  {
    id: "construction",
    name: "Construction",
    description: "Construction companies, contractors, and building services",
    examples: ["TexasConstruction.com", "Contractors.com", "BuildingServices.com"],
    industries: ["Construction", "Building", "Contracting"]
  },

  // Energy & Utilities
  {
    id: "energy",
    name: "Energy & Utilities",
    description: "Energy companies, utilities, and power services",
    examples: ["TexasEnergy.com", "Utilities.com", "PowerServices.com"],
    industries: ["Energy", "Utilities", "Power"]
  },
  {
    id: "solar",
    name: "Solar & Renewable Energy",
    description: "Solar companies, renewable energy, and green energy services",
    examples: ["TexasSolar.com", "RenewableEnergy.com", "GreenEnergyServices.com"],
    industries: ["Energy", "Renewable", "Solar"]
  },

  // Security & Safety
  {
    id: "security",
    name: "Security Services",
    description: "Security companies, surveillance, and safety services",
    examples: ["TexasSecurity.com", "Surveillance.com", "SafetyServices.com"],
    industries: ["Security", "Safety", "Protection"]
  },
  {
    id: "fire-safety",
    name: "Fire Safety",
    description: "Fire protection, fire safety equipment, and emergency services",
    examples: ["TexasFireSafety.com", "FireProtection.com", "EmergencyServices.com"],
    industries: ["Safety", "Fire Protection", "Emergency"]
  },

  // Non-Profit & Community
  {
    id: "non-profit",
    name: "Non-Profit Organizations",
    description: "Charities, non-profits, and community organizations",
    examples: ["TexasNonProfits.com", "Charities.com", "CommunityOrganizations.com"],
    industries: ["Non-Profit", "Charity", "Community"]
  },
  {
    id: "religious",
    name: "Religious Organizations",
    description: "Churches, religious institutions, and faith-based organizations",
    examples: ["TexasChurches.com", "ReligiousInstitutions.com", "FaithBasedOrganizations.com"],
    industries: ["Religious", "Faith", "Community"]
  },

  // Government & Public Services
  {
    id: "government",
    name: "Government Services",
    description: "Government agencies, public services, and civic organizations",
    examples: ["TexasGovernment.com", "PublicServices.com", "CivicOrganizations.com"],
    industries: ["Government", "Public Services", "Civic"]
  },
  {
    id: "emergency-services",
    name: "Emergency Services",
    description: "Emergency response, disaster relief, and crisis services",
    examples: ["TexasEmergency.com", "DisasterRelief.com", "CrisisServices.com"],
    industries: ["Emergency", "Disaster Relief", "Crisis"]
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
