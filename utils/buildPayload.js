import { normalizeTaxonomies } from './formDefaults.js';

/**
 * Builds the payload object for the 'travel' module.
 * @param {Object} formData
 * @param {boolean} isDraft
 * @returns {Object}
 */
export const buildTravelPayload = (formData, isDraft) => ({
  title: formData.title,
  title_en: formData.title_en || '',
  description: formData.description || '',
  description_en: formData.description_en || '',
  subtitle: formData.subtitle || '',
  subtitle_en: formData.subtitle_en || '',
  overview: formData.overview || '',
  overview_en: formData.overview_en || '',
  destination_en: formData.destination_en || '',
  agency: formData.agency || 'Sueño Travel Chile',
  flavor_text: formData.flavorText || formData.agency || '',
  flavor_text_en: formData.flavorText_en || '',
  duration_days: parseInt(formData.durationDays) || 0,
  duration_nights: parseInt(formData.durationNights) || 0,
  allow_private: formData.allowPrivate || false,
  private_price_from: formData.privatePriceFrom || '',
  is_published: !isDraft,
  created_at: new Date().toISOString(),
  destinations_summary: typeof formData.destinationsSummary === 'string'
    ? formData.destinationsSummary.split(',').map(x => x.trim()).filter(Boolean)
    : formData.destinationsSummary || [],
  destinations_summary_en: typeof formData.destinationsSummary_en === 'string'
    ? formData.destinationsSummary_en.split(',').map(x => x.trim()).filter(Boolean)
    : formData.destinationsSummary_en || [],
  pricing_and_notes: {
    visaCostUSD: parseFloat(formData.visaCostUSD) || 0,
    hotelTaxUSD: parseFloat(formData.hotelTaxUSD) || 0,
    disclaimer: formData.disclaimer || ''
  },
  // Keep legacy mappings for compatibility
  services_included: {
    egypt: typeof formData.servicesIncludedEgypt === 'string'
      ? formData.servicesIncludedEgypt.split('\n').map(x => x.trim()).filter(Boolean)
      : formData.servicesIncludedEgypt || [],
    turkey: typeof formData.servicesIncludedTurkey === 'string'
      ? formData.servicesIncludedTurkey.split('\n').map(x => x.trim()).filter(Boolean)
      : formData.servicesIncludedTurkey || []
  },
  services_excluded: typeof formData.servicesExcluded === 'string'
    ? formData.servicesExcluded.split('\n').map(x => x.trim()).filter(Boolean)
    : formData.servicesExcluded || [],
  
  // New rich travel mapping
  itinerary: formData.itinerary || [],
  services_included_list: formData.servicesIncludedList || [],
  services_excluded_list: (formData.servicesExcludedList || []).map(x => x.trim()).filter(Boolean),
  services_excluded_list_en: (formData.servicesExcludedList_en || []).map(x => x.trim()).filter(Boolean),
  hotels_planned: formData.hotelsPlanned || [],
  
  // Image properties
  image_url: formData.imageUrl || formData.image_url || '',
  header_image_url: formData.headerImageUrl || formData.header_image_url || ''
});

/**
 * Builds the payload object for the 'design_tokens' module.
 * @param {Object} formData
 * @param {boolean} isDraft
 * @returns {Object}
 */
export const buildDesignTokensPayload = (formData, isDraft) => ({
  brand_name: formData.brandName,
  colors: formData.colors || [],
  typographies: formData.typographies || [],
  logos: formData.logos || [],
  url: formData.url || '',
  is_draft: isDraft
});

/**
 * Builds the payload object for the 'terms' module.
 * @param {Object} formData
 * @param {Object} taxonomiesConfig - config.taxonomies
 * @param {boolean} isDraft
 * @returns {Object}
 */
export const buildTermsPayload = (formData, taxonomiesConfig, isDraft) => {
  const catObj = {
    targetResult: formData.targetResult || 'otro'
  };
  const normalizedTax = normalizeTaxonomies(taxonomiesConfig);

  Object.keys(normalizedTax).forEach(taxKey => {
    catObj[taxKey] = formData[taxKey] || (normalizedTax[taxKey].items && normalizedTax[taxKey].items[0]?.val) || 'all';
  });

  const splitLines = (val) =>
    typeof val === 'string' ? val.split('\n').map(x => x.trim()).filter(Boolean) : val;

  return {
    title: formData.title,
    category: JSON.stringify(catObj),
    description: formData.description,
    url: formData.url || '',
    video_url: JSON.stringify((formData.videos || []).filter(Boolean)),
    is_draft: isDraft,
    prompt: formData.prompt,
    tools: formData.tools || [],
    problems: splitLines(formData.problems),
    benefits: splitLines(formData.benefits),
    recommended_scenarios: splitLines(formData.recommendedScenarios),
    critical_exclusions: splitLines(formData.criticalExclusions),
    technical_example: formData.technicalExample || '',
    steps: formData.steps || [],
    results: formData.results || '',
    metrics: formData.metrics || '',
    prompt_vars: typeof formData.promptVars === 'string'
      ? formData.promptVars.split(',').map(x => x.trim()).filter(Boolean)
      : formData.promptVars
  };
};

/**
 * Builds the payload object for the 'location' module.
 * @param {Object} formData
 * @param {boolean} isDraft
 * @returns {Object}
 */
export const buildLocationPayload = (formData, isDraft) => {
  const splitLines = (val) =>
    typeof val === 'string' ? val.split('\n').map(x => x.trim()).filter(Boolean) : val;
    
  const splitComma = (val) =>
    typeof val === 'string' ? val.split(',').map(x => x.trim()).filter(Boolean) : val;

  return {
    name: formData.name,
    type: formData.type || 'location',
    subtitle: formData.subtitle || '',
    travel_styles: splitComma(formData.travelStyles || []),
    guide_best_season: formData.guideBestSeason || '',
    guide_how_to_get_around: formData.guideHowToGetAround || '',
    guide_recommended_duration: formData.guideRecommendedDuration || '',
    map_url: formData.mapUrl || '',
    image_url: formData.imageUrl || '',
    image_urls: formData.imageUrls || [],
    suggested_itineraries: formData.suggestedItineraries || [],
    location_type: formData.locationType || '',
    parent_region_id: formData.parentRegionId || null,
    parent_city_id: formData.parentCityId || null,
    map_pos_x: formData.mapPosX !== undefined && formData.mapPosX !== '' ? parseFloat(formData.mapPosX) : null,
    map_pos_y: formData.mapPosY !== undefined && formData.mapPosY !== '' ? parseFloat(formData.mapPosY) : null,
    address: formData.address || '',
    city: formData.city || '',
    country: formData.country || '',
    geolocation_url: formData.geolocationUrl || '',
    opening_hours: formData.openingHours || '',
    pricing: formData.pricing || '',
    ticket_url: formData.ticketUrl || '',
    estimated_visit_time: formData.estimatedVisitTime || '',
    amenities: {
      parking: false,
      accessibility: false,
      restrooms: false,
      petFriendly: false,
      kidsFriendly: false,
      ...(formData.amenities || {}),
      mapIcon: formData.mapIcon || ''
    },
    description: formData.description || '',
    highlights: splitLines(formData.highlights || []),
    traveler_tips: formData.travelerTips || '',
    nearby_locations: splitLines(formData.nearbyLocations || []),
    is_draft: isDraft
  };
};

/**
 * Builds the payload object for the 'departure' module.
 * @param {Object} formData
 * @param {boolean} isDraft
 * @returns {Object}
 */
export const buildDeparturePayload = (formData, isDraft) => ({
  travel_id: formData.travelId,
  departure_date: formData.departureDate,
  end_date: formData.endDate || null,
  capacity: parseInt(formData.capacity) || 0,
  passengers_count: parseInt(formData.passengersCount) || 0,
  price_override: formData.priceOverride ? parseFloat(formData.priceOverride) : null,
  status: formData.status || 'open',
  is_draft: isDraft
});

/**
 * Builds the payload object for the 'blog' module.
 * @param {Object} formData
 * @param {boolean} isDraft
 * @returns {Object}
 */
export const buildBlogPayload = (formData, isDraft) => ({
  title: formData.title || '',
  slug: formData.slug || '',
  author: formData.author || '',
  category: formData.category || '',
  read_time: parseInt(formData.readTime) || 0,
  summary: formData.summary || '',
  cover_image: formData.coverImage || '',
  tags: formData.tags || [],
  content: formData.content || '',
  is_draft: isDraft,
  created_at: new Date().toISOString()
});

