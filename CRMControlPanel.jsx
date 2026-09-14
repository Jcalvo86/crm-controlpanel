import React, { useState, useEffect } from 'react';
import { parseCategory } from './utils/parseCategory.js';
import { SupabaseRESTService } from './adapters/SupabaseRESTService.js';
import HoldToConfirmButton from './components/HoldToConfirmButton.jsx';
import { createEmptyFormData, derivePanelsFromItem, normalizeTaxonomies } from './utils/formDefaults.js';
import { buildTravelPayload, buildDesignTokensPayload, buildTermsPayload, buildLocationPayload, buildDeparturePayload, buildBlogPayload } from './utils/buildPayload.js';
import TravelFormEditor from './editors/TravelFormEditor.jsx';
import DesignTokensFormEditor from './editors/DesignTokensFormEditor.jsx';
import TermsFormEditor from './editors/TermsFormEditor.jsx';
import LocationFormEditor from './editors/LocationFormEditor.jsx';
import DepartureFormEditor from './editors/DepartureFormEditor.jsx';
import BlogFormEditor from './editors/BlogFormEditor.jsx';
import AppHeader from './components/AppHeader.jsx';
import LoginView from './components/LoginView.jsx';
import ItemsTable from './components/ItemsTable.jsx';
import DashboardView from './components/DashboardView.jsx';
import AccountsManager from './components/AccountsManager.jsx';


export default function CRMControlPanel({ config, session: propSession, setSession: propSetSession }) {
  const [localSession, setLocalSession] = useState(null);
  const session = propSession !== undefined ? propSession : localSession;
  const setSession = propSetSession || setLocalSession;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Taxonomies defaults and resolution
  const DEFAULT_WORK_AREAS = [
    { val: 'codigo', label: '💻 Código' },
    { val: 'diseño', label: '🎨 Diseño' },
    { val: 'mrkt', label: '📈 Marketing' },
    { val: 'gestion', label: '📋 Gestión' }
  ];

  const DEFAULT_CONTENT_TYPES = [
    { val: 'herramienta', label: '🔧 Herramienta' },
    { val: 'framework', label: '📦 Framework' },
    { val: 'regla', label: '📜 Regla' },
    { val: 'metodologia', label: '💡 Metodología' }
  ];

  const workAreas = config.taxonomies?.workAreas?.map(wa => ({
    val: wa.val,
    label: `${wa.icon || ''} ${wa.label}`.trim()
  })) || DEFAULT_WORK_AREAS;

  const contentTypes = config.taxonomies?.contentTypes?.map(ct => ({
    val: ct.val,
    label: `${ct.icon || ''} ${ct.label}`.trim()
  })) || DEFAULT_CONTENT_TYPES;

  // CMS state
  const [items, setItems] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAlphabetical, setSortAlphabetical] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [creatingTypeSelected, setCreatingTypeSelected] = useState(false);
  const [formData, setFormData] = useState(() => createEmptyFormData(workAreas, contentTypes));
  const [selectedId, setSelectedId] = useState(null);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    identity: true,
    steps: true,
    problems: true,
    metrics: true,
    prompt: true,
    scenarios: true,
    code: true,
    videos: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const [activePanels, setActivePanels] = useState({
    steps: false,
    problems: false,
    metrics: false,
    prompt: false,
    scenarios: false,
    code: false,
    videos: false,
    color: false,
    typography: false,
    mapPosition: false,
    images: true,
  });

  const [showAllResults, setShowAllResults] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationLog, setTranslationLog] = useState([]);
  const [translationProgress, setTranslationProgress] = useState(0);

  const allResultsFromData = React.useMemo(() => {
    if (activeModule !== 'terms') return [];
    const set = new Set();
    items.forEach(item => {
      try {
        let cat = item.category;
        if (cat && typeof cat === 'string') {
          if (cat.startsWith('{')) {
            const parsed = JSON.parse(cat);
            if (parsed.targetResult) {
              parsed.targetResult.split(',').forEach(r => {
                const cleaned = r.trim();
                if (cleaned) set.add(cleaned);
              });
            }
          } else {
            const parsed = parseCategory(cat);
            if (parsed.targetResult) {
              parsed.targetResult.split(',').forEach(r => {
                const cleaned = r.trim();
                if (cleaned) set.add(cleaned);
              });
            }
          }
        }
      } catch (e) { }
    });
    return Array.from(set);
  }, [items, activeModule]);

  const mergedResultsOptions = React.useMemo(() => {
    const list = [
      { val: 'reducir_tokens', label: '📉 Reducir tokens' },
      { val: 'no_parezca_ai', label: '🤖 Que no parezca AI' },
      { val: 'crear_marca', label: '🎨 Crear una marca' },
      { val: 'otro', label: '💡 General' }
    ];
    const predefinedVals = list.map(o => o.val);
    allResultsFromData.forEach(r => {
      if (!predefinedVals.includes(r)) {
        const displayLabel = r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        list.push({ val: r, label: `💡 ${displayLabel}` });
      }
    });
    const selectedResults = (formData.targetResult || '').split(',').map(x => x.trim()).filter(Boolean);
    selectedResults.forEach(r => {
      if (!list.some(o => o.val === r)) {
        const displayLabel = r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        list.push({ val: r, label: `💡 ${displayLabel}` });
      }
    });
    return list;
  }, [allResultsFromData, formData.targetResult]);

  // Dynamic step management helpers
  const handleStepChange = (index, field, value) => {
    const nextSteps = [...(formData.steps || [])];
    nextSteps[index] = { ...nextSteps[index], [field]: value };
    setFormData({ ...formData, steps: nextSteps });
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...(formData.steps || []), { label: '', detail: '' }]
    });
  };

  const removeStep = (index) => {
    const nextSteps = [...(formData.steps || [])];
    nextSteps.splice(index, 1);
    setFormData({ ...formData, steps: nextSteps });
  };

  const addTool = (tool) => {
    const trimmed = tool.trim();
    if (!trimmed) return;
    const toolsArr = Array.isArray(formData.tools) ? formData.tools : [];
    if (toolsArr.includes(trimmed)) return;
    setFormData({ ...formData, tools: [...toolsArr, trimmed] });
  };

  const removeTool = (index) => {
    const toolsArr = Array.isArray(formData.tools) ? [...formData.tools] : [];
    toolsArr.splice(index, 1);
    setFormData({ ...formData, tools: toolsArr });
  };

  const handleColorChange = (index, field, value) => {
    const nextColors = [...(formData.colors || [])];
    nextColors[index] = { ...nextColors[index], [field]: value };
    setFormData({ ...formData, colors: nextColors });
  };
  const addColor = () => {
    setFormData({ ...formData, colors: [...(formData.colors || []), { hex: '', role: '', description: '' }] });
  };
  const removeColor = (index) => {
    const nextColors = [...(formData.colors || [])];
    nextColors.splice(index, 1);
    setFormData({ ...formData, colors: nextColors });
  };

  const handleTypographyChange = (index, field, value) => {
    const nextTypos = [...(formData.typographies || [])];
    nextTypos[index] = { ...nextTypos[index], [field]: value };
    setFormData({ ...formData, typographies: nextTypos });
  };
  const addTypography = () => {
    setFormData({ ...formData, typographies: [...(formData.typographies || []), { fontFamily: '', weights: [], fontSize: '', sampleText: '' }] });
  };
  const removeTypography = (index) => {
    const nextTypos = [...(formData.typographies || [])];
    nextTypos.splice(index, 1);
    setFormData({ ...formData, typographies: nextTypos });
  };

  const handleLogoChange = (index, field, value) => {
    const nextLogos = [...(formData.logos || [])];
    nextLogos[index] = { ...nextLogos[index], [field]: value };
    setFormData({ ...formData, logos: nextLogos });
  };
  const addLogo = () => {
    setFormData({ ...formData, logos: [...(formData.logos || []), { name: '', svgContent: '' }] });
  };
  const removeLogo = (index) => {
    const nextLogos = [...(formData.logos || [])];
    nextLogos.splice(index, 1);
    setFormData({ ...formData, logos: nextLogos });
  };

  const handleVideoChange = (index, value) => {
    const nextVideos = [...(formData.videos || [])];
    nextVideos[index] = value;
    setFormData({ ...formData, videos: nextVideos });
  };
  const addVideo = () => {
    setFormData({ ...formData, videos: [...(formData.videos || []), ''] });
  };
  const removeVideo = (index) => {
    const nextVideos = [...(formData.videos || [])];
    nextVideos.splice(index, 1);
    setFormData({ ...formData, videos: nextVideos });
  };

  // Initialize service
  const service = config.provider === 'supabase'
    ? new SupabaseRESTService(config.supabase, session?.token)
    : (window.DataSource || null);

  // 1. Check local session storage on load
  useEffect(() => {
    if (config.provider === 'supabase') {
      const cached = localStorage.getItem(`crm_session_${config.supabase?.url}`);
      if (cached) {
        try {
          setSession(JSON.parse(cached));
        } catch (e) {
          localStorage.removeItem(`crm_session_${config.supabase?.url}`);
        }
      }
    } else {
      // LocalStorage provider doesn't require session auth
      setSession({ local: true });
    }
  }, [config.provider, config.supabase?.url]);

  // 2. Fetch data once session is active
  const [locations, setLocations] = useState([]);
  const [travels, setTravels] = useState([]);
  const [departures, setDepartures] = useState([]);

  const fetchDepartures = async () => {
    try {
      if (config.provider === 'localStorage') {
        const cached = localStorage.getItem('glosaurio_departure');
        setDepartures(cached ? JSON.parse(cached) : []);
      } else {
        const raw = await service.getItems('departure');
        setDepartures(raw.map(d => ({
          id: d.id,
          travelId: d.travel_id || d.travelId || '',
          departureDate: d.departure_date || d.departureDate || '',
          capacity: d.capacity !== undefined ? d.capacity : 10,
          passengersCount: d.passengers_count !== undefined ? d.passengers_count : (d.passengersCount || 0),
          status: d.status || 'open'
        })));
      }
    } catch (e) {
      console.error('Error fetching departures:', e);
    }
  };

  const fetchLocations = async () => {
    try {
      if (config.provider === 'localStorage') {
        const cached = localStorage.getItem('glosaurio_location');
        setLocations(cached ? JSON.parse(cached) : []);
      } else {
        const rawLocs = await service.getItems('location');
        setLocations(rawLocs.map(l => ({
          id: l.id,
          name: l.name || '',
          city: l.city || '',
          country: l.country || '',
          type: l.type || 'location',
          parentRegionId: l.parent_region_id || l.parentRegionId || '',
          parentCityId: l.parent_city_id || l.parentCityId || '',
          mapUrl: l.mapUrl || l.map_url || '',
          mapPosX: l.mapPosX !== undefined ? l.mapPosX : l.map_pos_x,
          mapPosY: l.mapPosY !== undefined ? l.mapPosY : l.map_pos_y
        })));
      }
    } catch (e) {
      console.error('Error fetching locations:', e);
    }
  };

  const fetchTravels = async () => {
    try {
      if (config.provider === 'localStorage') {
        const cached = localStorage.getItem('glosaurio_travel');
        setTravels(cached ? JSON.parse(cached) : []);
      } else {
        const rawTravels = await service.getItems('travel');
        setTravels(rawTravels.map(t => ({
          id: t.id,
          title: t.title || ''
        })));
      }
    } catch (e) {
      console.error('Error fetching travels:', e);
    }
  };

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const stats = {};
      const modulesToFetch = config.activeModules || ['terms', 'design_tokens'];
      
      await Promise.all(modulesToFetch.map(async (mod) => {
        try {
          let count = 0;
          if (config.provider === 'localStorage') {
            const cached = localStorage.getItem(`glosaurio_${mod}`);
            count = cached ? JSON.parse(cached).length : 0;
          } else {
            const items = await service.getItems(mod);
            count = items.length;
          }
          stats[mod] = count;
        } catch (err) {
          console.error(`Error loading stats for ${mod}:`, err);
          stats[mod] = 0;
        }
      }));

      setDashboardStats(stats);
    } catch (e) {
      console.error("Error loading dashboard stats:", e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (session) {
      if (activeModule === 'dashboard') {
        fetchDashboardStats();
      } else {
        fetchCMSData();
      }
      fetchLocations();
      fetchTravels();
      fetchDepartures();
    }
  }, [session, activeModule]);

  const fetchCMSData = async () => {
    if (config.provider === 'localStorage') {
      const cachedData = localStorage.getItem(`glosaurio_${activeModule}`);
      setItems(cachedData ? JSON.parse(cachedData) : []);
      return;
    }

    setLoadingData(true);
    try {
      const collectionName = activeModule === 'blog' ? 'cms_posts' : activeModule;
      const rawItems = await service.getItems(collectionName);
      // Map keys snake_case to camelCase
      const mapped = rawItems.map(item => {
        if (activeModule === 'design_tokens') {
          return {
            id: item.id,
            brandName: item.brand_name || '',
            colors: Array.isArray(item.colors) ? item.colors : [],
            typographies: Array.isArray(item.typographies) ? item.typographies : [],
            logos: Array.isArray(item.logos) ? item.logos : [],
            isDraft: item.is_draft || item.isDraft || false
          };
        }
        if (activeModule === 'departure') {
          return {
            id: item.id,
            travelId: item.travel_id || item.travelId || '',
            departureDate: item.departure_date || item.departureDate || '',
            endDate: item.end_date || item.endDate || '',
            capacity: item.capacity !== undefined ? item.capacity : 10,
            passengersCount: item.passengers_count !== undefined ? item.passengers_count : 0,
            priceOverride: item.price_override || item.priceOverride || '',
            status: item.status || 'open',
            isDraft: item.is_draft || item.isDraft || false
          };
        }
        if (activeModule === 'location') {
          return {
            id: item.id,
            name: item.name || '',
            type: item.type || 'location',
            subtitle: item.subtitle || '',
            travelStyles: Array.isArray(item.travel_styles) ? item.travel_styles : (Array.isArray(item.travelStyles) ? item.travelStyles : []),
            guideBestSeason: item.guide_best_season || item.guideBestSeason || '',
            guideHowToGetAround: item.guide_how_to_get_around || item.guideHowToGetAround || '',
            guideRecommendedDuration: item.guide_recommended_duration || item.guideRecommendedDuration || '',
            mapUrl: item.map_url || item.mapUrl || '',
            imageUrl: item.image_url || item.imageUrl || '',
            imageUrls: Array.isArray(item.image_urls) ? item.image_urls : (Array.isArray(item.imageUrls) ? item.imageUrls : []),
            suggestedItineraries: Array.isArray(item.suggested_itineraries) ? item.suggested_itineraries : (Array.isArray(item.suggestedItineraries) ? item.suggestedItineraries : []),
            locationType: item.location_type || item.locationType || '',
            parentRegionId: item.parent_region_id || item.parentRegionId || '',
            parentCityId: item.parent_city_id || item.parentCityId || '',
            mapPosX: item.map_pos_x !== undefined ? item.map_pos_x : (item.mapPosX !== undefined ? item.mapPosX : ''),
            mapPosY: item.map_pos_y !== undefined ? item.map_pos_y : (item.mapPosY !== undefined ? item.mapPosY : ''),
            mapIcon: (typeof item.amenities === 'object' && item.amenities !== null && item.amenities.mapIcon) || '',
            address: item.address || '',
            city: item.city || '',
            country: item.country || '',
            geolocationUrl: item.geolocation_url || item.geolocationUrl || '',
            openingHours: item.opening_hours || item.openingHours || '',
            pricing: item.pricing || '',
            ticketUrl: item.ticket_url || item.ticketUrl || '',
            estimatedVisitTime: item.estimated_visit_time || item.estimatedVisitTime || '',
            amenities: typeof item.amenities === 'object' && item.amenities !== null ? item.amenities : {
              parking: false,
              accessibility: false,
              restrooms: false,
              petFriendly: false,
              kidsFriendly: false
            },
            description: item.description || '',
            highlights: Array.isArray(item.highlights) ? item.highlights : [],
            travelerTips: item.traveler_tips || item.travelerTips || '',
            nearbyLocations: Array.isArray(item.nearby_locations) ? item.nearby_locations : (Array.isArray(item.nearbyLocations) ? item.nearbyLocations : []),
            isDraft: item.is_draft || item.isDraft || false
          };
        }
        return {
          id: item.id,
          title: item.title,
          category: item.category,
          description: item.description || '',
          subtitle: item.subtitle || '',
          url: item.url || '',
          video_url: item.video_url || '',
          tools: Array.isArray(item.tools) ? item.tools : [],
          isDraft: item.is_draft || item.isDraft || false,
          prompt: item.prompt || '',
          promptVars: Array.isArray(item.prompt_vars) ? item.prompt_vars : (Array.isArray(item.promptVars) ? item.promptVars : []),
          problems: Array.isArray(item.problems) ? item.problems : [],
          benefits: Array.isArray(item.benefits) ? item.benefits : [],
          recommendedScenarios: Array.isArray(item.recommended_scenarios) ? item.recommended_scenarios : (Array.isArray(item.recommendedScenarios) ? item.recommendedScenarios : []),
          criticalExclusions: Array.isArray(item.critical_exclusions) ? item.critical_exclusions : (Array.isArray(item.criticalExclusions) ? item.criticalExclusions : []),
          technicalExample: item.technical_example || item.technicalExample || '',
          // Load rich travel fields if present
          agency: item.agency || 'Sueño Travel Chile',
          flavorText: item.flavor_text || item.flavorText || item.agency || '',
          imageUrl: item.imageUrl || item.image_url || '',
          headerImageUrl: item.headerImageUrl || item.header_image_url || '',
          durationDays: item.duration_days !== undefined ? item.duration_days : (item.durationDays || 1),
          durationNights: item.duration_nights !== undefined ? item.duration_nights : (item.durationNights || 0),
          destinationsSummary: Array.isArray(item.destinations_summary) ? item.destinations_summary : (Array.isArray(item.destinationsSummary) ? item.destinationsSummary : []),
          visaCostUSD: item.pricing_and_notes?.visaCostUSD !== undefined ? item.pricing_and_notes.visaCostUSD : (item.pricingAndNotes?.visaCostUSD || 0),
          hotelTaxUSD: item.pricing_and_notes?.hotelTaxUSD !== undefined ? item.pricing_and_notes.hotelTaxUSD : (item.pricingAndNotes?.hotelTaxUSD || 0),
          disclaimer: item.pricing_and_notes?.disclaimer !== undefined ? item.pricing_and_notes.disclaimer : (item.pricingAndNotes?.disclaimer || ''),
          
          itinerary: Array.isArray(item.itinerary) ? item.itinerary : [],
          servicesIncludedList: Array.isArray(item.servicesIncludedList) 
            ? item.servicesIncludedList 
            : (Array.isArray(item.services_included_list) ? item.services_included_list : []),
          servicesExcludedList: Array.isArray(item.servicesExcludedList) 
            ? item.servicesExcludedList 
            : (Array.isArray(item.services_excluded_list) ? item.services_excluded_list : []),
          hotelsPlanned: Array.isArray(item.hotelsPlanned) 
            ? item.hotelsPlanned 
            : (Array.isArray(item.hotels_planned) ? item.hotels_planned : []),
          
          isPublished: item.is_published !== undefined ? item.is_published : (item.isPublished !== undefined ? item.isPublished : true),
          isDraft: item.is_published !== undefined ? !item.is_published : (item.isDraft || false),
          
          steps: Array.isArray(item.steps) ? item.steps : [],
          results: item.results || '',
          metrics: item.metrics || '',
          
          slug: item.slug || '',
          author: item.author || '',
          readTime: item.read_time || item.readTime || 0,
          summary: item.summary || '',
          coverImage: item.cover_image || item.coverImage || '',
          tags: Array.isArray(item.tags) ? item.tags : [],
          content: item.content || ''
        };
      });
      setItems(mapped);
    } catch (e) {
      console.error('Error fetching CRM data:', e);
      if (e.message === 'Unauthorized') {
        if (config.provider === 'supabase') {
          localStorage.removeItem(`crm_session_${config.supabase?.url}`);
        }
        setSession(null);
        alert('Tu sesión ha expirado o las credenciales son inválidas. Por favor, inicia sesión de nuevo.');
      }
    } finally {
      setLoadingData(false);
    }
  };

  // Auth Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoadingAuth(true);
    try {
      const authService = new SupabaseRESTService(config.supabase);
      const resSession = await authService.signIn(email, password);
      localStorage.setItem(`crm_session_${config.supabase.url}`, JSON.stringify(resSession));
      setSession(resSession);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    if (config.provider === 'supabase') {
      localStorage.removeItem(`crm_session_${config.supabase.url}`);
    }
    setSession(null);
  };

  // CRUD actions
  const handleSave = async (e, draftOverride = null) => {
    if (e) e.preventDefault();
    const finalDraftStatus = draftOverride !== null ? draftOverride : formData.isDraft;

    let formattedData = {};
    if (activeModule === 'travel') {
      formattedData = buildTravelPayload(formData, finalDraftStatus);
    } else if (activeModule === 'departure') {
      formattedData = buildDeparturePayload(formData, finalDraftStatus);
    } else if (activeModule === 'design_tokens') {
      formattedData = buildDesignTokensPayload(formData, finalDraftStatus);
    } else if (activeModule === 'location') {
      formattedData = buildLocationPayload(formData, finalDraftStatus);
    } else if (activeModule === 'blog') {
      formattedData = buildBlogPayload(formData, finalDraftStatus);
    } else {
      formattedData = buildTermsPayload(formData, config.taxonomies, finalDraftStatus);
    }

    try {
      if (config.provider === 'localStorage') {
        const localItems = [...items];
        if (isEditing) {
          const idx = localItems.findIndex(i => i.id === selectedId);
          if (idx !== -1) {
            localItems[idx] = { ...formattedData, id: selectedId };
          }
        } else {
          const newItem = { ...formattedData, id: `${activeModule}-${Date.now()}` };
          localItems.unshift(newItem);
        }
        localStorage.setItem(`glosaurio_${activeModule}`, JSON.stringify(localItems));
        setItems(localItems);
      } else {
        const collectionName = activeModule === 'blog' ? 'cms_posts' : activeModule;
        if (isEditing) {
          await service.updateItem(collectionName, selectedId, formattedData);
        } else {
          await service.createItem(collectionName, formattedData);
        }
        await fetchCMSData();
      }

      if (activeModule === 'travel') {
        fetchTravels();
      }
      if (activeModule === 'location') {
        fetchLocations();
      }

      // Reset Form
      setIsEditing(false);
      setSelectedId(null);
      setShowForm(false);
      setFormData(createEmptyFormData(workAreas, contentTypes));
    } catch (err) {
      if (err.message === 'Unauthorized') {
        if (config.provider === 'supabase') {
          localStorage.removeItem(`crm_session_${config.supabase?.url}`);
        }
        setSession(null);
        alert('Tu sesión ha expirado o las credenciales son inválidas. Por favor, inicia sesión de nuevo.');
      } else {
        alert(`Error al guardar: ${err.message}`);
      }
    }
  };

  const startEdit = (item) => {
    setIsEditing(true);
    setSelectedId(item.id);
    if (activeModule === 'travel') {
      setFormData({
        id: item.id,
        title: item.title || '',
        description: item.description || '',
        subtitle: item.subtitle || '',
        agency: item.agency || 'Sueño Travel Chile',
        flavorText: item.flavor_text || item.flavorText || item.agency || '',
        imageUrl: item.imageUrl || item.image_url || '',
        headerImageUrl: item.headerImageUrl || item.header_image_url || '',
        durationDays: item.durationDays || 1,
        durationNights: item.durationNights || 0,
        allowPrivate: item.allowPrivate || item.allow_private || false,
        privatePriceFrom: item.privatePriceFrom || item.private_price_from || '',
        destinationsSummary: Array.isArray(item.destinationsSummary) ? item.destinationsSummary.join(', ') : (item.destinationsSummary || ''),
        visaCostUSD: item.visaCostUSD !== undefined ? item.visaCostUSD : (item.pricingAndNotes?.visaCostUSD || 0),
        hotelTaxUSD: item.hotelTaxUSD !== undefined ? item.hotelTaxUSD : (item.pricingAndNotes?.hotelTaxUSD || 0),
        disclaimer: item.disclaimer !== undefined ? item.disclaimer : (item.pricingAndNotes?.disclaimer || ''),
        servicesIncludedEgypt: Array.isArray(item.servicesIncluded?.egypt) ? item.servicesIncluded.egypt.join('\n') : '',
        servicesIncludedTurkey: Array.isArray(item.servicesIncluded?.turkey) ? item.servicesIncluded.turkey.join('\n') : '',
        servicesExcluded: Array.isArray(item.servicesExcluded) ? item.servicesExcluded.join('\n') : '',
        
        // Load rich travel fields
        itinerary: item.itinerary || [],
        servicesIncludedList: item.servicesIncludedList || [],
        servicesExcludedList: item.servicesExcludedList && item.servicesExcludedList.length > 0 ? item.servicesExcludedList : [''],
        hotelsPlanned: item.hotelsPlanned || [],
        isDraft: item.is_published !== undefined ? !item.is_published : (item.isPublished !== undefined ? !item.isPublished : false)
      });
      setCreatingTypeSelected(true);
      setShowForm(true);
      return;
    }
    if (activeModule === 'departure') {
      setFormData({
        travelId: item.travelId || '',
        departureDate: item.departureDate || '',
        endDate: item.endDate || '',
        capacity: item.capacity !== undefined ? item.capacity : 10,
        passengersCount: item.passengersCount !== undefined ? item.passengersCount : 0,
        priceOverride: item.priceOverride || '',
        status: item.status || 'open',
        isDraft: item.isDraft || false
      });
      setCreatingTypeSelected(true);
      setShowForm(true);
      return;
    }
    if (activeModule === 'location') {
      setFormData({
        name: item.name || '',
        type: item.type || 'location',
        subtitle: item.subtitle || '',
        travelStyles: item.travelStyles || [],
        guideBestSeason: item.guideBestSeason || '',
        guideHowToGetAround: item.guideHowToGetAround || '',
        guideRecommendedDuration: item.guideRecommendedDuration || '',
        mapUrl: item.mapUrl || '',
        imageUrl: item.imageUrl || '',
        imageUrls: item.imageUrls || [],
        suggestedItineraries: item.suggestedItineraries || [],
        locationType: item.locationType || '',
        parentRegionId: item.parentRegionId || '',
        parentCityId: item.parentCityId || '',
        mapPosX: item.mapPosX !== undefined ? item.mapPosX : '',
        mapPosY: item.mapPosY !== undefined ? item.mapPosY : '',
        mapIcon: item.mapIcon || '',
        address: item.address || '',
        city: item.city || '',
        country: item.country || '',
        geolocationUrl: item.geolocationUrl || '',
        openingHours: item.openingHours || '',
        pricing: item.pricing || '',
        ticketUrl: item.ticketUrl || '',
        estimatedVisitTime: item.estimatedVisitTime || '',
        amenities: item.amenities || {
          parking: false,
          accessibility: false,
          restrooms: false,
          petFriendly: false,
          kidsFriendly: false
        },
        highlights: item.highlights || [],
        travelerTips: item.travelerTips || '',
        nearbyLocations: item.nearbyLocations || [],
        isDraft: item.isDraft || false
      });
      setCreatingTypeSelected(true);
      setShowForm(true);
      
      const { activePanels: derivedPanels, expandedSections: derivedSections } = derivePanelsFromItem(item, activeModule);
      setActivePanels(derivedPanels);
      setExpandedSections(derivedSections);
      return;
    }
    if (activeModule === 'design_tokens') {
      setFormData({
        brandName: item.brandName || '',
        url: item.url || '',
        colors: (item.colors && item.colors.length > 0) ? item.colors : [{ hex: '', role: '', description: '' }],
        typographies: (item.typographies && item.typographies.length > 0) ? item.typographies : [{ fontFamily: '', weights: [], fontSize: '', sampleText: '' }],
        logos: (item.logos && item.logos.length > 0) ? item.logos : [{ name: '', svgContent: '' }],
        isDraft: item.isDraft || false,
        title: '',
        category: 'Diseño & Marca',
        workArea: 'diseño',
        contentType: 'metodologia',
        description: '',
        tools: [],
        prompt: '',
        problems: '',
        benefits: '',
        steps: [{ label: '', detail: '' }],
        results: '',
        metrics: '',
        promptVars: ''
      });
      setCreatingTypeSelected(true);
    } else if (activeModule === 'blog') {
      setFormData({
        title: item.title || '',
        slug: item.slug || '',
        author: item.author || 'Equipo Sueño Travel',
        category: item.category || 'Destinos',
        summary: item.summary || '',
        content: item.content || '',
        coverImage: item.coverImage || '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        readTime: item.readTime || 5,
        isDraft: item.isDraft || false
      });
      setCreatingTypeSelected(true);
    } else {
      const parsedCat = parseCategory(item.category);
      let parsedVideos = [''];
      let urlFallback = item.url || '';
      if (item.video_url) {
        try {
          const parsed = JSON.parse(item.video_url);
          if (Array.isArray(parsed)) {
            parsedVideos = parsed.length > 0 ? parsed : [''];
          } else if (typeof parsed === 'string' && parsed.trim()) {
            parsedVideos = [parsed.trim()];
          }
        } catch (e) {
          if (!urlFallback && typeof item.video_url === 'string' && item.video_url.trim()) {
            urlFallback = item.video_url.trim();
          }
        }
      }
      const editFormData = {
        title: item.title || '',
        category: item.category || 'Diseño & Marca',
        targetResult: parsedCat.targetResult,
        description: item.description || '',
        url: urlFallback,
        videos: parsedVideos,
        tools: item.tools || [],
        isDraft: item.isDraft || false,
        prompt: item.prompt || '',
        problems: (item.problems || []).join('\n'),
        benefits: (item.benefits || []).join('\n'),
        recommendedScenarios: (item.recommendedScenarios || []).join('\n'),
        criticalExclusions: (item.criticalExclusions || []).join('\n'),
        technicalExample: item.technicalExample || '',
        steps: (item.steps && item.steps.length > 0) ? item.steps : [{ label: '', detail: '' }],
        results: item.results || '',
        metrics: item.metrics || '',
        promptVars: (item.promptVars || []).join(', '),
        brandName: '',
        tokenName: '',
        tokenType: 'color',
        colorHex: '',
        colorRole: '',
        colorPaletteDescription: '',
        fontFamily: '',
        fontWeights: [],
        fontSize: '',
        fontSampleText: '',
        svgContent: ''
      };

      const normalizedTax = normalizeTaxonomies(config.taxonomies);

      Object.keys(normalizedTax).forEach(taxKey => {
        editFormData[taxKey] = parsedCat[taxKey] || (normalizedTax[taxKey].items && normalizedTax[taxKey].items[0]?.val) || 'all';
      });

      setFormData(editFormData);
      setCreatingTypeSelected(true);
    }

    const { activePanels: derivedPanels, expandedSections: derivedSections } = derivePanelsFromItem(item, activeModule);
    setActivePanels(derivedPanels);
    setExpandedSections(derivedSections);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      if (config.provider === 'localStorage') {
        const filtered = items.filter(i => i.id !== id);
        localStorage.setItem(`glosaurio_${activeModule}`, JSON.stringify(filtered));
        setItems(filtered);
      } else {
        await service.deleteItem(activeModule, id);
        await fetchCMSData();
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        if (config.provider === 'supabase') {
          localStorage.removeItem(`crm_session_${config.supabase?.url}`);
        }
        setSession(null);
        alert('Tu sesión ha expirado o las credenciales son inválidas. Por favor, inicia sesión de nuevo.');
      } else {
        alert(`Error al eliminar: ${err.message}`);
      }
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      const isCurrentlyPublished = activeModule === 'travel' ? item.isPublished : !item.isDraft;
      const newPublishedStatus = !isCurrentlyPublished;
      const newDraftStatus = !newPublishedStatus;
      
      let updatePayload = {};
      if (activeModule === 'travel') {
        updatePayload = { is_published: newPublishedStatus };
      } else {
        updatePayload = { is_draft: newDraftStatus };
      }

      if (config.provider === 'localStorage') {
        const localItems = [...items];
        const idx = localItems.findIndex(i => i.id === item.id);
        if (idx !== -1) {
          if (activeModule === 'travel') {
            localItems[idx].is_published = newPublishedStatus;
            localItems[idx].isPublished = newPublishedStatus;
            localItems[idx].isDraft = newDraftStatus;
          } else {
            localItems[idx].is_draft = newDraftStatus;
            localItems[idx].isDraft = newDraftStatus;
          }
        }
        localStorage.setItem(`glosaurio_${activeModule}`, JSON.stringify(localItems));
        setItems(localItems);
      } else {
        const collectionName = activeModule === 'blog' ? 'cms_posts' : activeModule;
        await service.updateItem(collectionName, item.id, updatePayload);
        await fetchCMSData();
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        if (config.provider === 'supabase') {
          localStorage.removeItem(`crm_session_${config.supabase?.url}`);
        }
        setSession(null);
        alert('Tu sesión ha expirado o las credenciales son inválidas. Por favor, inicia sesión de nuevo.');
      } else {
        alert(`Error al cambiar estado: ${err.message}`);
      }
    }
  };

  const handleDownloadTemplate = () => {
    let template = {};
    if (isEditing) {
      if (activeModule === 'travel') {
        template = buildTravelPayload(formData, formData.isDraft);
      } else if (activeModule === 'departure') {
        template = buildDeparturePayload(formData, formData.isDraft);
      } else if (activeModule === 'location') {
        template = buildLocationPayload(formData, formData.isDraft);
      } else if (activeModule === 'design_tokens') {
        template = buildDesignTokensPayload(formData, formData.isDraft);
      } else if (activeModule === 'blog') {
        template = {
          title: formData.title,
          slug: formData.slug,
          author: formData.author,
          category: formData.category,
          summary: formData.summary,
          content: formData.content,
          coverImage: formData.coverImage,
          tags: formData.tags,
          readTime: formData.readTime,
          isDraft: formData.isDraft
        };
      } else {
        template = buildTermsPayload(formData, config.taxonomies, formData.isDraft);
      }
    } else {
      if (activeModule === 'travel') {
        template = {
          title: "Egipto Clásico y Templos del Nilo",
          agency: "Sueño Travel Chile",
          durationDays: 8,
          durationNights: 7,
          destinationsSummary: "Egipto (El Cairo, Luxor, Aswan)",
          countriesSummaryList: [
            {
              country: "Egipto",
              cities: ["El Cairo", "Luxor", "Aswan"]
            }
          ],
          visaCostUSD: 25,
          hotelTaxUSD: 10,
          disclaimer: "Tarifas sujetas a cambio sin previo aviso.",
          servicesExcludedList: [
            "Vuelos internacionales",
            "Bebidas y gastos personales",
            "Propinas generales"
          ],
          servicesIncludedList: [
            {
              locationId: "",
              customLocationName: "El Cairo",
              items: [
                "3 noches en Hotel Marriott Mena House con desayuno"
              ]
            },
            {
              locationId: "",
              customLocationName: "El Cairo y Luxor",
              items: [
                "Todos los traslados en vehículo privado con aire acondicionado",
                "Guía de habla hispana durante las excursiones"
              ]
            }
          ],
          itinerary: [
            {
              dayNumber: 1,
              locationId: "",
              customLocationName: "El Cairo",
              accommodationType: "Alojamiento y desayuno",
              imageUrl: "https://images.unsplash.com/photo-1572252009286-268acec5a0af?auto=format&fit=crop&w=1200&q=80",
              activities: [
                {
                  type: "arrival",
                  description: "Llegada al Aeropuerto de El Cairo. Recepción por nuestro representante y traslado al hotel."
                },
                {
                  type: "night",
                  description: "Alojamiento en Marriott Mena House."
                }
              ]
            }
          ],
          hotelsPlanned: [
            {
              country: "Egipto",
              category: "5★ Lujo / Boutique",
              city: "El Cairo",
              hotelName: "Marriott Mena House",
              citiesList: [
                {
                  cityName: "El Cairo",
                  hotelNames: ["Marriott Mena House"]
                }
              ]
            }
          ],
          isDraft: true
        };
      } else if (activeModule === 'location') {
        template = [
          {
            name: "Chile Costa",
            type: "region",
            subtitle: "Playas, gastronomía marina y atardeceres sobre el Pacífico",
            travelStyles: ["Familiar", "Gastronomía", "Relax", "Surf"],
            guideBestSeason: "Octubre a Abril",
            guideHowToGetAround: "Se recomienda alquilar auto",
            guideRecommendedDuration: "Ideal para recorrer en 3 a 5 días",
            mapUrl: "https://ejemplo.com/mapa.jpg",
            suggestedItineraries: [
              {
                title: "Ruta de 3 días por la Costa Central",
                duration: "3 días",
                description: "Día 1: Santiago a Viña. Día 2: Valparaíso. Día 3: Concón."
              }
            ],
            isDraft: true
          },
          {
            name: "Casa de Pablo Neruda (La Sebastiana)",
            type: "location",
            locationType: "Museo / Sitio Histórico",
            parentRegionId: "",
            address: "Ferrari 692, Valparaíso",
            city: "Valparaíso",
            country: "Chile",
            geolocationUrl: "https://maps.app.goo.gl/SebastianaValpo",
            openingHours: "Martes a Domingo 10:00 - 18:00",
            pricing: "Adultos: $7.000 CLP, Niños gratis",
            ticketUrl: "https://fundacionneruda.org",
            estimatedVisitTime: "1 a 2 horas",
            amenities: {
              parking: false,
              accessibility: false,
              restrooms: true,
              petFriendly: false,
              kidsFriendly: true
            },
            description: "Una de las casas del poeta Pablo Neruda con vista panorámica sobre la bahía.",
            highlights: [
              "Sube al tercer piso para ver el escritorio original.",
              "Admira la colección de cajas de música."
            ],
            travelerTips: "Llega temprano para evitar multitudes.",
            nearbyLocations: [
              "Cerro Bellavista"
            ],
            isDraft: true
          }
        ];
      } else if (activeModule === 'design_tokens') {
        template = {
          brandName: "[Nombre de la marca o sistema de diseño, ej: 'Alexandria']",
          colors: [
            {
              hex: "[Código de color en formato HEX, RGB o HSL, ej: '#2563EB']",
              role: "[Rol o nombre del color, ej: 'Primario', 'Fondo']",
              description: "[Descripción detallada del uso de este color en el diseño]"
            }
          ],
          typographies: [
            {
              fontFamily: "[Familia tipográfica de Google Fonts, ej: 'Plus Jakarta Sans']",
              fontSize: "[Tamaño base de la fuente, ej: '16px' o '1rem']",
              weights: [
                "[Pesos de fuente soportados y disponibles, ej: '400', '700']"
              ],
              fontSampleText: "[Texto corto de muestra para previsualizar la tipografía]"
            }
          ],
          logos: [
            {
              name: "[Nombre identificativo del logotipo, ej: 'Logo Principal' o 'Isotipo']",
              svgContent: "[Código XML crudo del SVG, ej: <svg ...>...</svg>]"
            }
          ],
          isDraft: true
        };
      } else if (activeModule === 'blog') {
        template = {
          title: "Título de Ejemplo",
          slug: "titulo-de-ejemplo",
          author: "Equipo Sueño Travel",
          category: "Destinos",
          summary: "Resumen del artículo...",
          content: "Contenido del artículo en markdown...",
          coverImage: "https://ejemplo.com/imagen.jpg",
          tags: ["viajes", "tips"],
          readTime: 5,
          isDraft: true
        };
      } else {
        template = {
          title: "[Nombre del término, concepto o metodología. Ej: 'Design Tokens' o 'Vibe Coding']",
          category: "[Categoría del término. Debe ser una de las siguientes: 'Diseño & Marca', 'Vibe Coding', 'Tech', 'Gestión de Proyectos', 'Automatización']",
          description: "[Descripción clara y detallada de lo que consiste este término, explaining su propósito e importancia.]",
          steps: [
            {
              label: "[Paso 1: Nombre o título corto de la primera etapa del proceso de implementación]",
              detail: "[Explicación detallada de las acciones específicas y consideraciones para este paso.]"
            }
          ],
          problems: [
            "[Problema o ineficiencia número 1 que este término busca resolver o mitigar]",
            "[Problema o ineficiencia número 2 que este término busca resolver o mitigar]"
          ],
          benefits: [
            "[Beneficio o ventaja directa número 1 obtenida al aplicar este término o metodología]",
            "[Beneficio o ventaja directa número 2 obtenida al aplicar este término o metodología]"
          ],
          tools: [
            "[Nombre de la herramienta o software relacionado 1 (ej: Figma, VS Code)]",
            "[Nombre de la herramienta o software relacionado 2]"
          ],
          results: "[Descripción del entregable final, resultado tangible o estado esperado después de implementar este concepto.]",
          metrics: "[Indicadores clave de rendimiento o métricas de éxito recomendadas para evaluar el impacto.]",
          recommendedScenarios: [
            "[Escenario o caso de uso número 1 donde se aconseja y beneficia la aplicación de este término]",
            "[Escenario o caso de uso número 2 donde se aconseja y beneficia la aplicación de este término]"
          ],
          criticalExclusions: [
            "[Situación o contexto de riesgo número 1 donde explícitamente se desaconseja el uso de este término]",
            "[Situación o contexto de riesgo número 2 donde explícitamente se desaconseja el uso de este término]"
          ],
          technicalExample: "[Snippet de código, configuración de ejemplo o demostración técnica que ilustre la aplicación práctica.]",
          prompt: "[Instrucción o prompt de IA recomendado para optimizar el uso de este concepto con un LLM, usando variables en formato [nombre_variable]]",
          promptVars: [
            "[nombre_variable]"
          ],
          isDraft: true
        };
      }
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(Array.isArray(template) ? template : [template], null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    let filename = `plantilla_${activeModule}.json`;
    if (isEditing) {
      const nameVal = formData.title || formData.name || formData.brandName || '';
      if (nameVal) {
        filename = `${nameVal.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_plantilla.json`;
      }
    }
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };


  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const list = Array.isArray(parsed) ? parsed : [parsed];

        setLoadingData(true);
        for (const item of list) {
          let formattedData = {};
          const itemIsDraft = item.isDraft !== undefined ? item.isDraft : (item.is_draft !== undefined ? item.is_draft : true);
          
          if (activeModule === 'travel') {
            formattedData = buildTravelPayload(item, itemIsDraft);
          } else if (activeModule === 'departure') {
            formattedData = buildDeparturePayload(item, itemIsDraft);
          } else if (activeModule === 'location') {
            formattedData = buildLocationPayload(item, itemIsDraft);
          } else if (activeModule === 'design_tokens') {
            formattedData = buildDesignTokensPayload(item, itemIsDraft);
          } else {
            formattedData = buildTermsPayload(item, config.taxonomies, itemIsDraft);
          }

          if (config.provider === 'localStorage') {
            const localItems = JSON.parse(localStorage.getItem(`glosaurio_${activeModule}`) || "[]");
            const newItem = { ...formattedData, id: `${activeModule}-${Date.now()}-${Math.random()}` };
            localItems.unshift(newItem);
            localStorage.setItem(`glosaurio_${activeModule}`, JSON.stringify(localItems));
          } else {
            await service.createItem(activeModule, formattedData);
          }
        }
        alert("¡Datos importados con éxito!");
        await fetchCMSData();
        if (activeModule === 'location') {
          fetchLocations();
        }
      } catch (err) {
        alert("Error al importar el JSON: " + err.message);
      } finally {
        setLoadingData(false);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const [showPasteJsonModal, setShowPasteJsonModal] = useState(false);
  const [pastedJsonText, setPastedJsonText] = useState('');

  const handleImportedTemplateData = (parsed) => {
    const item = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!item) return;

    if (activeModule === 'travel') {
      setFormData({
        title: item.title || '',
        agency: item.agency || 'Sueño Travel Chile',
        flavorText: item.flavor_text || item.flavorText || item.agency || '',
        durationDays: item.durationDays || item.duration_days || 1,
        durationNights: item.durationNights || item.duration_nights || 0,
        allowPrivate: item.allowPrivate || item.allow_private || false,
        privatePriceFrom: item.privatePriceFrom || item.private_price_from || '',
        destinationsSummary: Array.isArray(item.destinationsSummary) ? item.destinationsSummary.join(', ') : (Array.isArray(item.destinations_summary) ? item.destinations_summary.join(', ') : (item.destinationsSummary || '')),
        visaCostUSD: item.visaCostUSD !== undefined ? item.visaCostUSD : (item.pricingAndNotes?.visaCostUSD !== undefined ? item.pricingAndNotes.visaCostUSD : (item.pricing_and_notes?.visaCostUSD || 0)),
        hotelTaxUSD: item.hotelTaxUSD !== undefined ? item.hotelTaxUSD : (item.pricingAndNotes?.hotelTaxUSD !== undefined ? item.pricingAndNotes.hotelTaxUSD : (item.pricing_and_notes?.hotelTaxUSD || 0)),
        disclaimer: item.disclaimer !== undefined ? item.disclaimer : (item.pricingAndNotes?.disclaimer !== undefined ? item.pricingAndNotes.disclaimer : (item.pricing_and_notes?.disclaimer || '')),
        servicesIncludedEgypt: Array.isArray(item.servicesIncluded?.egypt) ? item.servicesIncluded.egypt.join('\n') : (Array.isArray(item.services_included?.egypt) ? item.services_included.egypt.join('\n') : ''),
        servicesIncludedTurkey: Array.isArray(item.servicesIncluded?.turkey) ? item.servicesIncluded.turkey.join('\n') : (Array.isArray(item.services_included?.turkey) ? item.services_included.turkey.join('\n') : ''),
        servicesExcluded: Array.isArray(item.servicesExcluded) ? item.servicesExcluded.join('\n') : (Array.isArray(item.services_excluded) ? item.services_excluded.join('\n') : ''),
        itinerary: item.itinerary || [],
        servicesIncludedList: item.servicesIncludedList || item.services_included_list || [],
        servicesExcludedList: item.servicesExcludedList && item.servicesExcludedList.length > 0 ? item.servicesExcludedList : (item.services_excluded_list && item.services_excluded_list.length > 0 ? item.services_excluded_list : ['']),
        hotelsPlanned: item.hotelsPlanned || item.hotels_planned || [],
        isDraft: item.isDraft !== undefined ? item.isDraft : (item.is_draft !== undefined ? item.is_draft : true)
      });
    } else if (activeModule === 'departure') {
      setFormData({
        travelId: item.travelId || item.travel_id || '',
        departureDate: item.departureDate || item.departure_date || '',
        endDate: item.endDate || item.end_date || '',
        capacity: item.capacity !== undefined ? item.capacity : 10,
        passengersCount: item.passengersCount !== undefined ? item.passengers_count : 0,
        priceOverride: item.priceOverride || item.price_override || '',
        status: item.status || 'open',
        isDraft: item.isDraft !== undefined ? item.isDraft : (item.is_draft !== undefined ? item.is_draft : true)
      });
    } else if (activeModule === 'location') {
      setFormData({
        name: item.name || '',
        type: item.type || 'location',
        subtitle: item.subtitle || '',
        travelStyles: Array.isArray(item.travelStyles) ? item.travelStyles : (item.travel_styles || []),
        guideBestSeason: item.guideBestSeason || item.guide_best_season || '',
        guideHowToGetAround: item.guideHowToGetAround || item.guide_how_to_get_around || '',
        guideRecommendedDuration: item.guideRecommendedDuration || item.guide_recommended_duration || '',
        mapUrl: item.mapUrl || item.map_url || '',
        suggestedItineraries: item.suggestedItineraries || item.suggested_itineraries || [],
        locationType: item.locationType || item.location_type || '',
        parentRegionId: item.parentRegionId || item.parent_region_id || '',
        parentCityId: item.parentCityId || item.parent_city_id || '',
        address: item.address || '',
        city: item.city || '',
        country: item.country || '',
        geolocationUrl: item.geolocationUrl || item.geolocation_url || '',
        openingHours: item.openingHours || item.opening_hours || '',
        pricing: item.pricing || '',
        ticketUrl: item.ticketUrl || item.ticket_url || '',
        estimatedVisitTime: item.estimatedVisitTime || item.estimated_visit_time || '',
        amenities: item.amenities || {
          parking: false,
          accessibility: false,
          restrooms: false,
          petFriendly: false,
          kidsFriendly: false
        },
        description: item.description || '',
        highlights: Array.isArray(item.highlights) ? item.highlights : [],
        travelerTips: item.travelerTips || item.traveler_tips || '',
        nearbyLocations: Array.isArray(item.nearbyLocations) ? item.nearbyLocations : (item.nearby_locations || []),
        isDraft: item.isDraft !== undefined ? item.isDraft : (item.is_draft !== undefined ? item.is_draft : true)
      });
    } else if (activeModule === 'design_tokens') {
      setFormData({
        brandName: item.brandName || item.brand_name || '',
        url: item.url || '',
        colors: (item.colors && item.colors.length > 0) ? item.colors : [{ hex: '', role: '', description: '' }],
        typographies: (item.typographies && item.typographies.length > 0) ? item.typographies : [{ fontFamily: '', weights: [], fontSize: '', sampleText: '' }],
        logos: (item.logos && item.logos.length > 0) ? item.logos : [{ name: '', svgContent: '' }],
        isDraft: item.isDraft !== undefined ? item.isDraft : (item.is_draft !== undefined ? item.is_draft : true)
      });
    } else if (activeModule === 'blog') {
      setFormData({
        title: item.title || '',
        slug: item.slug || '',
        author: item.author || 'Equipo Sueño Travel',
        category: item.category || 'Destinos',
        summary: item.summary || '',
        content: item.content || '',
        coverImage: item.coverImage || '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        readTime: item.readTime || 5,
        isDraft: item.isDraft !== undefined ? item.isDraft : (item.is_draft !== undefined ? item.is_draft : true)
      });
    } else {
      setFormData({
        title: item.title || '',
        category: item.category || 'Diseño & Marca',
        description: item.description || '',
        url: item.url || '',
        tools: Array.isArray(item.tools) ? item.tools : [],
        isDraft: item.isDraft !== undefined ? item.isDraft : (item.is_draft !== undefined ? item.is_draft : true),
        prompt: item.prompt || '',
        problems: Array.isArray(item.problems) ? item.problems.join('\n') : (item.problems || ''),
        benefits: Array.isArray(item.benefits) ? item.benefits.join('\n') : (item.benefits || ''),
        recommendedScenarios: Array.isArray(item.recommendedScenarios) ? item.recommendedScenarios.join('\n') : (item.recommendedScenarios || ''),
        criticalExclusions: Array.isArray(item.criticalExclusions) ? item.criticalExclusions.join('\n') : (item.criticalExclusions || ''),
        technicalExample: item.technicalExample || '',
        steps: Array.isArray(item.steps) ? item.steps : [{ label: '', detail: '' }],
        results: item.results || '',
        metrics: item.metrics || '',
        promptVars: Array.isArray(item.promptVars) ? item.promptVars.join(', ') : (item.prompt_vars ? item.prompt_vars.join(', ') : (item.promptVars || ''))
      });
    }

    const { activePanels: derivedPanels, expandedSections: derivedSections } = derivePanelsFromItem(item, activeModule);
    setActivePanels(derivedPanels);
    setExpandedSections(derivedSections);
  };

  const handleUploadFormTemplate = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        handleImportedTemplateData(parsed);
        alert("¡Formulario rellenado desde el archivo JSON!");
      } catch (err) {
        alert("Error al cargar el JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const appName = config.branding?.appName || 'Alexandria';
  const logoUrl = config.branding?.logoUrl || '../favicon.png';
  const backUrl = config.branding?.backUrl || '#/';
  const guessSetupUrl = () => {
    if (config.branding?.setupUrl) return config.branding.setupUrl;
    const scripts = Array.from(document.getElementsByTagName('script'));
    const dsScript = scripts.find(s => s.src && s.src.includes('data-source-config.js'));
    if (dsScript) {
      try {
        const url = new URL(dsScript.src);
        const parts = url.pathname.split('/');
        parts.pop();
        return parts.join('/') + '/setup.html';
      } catch (e) {
        const idx = dsScript.src.indexOf('data-source-config.js');
        if (idx !== -1) {
          return dsScript.src.substring(0, idx) + 'setup.html';
        }
      }
    }
    return './crm-controlpanel/setup.html';
  };


  // Render Login View if not authenticated
  if (!session && config.provider === 'supabase') {
    return (
      <LoginView
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        authError={authError}
        loadingAuth={loadingAuth}
        onSubmit={handleLogin}
        renderHeader={() => (
          <AppHeader
            config={config}
            session={session}
            onLogout={handleLogout}
            guessSetupUrl={guessSetupUrl}
            appName={appName}
            logoUrl={logoUrl}
            backUrl={backUrl}
          />
        )}
      />
    );
  }

  // Active Workspace
  return (
    <>
      <style>{`
        .admin-theme {
          --primary: #475569; /* slate-600 */
          --primary-container: #e2e8f0; /* slate-200 */
          --on-primary-container: #0f172a; /* slate-900 */
          --secondary: #64748b; /* slate-500 */
          --secondary-container: #f1f5f9; /* slate-100 */
          --tertiary: #94a3b8; /* slate-400 */
          
          --surface: #ffffff;
          --surface-container-lowest: #ffffff;
          --surface-container-low: #f8fafc;
          --surface-container: #f1f5f9;
          --surface-container-high: #e2e8f0;
          --surface-container-highest: #cbd5e1;
          
          --on-surface: #0f172a;
          --on-surface-variant: #475569;
          
          --outline: #cbd5e1;
          --outline-variant: #e2e8f0;
          
          --background: #f8fafc;
        }

        html.dark .admin-theme {
          --primary: #94a3b8;
          --primary-container: #334155;
          --on-primary-container: #f8fafc;
          --secondary: #cbd5e1;
          --secondary-container: #1e293b;
          
          --surface: #0f172a;
          --surface-container-lowest: #020617;
          --surface-container-low: #0f172a;
          --surface-container: #1e293b;
          --surface-container-high: #334155;
          --surface-container-highest: #475569;
          
          --on-surface: #f8fafc;
          --on-surface-variant: #cbd5e1;
          
          --outline: #475569;
          --outline-variant: #334155;
          
          --background: #020617;
        }
      `}</style>
      <div className="admin-theme min-h-screen bg-[var(--background)] flex flex-col lg:flex-row">
      
      {/* SIDEBAR NAVIGATION (Hidden on mobile, flows as side column on desktop) */}
      <aside className={`hidden lg:flex flex-col border-r border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] shrink-0 h-screen sticky top-0 overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'w-[80px]' : 'w-[260px]'}`}>
        <div className={`h-full flex flex-col ${isSidebarCollapsed ? 'p-4' : 'p-6'}`}>
          <div className={`flex items-center mb-8 ${isSidebarCollapsed ? 'justify-center' : 'justify-between gap-3'}`}>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3">
                <img src={logoUrl} alt={`${appName} Logo`} className="w-8 h-8 rounded-lg shadow-sm object-cover shrink-0" />
                <span className="font-headline-sm whitespace-nowrap" style={{ color: 'var(--primary)', letterSpacing: '-0.02em' }}>{appName}</span>
              </div>
            )}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
              className="btn-icon shrink-0" 
              style={{ width: '32px', height: '32px' }}
              title={isSidebarCollapsed ? "Expandir" : "Contraer"}
            >
              <span className="material-symbols-outlined text-[18px]">{isSidebarCollapsed ? 'menu_open' : 'menu'}</span>
            </button>
          </div>
          
          <nav className="flex flex-col gap-1.5 flex-grow">
            <button
              onClick={() => {
                setActiveModule('dashboard');
                setShowForm(false);
                setIsEditing(false);
              }}
              className={`w-full flex items-center py-2 rounded-md transition-colors text-sm font-semibold ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start gap-3 px-3'} ${
                activeModule === 'dashboard'
                  ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)]'
                  : 'text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] hover:text-[var(--on-surface)]'
              }`}
              title={isSidebarCollapsed ? "Dashboard" : undefined}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">space_dashboard</span>
              {!isSidebarCollapsed && <span>Dashboard</span>}
            </button>

            {config.activeModules && config.activeModules.map(modKey => {
              const label = modKey === 'design_tokens' ? 'UI Kit / Marca' : (modKey === 'terms' ? 'Conceptos' : modKey === 'travel' ? 'Viajes' : modKey === 'location' ? 'Destinos' : modKey === 'departure' ? 'Salidas' : modKey === 'products' ? 'Productos' : modKey);
              const icon = modKey === 'design_tokens' ? 'palette' : (modKey === 'terms' ? 'menu_book' : modKey === 'travel' ? 'flight_takeoff' : modKey === 'location' ? 'map' : modKey === 'departure' ? 'calendar_month' : modKey === 'products' ? 'shopping_bag' : 'extension');
              const isActive = activeModule === modKey;

              return (
                <button
                  key={modKey}
                  onClick={() => {
                    setActiveModule(modKey);
                    setShowForm(false);
                    setIsEditing(false);
                  }}
                  className={`w-full flex items-center py-2 rounded-md transition-colors text-sm font-semibold ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start gap-3 px-3'} ${
                    isActive
                      ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)]'
                      : 'text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] hover:text-[var(--on-surface)]'
                  }`}
                  title={isSidebarCollapsed ? label : undefined}
                >
                  <span className="material-symbols-outlined text-[20px] shrink-0">{icon}</span>
                  {!isSidebarCollapsed && <span>{label}</span>}
                </button>
              );
            })}
          </nav>
          
          <div className="pt-4 border-t border-[var(--outline-variant)] mt-auto">
            <button
              onClick={() => {
                setActiveModule('accounts');
                setShowForm(false);
                setIsEditing(false);
              }}
              className={`w-full flex items-center py-2 rounded-md transition-colors text-sm font-semibold ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start gap-3 px-3'} ${
                activeModule === 'accounts'
                  ? 'bg-[var(--primary-container)] text-[var(--on-primary-container)]'
                  : 'text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] hover:text-[var(--on-surface)]'
              }`}
              title={isSidebarCollapsed ? "Cuentas" : undefined}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">group</span>
              {!isSidebarCollapsed && <span>Cuentas</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden">
          <AppHeader
            config={config}
            session={session}
            onLogout={handleLogout}
            guessSetupUrl={guessSetupUrl}
            appName={appName}
            logoUrl={logoUrl}
            backUrl={backUrl}
          />
        </div>
        
        {/* On desktop, maybe we can hide AppHeader since we have sidebar, or adapt it. Let's keep it for now and use it as top bar */}
        <div className="hidden lg:block border-b border-[var(--outline-variant)] bg-[var(--surface-container-lowest)]">
           <AppHeader
            config={config}
            session={session}
            onLogout={handleLogout}
            guessSetupUrl={guessSetupUrl}
            appName={appName}
            logoUrl={logoUrl}
            backUrl={backUrl}
          />
        </div>

        <main className="flex-1 p-4 lg:p-6 space-y-4 lg:space-y-6 w-full">
          {/* Header bar */}
          {activeModule !== 'dashboard' && (
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--outline-variant)] pb-4 gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {showForm && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedId(null);
                    setShowForm(false);
                  }}
                  className="btn-icon shrink-0"
                  title="Volver al listado"
                  style={{ width: '36px', height: '36px' }}
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                </button>
              )}
              <h2 className="text-xl md:text-2xl font-bold text-[var(--on-surface)] whitespace-nowrap">
                {showForm
                  ? (isEditing 
                      ? (activeModule === 'travel' ? 'Editar Viaje' : activeModule === 'location' ? 'Editar Destino' : activeModule === 'departure' ? 'Editar Salida' : activeModule === 'terms' ? 'Editar Término / Condición' : activeModule === 'design_tokens' ? 'Editar UI Kit' : 'Editar Concepto')
                      : (!creatingTypeSelected ? 'Añadir Nuevo Registro' : (activeModule === 'travel' ? 'Nuevo Viaje' : activeModule === 'location' ? 'Nuevo Destino' : activeModule === 'departure' ? 'Nueva Salida' : activeModule === 'terms' ? 'Nuevo Término / Condición' : activeModule === 'design_tokens' ? 'Nuevo UI Kit' : 'Nuevo Concepto'))
                    )
                  : (activeModule === 'dashboard' ? 'Panel de Control' : activeModule === 'travel' ? 'Gestión de Viajes' : activeModule === 'design_tokens' ? 'Gestión de UI Kit / Marca' : activeModule === 'terms' ? 'Gestión de Conceptos / Glosario' : activeModule === 'products' ? 'Gestión de Productos' : activeModule === 'location' ? 'Gestión de Destinos' : activeModule === 'departure' ? 'Salidas Programadas' : 'Gestión de Contenidos')}
              </h2>
            </div>

            {/* Right Action Row */}
            <div className="flex flex-wrap items-center gap-3">
              {showForm && creatingTypeSelected && (
                  <>
                    {/* Dropdown for Plantilla actions */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
                        className="btn-secondary flex items-center justify-center gap-2 h-9 rounded-md text-sm px-4"
                      >
                        <span className="material-symbols-outlined text-sm">folder_open</span>
                        Plantilla
                        <span className="material-symbols-outlined text-sm">expand_more</span>
                      </button>
                      {templateDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-max rounded-xl bg-[var(--surface-container-high)] border border-[var(--outline-variant)] shadow-lg z-50 py-1">
                          <button
                            type="button"
                            onClick={() => {
                              handleDownloadTemplate();
                              setTemplateDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-[var(--on-surface)] hover:bg-[var(--surface-container-highest)] flex items-center gap-2 border-none bg-transparent cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                            Descargar Plantilla
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              document.getElementById('form-template-input').click();
                              setTemplateDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-[var(--on-surface)] hover:bg-[var(--surface-container-highest)] flex items-center gap-2 border-none bg-transparent cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">upload_file</span>
                            Cargar Plantilla
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPasteJsonModal(true);
                              setTemplateDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-[var(--on-surface)] hover:bg-[var(--surface-container-highest)] flex items-center gap-2 border-none bg-transparent cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">content_paste</span>
                            Pegar JSON
                          </button>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      id="form-template-input"
                      accept=".json"
                      className="hidden"
                      onChange={handleUploadFormTemplate}
                    />
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        setIsTranslating(true);
                        setTranslationLog(['Iniciando traducción...']);
                        setTranslationProgress(0);
                        
                        try {
                          const log = (msg) => {
                            setTranslationLog(prev => [...prev, msg]);
                          };
                          
                          const translateText = async (text) => {
                            if (!text || typeof text !== 'string') return text;
                            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`);
                            if (res.status === 429) {
                                throw new Error("429 Too Many Requests");
                            }
                            const json = await res.json();
                            return json[0].map(item => item[0]).join('');
                          };

                          const newFormData = { ...formData };
                          let updated = false;

                          const fieldsToTranslate = [
                            { src: 'name', dst: 'name_en', label: 'Nombre' },
                            { src: 'title', dst: 'title_en', label: 'Título' },
                            { src: 'subtitle', dst: 'subtitle_en', label: 'Subtítulo' },
                            { src: 'overview', dst: 'overview_en', label: 'Overview' },
                            { src: 'description', dst: 'description_en', label: 'Descripción' },
                            { src: 'destination', dst: 'destination_en', label: 'Destino' },
                            { src: 'destinationsSummary', dst: 'destinationsSummary_en', label: 'Resumen de Destinos' },
                            { src: 'flavorText', dst: 'flavorText_en', label: 'Etiqueta (Flavor Text)' },
                            { src: 'highlights', dst: 'highlights_en', label: 'Highlights' },
                            { src: 'travelerTips', dst: 'travelerTips_en', label: 'Tips' },
                            { src: 'guideBestSeason', dst: 'guideBestSeason_en', label: 'Mejor época' },
                            { src: 'guideHowToGetAround', dst: 'guideHowToGetAround_en', label: 'Cómo moverse' }
                          ];
                          let totalItems = fieldsToTranslate.length;
                          
                          if (newFormData.itinerary && Array.isArray(newFormData.itinerary)) {
                            totalItems += newFormData.itinerary.length;
                          }
                          if (newFormData.servicesExcludedList) totalItems++;
                          if (newFormData.servicesIncludedList) totalItems++;
                          
                          let currentItem = 0;
                          const updateProgress = () => {
                            currentItem++;
                            setTranslationProgress(Math.round((currentItem / totalItems) * 100));
                          };

                          for (const field of fieldsToTranslate) {
                            if (newFormData[field.src] && (!newFormData[field.dst] || newFormData[field.dst] === newFormData[field.src])) {
                              log(`Traduciendo: ${field.label}...`);
                              const translated = await translateText(newFormData[field.src]);
                              if (translated && translated !== newFormData[field.src]) {
                                newFormData[field.dst] = translated;
                                updated = true;
                              }
                            } else if (newFormData[field.src]) {
                              log(`Omitido: ${field.label} (Ya traducido)`);
                            } else {
                              log(`Omitido: ${field.label} (Vacío)`);
                            }
                            updateProgress();
                          }

                          // Itinerary
                          if (newFormData.itinerary && Array.isArray(newFormData.itinerary)) {
                            for (let i = 0; i < newFormData.itinerary.length; i++) {
                              const day = newFormData.itinerary[i];
                              let dayUpdated = false;
                              if (day.dayTitle && (!day.dayTitle_en || day.dayTitle_en === day.dayTitle)) {
                                const translated = await translateText(day.dayTitle);
                                if (translated && translated !== day.dayTitle) { day.dayTitle_en = translated; updated = true; dayUpdated = true; }
                              }
                              if (day.accommodationType && (!day.accommodationType_en || day.accommodationType_en === day.accommodationType)) {
                                const translated = await translateText(day.accommodationType);
                                if (translated && translated !== day.accommodationType) { day.accommodationType_en = translated; updated = true; dayUpdated = true; }
                              }
                              if (day.activities && Array.isArray(day.activities)) {
                                for (const act of day.activities) {
                                  if (act.description && (!act.description_en || act.description_en === act.description)) {
                                    const translated = await translateText(act.description);
                                    if (translated && translated !== act.description) { act.description_en = translated; updated = true; dayUpdated = true; }
                                  }
                                }
                              }
                              if (!dayUpdated) {
                                log(`Omitido: Día ${i + 1} (Ya traducido o sin cambios)`);
                              } else {
                                log(`Traducido: Día ${i + 1}`);
                              }
                              updateProgress();
                            }
                          }

                          // Services Excluded
                          if (newFormData.servicesExcludedList && Array.isArray(newFormData.servicesExcludedList) && newFormData.servicesExcludedList.length > 0) {
                            if (!newFormData.servicesExcludedList_en || newFormData.servicesExcludedList.length !== newFormData.servicesExcludedList_en.length) {
                              newFormData.servicesExcludedList_en = [];
                              log(`Traduciendo Servicios Excluidos...`);
                              for (const str of newFormData.servicesExcludedList) {
                                if (str && str.trim()) {
                                  const translated = await translateText(str);
                                  newFormData.servicesExcludedList_en.push(translated || str);
                                  updated = true;
                                } else {
                                  newFormData.servicesExcludedList_en.push(str);
                                }
                              }
                            } else {
                              log(`Omitido: Servicios Excluidos (Ya traducido)`);
                            }
                            updateProgress();
                          }

                          // Services Included
                          if (newFormData.servicesIncludedList && Array.isArray(newFormData.servicesIncludedList)) {
                            let servicesUpdated = false;
                            for (const group of newFormData.servicesIncludedList) {
                              if (group.items && Array.isArray(group.items) && group.items.length > 0) {
                                if (!group.items_en || group.items.length !== group.items_en.length) {
                                  group.items_en = [];
                                  for (const str of group.items) {
                                    if (str && str.trim()) {
                                      const translated = await translateText(str);
                                      group.items_en.push(translated || str);
                                      updated = true;
                                      servicesUpdated = true;
                                    } else {
                                      group.items_en.push(str);
                                    }
                                  }
                                }
                              }
                            }
                            if (servicesUpdated) {
                              log(`Traducido: Servicios Incluidos`);
                            } else {
                              log(`Omitido: Servicios Incluidos (Ya traducido)`);
                            }
                            updateProgress();
                          }

                          if (updated) {
                            setFormData(newFormData);
                            log('¡Traducción completada con éxito!');
                          } else {
                            log('No se encontraron campos nuevos por traducir.');
                          }
                          setTranslationProgress(100);
                        } catch (err) {
                          if (err.message && err.message.includes('429')) {
                            setTranslationLog(prev => [...prev, 'Error: Google Translate ha bloqueado temporalmente las peticiones por exceso de uso (Error 429).']);
                          } else {
                            setTranslationLog(prev => [...prev, 'Error en auto-traducción: ' + err.message]);
                          }
                        }
                      }}
                      className="btn-secondary h-9 rounded-md text-sm px-4 mr-2 border border-[var(--primary)] text-[var(--primary)]"
                    >
                      <span className="material-symbols-outlined text-sm mr-1">translate</span>
                      Auto-Traducir a Inglés
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSave(e, true)}
                      className="btn-secondary h-9 rounded-md text-sm px-4"
                    >
                      <span className="material-symbols-outlined text-sm mr-1">save</span>
                      Guardar Borrador
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSave(e, false)}
                      className="btn-primary h-9 rounded-md text-sm px-4"
                    >
                      <span className="material-symbols-outlined text-sm mr-1">publish</span>
                      {activeModule === 'travel' ? 'Publicar Viaje' : activeModule === 'design_tokens' ? 'Publicar UI Kit' : 'Publicar Concepto'}
                    </button>
                  </>
              )}
            </div>
          </div>
          )}

        {showForm ? (
          !creatingTypeSelected ? (
            <div className="glass-panel p-10 max-w-2xl mx-auto text-center space-y-8 my-8">
              <h2 className="font-headline-lg text-[var(--on-surface)]">¿Qué tipo de registro deseas crear?</h2>
              <p className="text-sm text-[var(--on-surface-variant)]">Selecciona el tipo de contenido para inicializar el editor correspondiente. Esta selección no podrá cambiarse después.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModule('terms');
                    setCreatingTypeSelected(true);
                  }}
                  className="glass-panel p-8 text-center flex flex-col items-center justify-center gap-4 hover:border-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_5%,transparent)] transition-all cursor-pointer group"
                  style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}
                >
                  <span className="material-symbols-outlined text-4xl text-[var(--primary)] group-hover:scale-110 transition-transform">menu_book</span>
                  <div>
                    <h3 className="font-headline-sm text-[var(--on-surface)] mb-1">Concepto / Glosario</h3>
                    <p className="text-xs text-[var(--on-surface-variant)]">Patrón de desarrollo, guía paso a paso, prompt template y videos.</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModule('design_tokens');
                    setCreatingTypeSelected(true);
                  }}
                  className="glass-panel p-8 text-center flex flex-col items-center justify-center gap-4 hover:border-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_5%,transparent)] transition-all cursor-pointer group"
                  style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}
                >
                  <span className="material-symbols-outlined text-4xl text-[var(--primary)] group-hover:scale-110 transition-transform">palette</span>
                  <div>
                    <h3 className="font-headline-sm text-[var(--on-surface)] mb-1">UI Kit / Marca</h3>
                    <p className="text-xs text-[var(--on-surface-variant)]">Sistema de diseño, paleta de colores, tipografías y logotipos vectoriales.</p>
                  </div>
                </button>
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary text-sm"
                  style={{ padding: '8px 24px' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* MAIN FORM: (9 cols) */}
                <div className="lg:col-span-9 space-y-6 order-2 lg:order-last">
                  {activeModule === 'travel' ? (
                    <TravelFormEditor
                      formData={formData}
                      setFormData={setFormData}
                      locations={locations}
                      departures={departures}
                      travels={travels}
                      onSaveQuickDeparture={async (departureData) => {
                        const { buildDeparturePayload } = await import('./utils/buildPayload.js');
                        const formattedData = buildDeparturePayload(departureData, departureData.isDraft);
                        if (config.provider === 'localStorage') {
                          const cached = localStorage.getItem('glosaurio_departure');
                          const localItems = cached ? JSON.parse(cached) : [];
                          const newItem = { ...formattedData, id: `departure-${Date.now()}` };
                          localItems.unshift(newItem);
                          localStorage.setItem('glosaurio_departure', JSON.stringify(localItems));
                          setDepartures(localItems);
                        } else {
                          await service.createItem('departure', formattedData);
                          // Re-fetch departures
                          const raw = await service.getItems('departure');
                          setDepartures(raw.map(d => ({
                            ...d,
                            travelId: d.travel_id || d.travelId || '',
                            departureDate: d.departure_date || d.departureDate || '',
                            status: d.status || 'open',
                            isDraft: d.is_published !== undefined ? !d.is_published : (d.isPublished !== undefined ? !d.isPublished : false)
                          })));
                        }
                      }}
                    />
                  ) : activeModule === 'departure' ? (
                    <DepartureFormEditor
                      formData={formData}
                      setFormData={setFormData}
                      travels={travels}
                    />
                  ) : activeModule === 'blog' ? (
                    <BlogFormEditor
                      formData={formData}
                      setFormData={setFormData}
                    />
                  ) : activeModule === 'location' ? (
                    <LocationFormEditor
                      formData={formData}
                      setFormData={setFormData}
                      locations={locations}
                      travels={travels}
                      activePanels={activePanels}
                      expandedSections={expandedSections}
                      toggleSection={toggleSection}
                      isEditing={isEditing}
                    />
                  ) : activeModule === 'design_tokens' ? (
                    <DesignTokensFormEditor
                      formData={formData}
                      setFormData={setFormData}
                      activePanels={activePanels}
                      handlers={{
                        handleColorChange,
                        addColor,
                        removeColor,
                        handleTypographyChange,
                        addTypography,
                        removeTypography,
                        handleLogoChange,
                        addLogo,
                        removeLogo
                      }}
                    />
                  ) : (
                    <TermsFormEditor
                      formData={formData}
                      setFormData={setFormData}
                      activePanels={activePanels}
                      setActivePanels={setActivePanels}
                      expandedSections={expandedSections}
                      toggleSection={toggleSection}
                      config={config}
                      mergedResultsOptions={mergedResultsOptions}
                      showAllResults={showAllResults}
                      setShowAllResults={setShowAllResults}
                      handlers={{
                        handleStepChange,
                        addStep,
                        removeStep,
                        handleVideoChange,
                        addVideo,
                        removeVideo
                      }}
                    />
                  )}
                </div>

                {/* SIDEBAR: (3 cols) */}
                <aside className="lg:col-span-3 space-y-6 order-1 lg:order-first lg:sticky lg:top-8 self-start">
                  {activeModule === 'design_tokens' ? (
                    <div className="space-y-6">
                      {/* Secciones Disponibles para Design Tokens */}
                      {(!activePanels.color || !activePanels.typography || !activePanels.logo) && (
                        <div className="glass-panel p-6">
                          <h3 className="font-headline-sm mb-4 text-[var(--on-surface)]">Añadir Secciones</h3>
                          <p className="text-xs text-[var(--on-surface-variant)] mb-3">Haz clic en un componente para agregarlo a tu sistema de diseño:</p>
                          <div className="flex flex-col gap-2">
                            {!activePanels.color && (
                              <span onClick={() => { setActivePanels(p => ({ ...p, color: true })); setExpandedSections(s => ({ ...s, color: true })); }} className="chip chip-neutral justify-between cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'flex', width: '100%', padding: '10px 14px' }}>
                                <span className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-sm">color_lens</span>
                                  Paleta de Colores
                                </span>
                                <span className="material-symbols-outlined text-sm">add</span>
                              </span>
                            )}
                            {!activePanels.typography && (
                              <span onClick={() => { setActivePanels(p => ({ ...p, typography: true })); setExpandedSections(s => ({ ...s, typography: true })); }} className="chip chip-neutral justify-between cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'flex', width: '100%', padding: '10px 14px' }}>
                                <span className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-sm">text_fields</span>
                                  Tipografía
                                </span>
                                <span className="material-symbols-outlined text-sm">add</span>
                              </span>
                            )}
                            {!activePanels.logo && (
                              <span onClick={() => { setActivePanels(p => ({ ...p, logo: true })); setExpandedSections(s => ({ ...s, logo: true })); }} className="chip chip-neutral justify-between cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'flex', width: '100%', padding: '10px 14px' }}>
                                <span className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-sm">crop_schema</span>
                                  Logo SVG
                                </span>
                                <span className="material-symbols-outlined text-sm">add</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="glass-panel p-6 space-y-4">
                        <h3 className="font-headline-sm text-[var(--on-surface)]">Guía de Formatos</h3>
                        <p className="text-xs text-[var(--on-surface-variant)] leading-relaxed">
                          <strong>Colores:</strong> Usa HEX (#000000), HSL o RGB. Se previsualizará automáticamente si el formato es válido.
                        </p>
                        <p className="text-xs text-[var(--on-surface-variant)] leading-relaxed">
                          <strong>Tipografía:</strong> La fuente de Google Fonts debe ingresarse con su nombre exacto (ej. "Plus Jakarta Sans") para ser cargada de manera dinámica.
                        </p>
                        <p className="text-xs text-[var(--on-surface-variant)] leading-relaxed">
                          <strong>Logo SVG:</strong> Inserta el código XML crudo del SVG. Asegúrate de incluir el atributo <code>viewBox</code> para un escalado responsivo.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Secciones Disponibles */}
                      {activeModule === 'location' && (
                        <div className="space-y-6">
                          <div className="glass-panel p-6">
                            <h3 className="font-headline-sm mb-2 text-[var(--on-surface)]">Añadir Secciones</h3>
                            <p className="text-xs text-[var(--on-surface-variant)] mb-4">Haz clic en una sección para agregarla al formulario:</p>
                            <div className="flex flex-col gap-2">
                              {formData.type === 'region' ? (
                                <>
                                  {!activePanels.logistics && (
                                    <span onClick={() => { setActivePanels(p => ({ ...p, logistics: true })); setExpandedSections(s => ({ ...s, logistics: true })); }} className="chip chip-neutral justify-between cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'flex', width: '100%', padding: '10px 14px' }}>
                                      <span className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">local_shipping</span>
                                        Guía Logística General
                                      </span>
                                      <span className="material-symbols-outlined text-sm">add</span>
                                    </span>
                                  )}
                                  {!activePanels.routes && (
                                    <span onClick={() => { setActivePanels(p => ({ ...p, routes: true })); setExpandedSections(s => ({ ...s, routes: true, itineraries: true })); }} className="chip chip-neutral justify-between cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'flex', width: '100%', padding: '10px 14px' }}>
                                      <span className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">route</span>
                                        Mapa e Itinerarios
                                      </span>
                                      <span className="material-symbols-outlined text-sm">add</span>
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  {!activePanels.practicalData && (
                                    <span onClick={() => { setActivePanels(p => ({ ...p, practicalData: true })); setExpandedSections(s => ({ ...s, practicalData: true })); }} className="chip chip-neutral justify-between cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'flex', width: '100%', padding: '10px 14px' }}>
                                      <span className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">info</span>
                                        Datos Prácticos de Visita
                                      </span>
                                      <span className="material-symbols-outlined text-sm">add</span>
                                    </span>
                                  )}
                                  {!activePanels.mapPosition && (
                                    <span onClick={() => { setActivePanels(p => ({ ...p, mapPosition: true })); setExpandedSections(s => ({ ...s, mapPosition: true })); }} className="chip chip-neutral justify-between cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'flex', width: '100%', padding: '10px 14px' }}>
                                      <span className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">map</span>
                                        Ubicación en el Mapa
                                      </span>
                                      <span className="material-symbols-outlined text-sm">add</span>
                                    </span>
                                  )}
                                  {!activePanels.amenities && (
                                    <span onClick={() => { setActivePanels(p => ({ ...p, amenities: true })); setExpandedSections(s => ({ ...s, amenities: true })); }} className="chip chip-neutral justify-between cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'flex', width: '100%', padding: '10px 14px' }}>
                                      <span className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">room_service</span>
                                        Servicios y Amenidades
                                      </span>
                                      <span className="material-symbols-outlined text-sm">add</span>
                                    </span>
                                  )}
                                  {!activePanels.highlightsAndTips && (
                                    <span onClick={() => { setActivePanels(p => ({ ...p, highlightsAndTips: true })); setExpandedSections(s => ({ ...s, highlightsAndTips: true })); }} className="chip chip-neutral justify-between cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'flex', width: '100%', padding: '10px 14px' }}>
                                      <span className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">explore</span>
                                        Contenido de la Experiencia
                                      </span>
                                      <span className="material-symbols-outlined text-sm">add</span>
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Índice de Secciones */}
                          <div className="glass-panel p-6 space-y-4 lg:sticky lg:top-8">
                            <h3 className="font-headline-sm text-[var(--on-surface)] flex items-center gap-2">
                              <span className="material-symbols-outlined text-base text-[var(--primary)]">toc</span>
                              Índice de Secciones
                            </h3>
                            <p className="text-[11px] text-[var(--on-surface-variant)] mb-2">Secciones activas en este formulario. Haz clic para desplazarte a ella:</p>
                            <div className="flex flex-col gap-2.5">
                              <a href="#sec-identity" className="flex items-center justify-between text-xs font-semibold text-[var(--primary)] hover:underline border-l-2 border-[var(--primary)] pl-2">
                                <span>Identidad (Obligatorio)</span>
                                <span className="material-symbols-outlined text-xs text-[var(--primary)]">check_circle</span>
                              </a>

                              {formData.type === 'region' ? (
                                <>
                                  {activePanels.logistics && (
                                    <a href="#sec-logistics" className={`flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 ${expandedSections.logistics ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--on-surface-variant)]'}`}>
                                      <span>Guía Logística</span>
                                      <span className="material-symbols-outlined text-xs">{expandedSections.logistics ? 'visibility' : 'visibility_off'}</span>
                                    </a>
                                  )}
                                  {activePanels.routes && (
                                    <>
                                      <a href="#sec-routes" className={`flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 ${expandedSections.routes ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--on-surface-variant)]'}`}>
                                        <span>Mapa de la Región</span>
                                        <span className="material-symbols-outlined text-xs">{expandedSections.routes ? 'visibility' : 'visibility_off'}</span>
                                      </a>
                                      <a href="#sec-itineraries" className={`flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 ${expandedSections.itineraries !== false ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--on-surface-variant)]'}`}>
                                        <span>Itinerarios Sugeridos</span>
                                        <span className="material-symbols-outlined text-xs">{expandedSections.itineraries !== false ? 'visibility' : 'visibility_off'}</span>
                                      </a>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  {activePanels.practicalData && (
                                    <a href="#sec-practicalData" className={`flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 ${expandedSections.practicalData ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--on-surface-variant)]'}`}>
                                      <span>Datos Prácticos</span>
                                      <span className="material-symbols-outlined text-xs">{expandedSections.practicalData ? 'visibility' : 'visibility_off'}</span>
                                    </a>
                                  )}
                                  {activePanels.mapPosition && (
                                    <a href="#sec-mapPosition" className={`flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 ${expandedSections.mapPosition ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--on-surface-variant)]'}`}>
                                      <span>Ubicación en Mapa</span>
                                      <span className="material-symbols-outlined text-xs">{expandedSections.mapPosition ? 'visibility' : 'visibility_off'}</span>
                                    </a>
                                  )}
                                  {activePanels.amenities && (
                                    <a href="#sec-amenities" className={`flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 ${expandedSections.amenities ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--on-surface-variant)]'}`}>
                                      <span>Servicios y Amenidades</span>
                                      <span className="material-symbols-outlined text-xs">{expandedSections.amenities ? 'visibility' : 'visibility_off'}</span>
                                    </a>
                                  )}
                                  {activePanels.highlightsAndTips && (
                                    <a href="#sec-highlightsAndTips" className={`flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 ${expandedSections.highlightsAndTips ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--on-surface-variant)]'}`}>
                                      <span>Contenido Experiencia</span>
                                      <span className="material-symbols-outlined text-xs">{expandedSections.highlightsAndTips ? 'visibility' : 'visibility_off'}</span>
                                    </a>
                                  )}
                                </>
                              )}

                              {activePanels.images && (
                                <a href="#sec-images" className={`flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 ${expandedSections.images ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--on-surface-variant)]'}`}>
                                  <span>Galería e Imágenes</span>
                                  <span className="material-symbols-outlined text-xs">{expandedSections.images ? 'visibility' : 'visibility_off'}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {activeModule === 'terms' && Object.values(activePanels).includes(false) && (
                        <div className="glass-panel p-6">
                          <h3 className="font-headline-sm mb-2 text-[var(--on-surface)]">Añadir Secciones</h3>
                          <p className="text-xs text-[var(--on-surface-variant)] mb-4">Haz clic en una sección para agregarla al formulario:</p>
                          <div className="flex flex-wrap gap-2">
                            {!activePanels.steps && (
                              <span onClick={() => { setActivePanels(p => ({ ...p, steps: true })); setExpandedSections(s => ({ ...s, steps: true })); }} className="chip chip-neutral cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal' }}>
                                <span className="material-symbols-outlined text-sm mr-1">route</span>
                                Proceso Paso a Paso
                              </span>
                            )}
                            {!activePanels.problems && (
                              <span onClick={() => { setActivePanels(p => ({ ...p, problems: true })); setExpandedSections(s => ({ ...s, problems: true })); }} className="chip chip-neutral cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal' }}>
                                <span className="material-symbols-outlined text-sm mr-1">balance</span>
                                Problemas y Beneficios
                              </span>
                            )}
                            {!activePanels.scenarios && (
                              <span onClick={() => { setActivePanels(p => ({ ...p, scenarios: true })); setExpandedSections(s => ({ ...s, scenarios: true })); }} className="chip chip-neutral cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal' }}>
                                <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                                Casos de Uso SÍ/NO
                              </span>
                            )}
                            {!activePanels.metrics && (
                              <span onClick={() => { setActivePanels(p => ({ ...p, metrics: true })); setExpandedSections(s => ({ ...s, metrics: true })); }} className="chip chip-neutral cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal' }}>
                                <span className="material-symbols-outlined text-sm mr-1">insights</span>
                                Resultados y Métricas
                              </span>
                            )}
                            {!activePanels.prompt && (
                              <span onClick={() => { setActivePanels(p => ({ ...p, prompt: true })); setExpandedSections(s => ({ ...s, prompt: true })); }} className="chip chip-neutral cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal' }}>
                                <span className="material-symbols-outlined text-sm mr-1">prompt_suggestion</span>
                                Prompt Template
                              </span>
                            )}
                            {!activePanels.code && (
                              <span onClick={() => { setActivePanels(p => ({ ...p, code: true })); setExpandedSections(s => ({ ...s, code: true })); }} className="chip chip-neutral cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal' }}>
                                <span className="material-symbols-outlined text-sm mr-1">code</span>
                                Ejemplo Técnico / Código
                              </span>
                            )}
                            {!activePanels.videos && (
                              <span onClick={() => { setActivePanels(p => ({ ...p, videos: true })); setExpandedSections(s => ({ ...s, videos: true })); }} className="chip chip-neutral cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]" style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal' }}>
                                <span className="material-symbols-outlined text-sm mr-1">video_library</span>
                                Videos Relacionados
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Associated Tools */}
                      {activeModule !== 'travel' && activeModule !== 'location' && (
                        <div className="glass-panel p-6">
                          <h3 className="font-headline-sm mb-4 text-[var(--on-surface)]">Herramientas Asociadas</h3>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {(formData.tools || []).map((t, idx) => (
                              <span key={idx} className="chip chip-primary" style={{ cursor: 'pointer' }}>
                                {t}
                                <button
                                  type="button"
                                  onClick={() => removeTool(idx)}
                                  className="btn-remove-tool ml-1 bg-transparent border-none cursor-pointer color-inherit p-0 text-[12px]"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              id="tool-input"
                              placeholder="Añadir herramienta..."
                              className="form-input flex-1"
                              style={{ padding: '10px 14px' }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addTool(e.target.value);
                                  e.target.value = '';
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById('tool-input');
                                if (input) {
                                  addTool(input.value);
                                  input.value = '';
                                }
                              }}
                              className="btn-icon"
                              title="Agregar herramienta"
                            >
                              <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Índice de Secciones para Terms */}
                      {activeModule === 'terms' && (
                        <div className="glass-panel p-6 space-y-4 lg:sticky lg:top-8">
                          <h3 className="font-headline-sm text-[var(--on-surface)] flex items-center gap-2">
                            <span className="material-symbols-outlined text-base text-[var(--primary)]">toc</span>
                            Índice de Secciones
                          </h3>
                          <p className="text-[11px] text-[var(--on-surface-variant)] mb-2">Secciones activas en este formulario. Haz clic para desplazarte a ella:</p>
                          <div className="flex flex-col gap-2.5">
                            <a href="#sec-identity" className="flex items-center justify-between text-xs font-semibold text-[var(--primary)] hover:underline border-l-2 border-[var(--primary)] pl-2">
                              <span>Identidad (Obligatorio)</span>
                              <span className="material-symbols-outlined text-xs text-[var(--primary)]">check_circle</span>
                            </a>

                            {activePanels.steps && (
                              <a href="#sec-steps" className={`flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 ${expandedSections.steps ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--on-surface-variant)]'}`}>
                                <span>Proceso Paso a Paso</span>
                                <span className="material-symbols-outlined text-xs">{expandedSections.steps ? 'visibility' : 'visibility_off'}</span>
                              </a>
                            )}

                            {activePanels.problems && (
                              <a href="#sec-problems" className={`flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 ${expandedSections.problems ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--on-surface-variant)]'}`}>
                                <span>Problemas y Beneficios</span>
                                <span className="material-symbols-outlined text-xs">{expandedSections.problems ? 'visibility' : 'visibility_off'}</span>
                              </a>
                            )}

                            {activePanels.scenarios && (
                              <a href="#sec-scenarios" className={`flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 ${expandedSections.scenarios ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--on-surface-variant)]'}`}>
                                <span>Casos de Uso SÍ/NO</span>
                                <span className="material-symbols-outlined text-xs">{expandedSections.scenarios ? 'visibility' : 'visibility_off'}</span>
                              </a>
                            )}

                            {activePanels.metrics && (
                              <a href="#sec-metrics" className={`flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 ${expandedSections.metrics ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--on-surface-variant)]'}`}>
                                <span>Resultados y Métricas</span>
                                <span className="material-symbols-outlined text-xs">{expandedSections.metrics ? 'visibility' : 'visibility_off'}</span>
                              </a>
                            )}

                            {activePanels.prompt && (
                              <a href="#sec-prompt" className={`flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 ${expandedSections.prompt ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--on-surface-variant)]'}`}>
                                <span>Prompt Template</span>
                                <span className="material-symbols-outlined text-xs">{expandedSections.prompt ? 'visibility' : 'visibility_off'}</span>
                              </a>
                            )}

                            {activePanels.code && (
                              <a href="#sec-code" className={`flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 ${expandedSections.code ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--on-surface-variant)]'}`}>
                                <span>Ejemplo Técnico / Código</span>
                                <span className="material-symbols-outlined text-xs">{expandedSections.code ? 'visibility' : 'visibility_off'}</span>
                              </a>
                            )}

                            {activePanels.videos && (
                              <a href="#sec-videos" className={`flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 ${expandedSections.videos ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--on-surface-variant)]'}`}>
                                <span>Videos Relacionados</span>
                                <span className="material-symbols-outlined text-xs">{expandedSections.videos ? 'visibility' : 'visibility_off'}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Índice de Secciones para Travel */}
                  {activeModule === 'travel' && (
                    <div className="glass-panel p-6 space-y-4 lg:sticky lg:top-8">
                      <h3 className="font-headline-sm text-[var(--on-surface)] flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-[var(--primary)]">toc</span>
                        Índice de Secciones
                      </h3>
                      <p className="text-[11px] text-[var(--on-surface-variant)] mb-2">Secciones de este viaje. Haz clic para desplazarte a ella:</p>
                      <div className="flex flex-col gap-2.5">
                        <a href="#sec-travel-details" className="flex items-center justify-between text-xs font-semibold text-[var(--primary)] hover:underline border-l-2 border-[var(--primary)] pl-2">
                          <span>Detalles del Plan</span>
                          <span className="material-symbols-outlined text-xs text-[var(--primary)]">check_circle</span>
                        </a>
                        <a href="#sec-travel-destinations" className="flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 border-[var(--primary)] text-[var(--primary)]">
                          <span>Destinos y Países</span>
                          <span className="material-symbols-outlined text-xs">map</span>
                        </a>
                        <a href="#sec-travel-itinerary" className="flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 border-[var(--primary)] text-[var(--primary)]">
                          <span>Itinerario Día a Día</span>
                          <span className="material-symbols-outlined text-xs">calendar_today</span>
                        </a>
                        <a href="#sec-travel-included" className="flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 border-[var(--primary)] text-[var(--primary)]">
                          <span>Servicios Incluidos</span>
                          <span className="material-symbols-outlined text-xs">done_all</span>
                        </a>
                        <a href="#sec-travel-excluded" className="flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 border-[var(--primary)] text-[var(--primary)]">
                          <span>Servicios No Incluidos</span>
                          <span className="material-symbols-outlined text-xs">cancel</span>
                        </a>
                        <a href="#sec-travel-hotels" className="flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 border-[var(--primary)] text-[var(--primary)]">
                          <span>Hoteles Previstos</span>
                          <span className="material-symbols-outlined text-xs">apartment</span>
                        </a>
                        <a href="#sec-travel-departures" className="flex items-center justify-between text-xs font-semibold hover:underline pl-2 border-l-2 border-[var(--primary)] text-[var(--primary)]">
                          <span>Salidas Programadas</span>
                          <span className="material-symbols-outlined text-xs">event_available</span>
                        </a>
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          )
        ) : activeModule === 'accounts' ? (
          <AccountsManager />
        ) : activeModule === 'dashboard' ? (
          <DashboardView
            config={config}
            stats={dashboardStats}
            loading={loadingStats}
            setActiveModule={setActiveModule}
            setShowForm={setShowForm}
            setCreatingTypeSelected={setCreatingTypeSelected}
            setIsEditing={setIsEditing}
            setSelectedId={setSelectedId}
          />
        ) : (
          <ItemsTable
            items={items}
            activeModule={activeModule}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            sortAlphabetical={sortAlphabetical}
            setSortAlphabetical={setSortAlphabetical}
            workAreas={workAreas}
            contentTypes={contentTypes}
            loadingData={loadingData}
            startEdit={startEdit}
            handleDelete={handleDelete}
            handleToggleStatus={handleToggleStatus}
            handleImportFile={handleImportFile}
            setIsEditing={setIsEditing}
            setSelectedId={setSelectedId}
            setFormData={setFormData}
            setActivePanels={setActivePanels}
            setCreatingTypeSelected={setCreatingTypeSelected}
            setShowForm={setShowForm}
            travels={travels}
            departures={departures}
          />
        )}
      </main>

      {showPasteJsonModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-[var(--surface-container-high)] border border-[var(--outline-variant)] rounded-xl w-full max-w-lg p-6 space-y-4 shadow-xl text-[var(--on-surface)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--primary)]">content_paste</span>
                Pegar Plantilla JSON
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowPasteJsonModal(false); setPastedJsonText(''); }}
                className="btn-icon bg-transparent border-none cursor-pointer flex items-center justify-center"
                style={{ width: '32px', height: '32px' }}
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <p className="text-xs text-[var(--on-surface-variant)]">
              Pega el contenido JSON de la plantilla para rellenar el formulario automáticamente.
            </p>
            <textarea
              value={pastedJsonText}
              onChange={(e) => setPastedJsonText(e.target.value)}
              placeholder='{ "title": "Ejemplo", ... }'
              rows={8}
              className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors resize-y min-h-[160px]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowPasteJsonModal(false); setPastedJsonText(''); }}
                className="btn-secondary text-xs font-semibold px-4 py-2 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(pastedJsonText);
                    handleImportedTemplateData(parsed);
                    setShowPasteJsonModal(false);
                    setPastedJsonText('');
                    alert("¡Formulario rellenado desde el JSON pegado!");
                  } catch (e) {
                    alert('El JSON ingresado no es válido. Por favor verifica el formato.');
                  }
                }}
                className="btn-primary text-xs font-semibold px-4 py-2 rounded-md transition-colors"
              >
                Cargar
              </button>
            </div>
          </div>
        </div>
      )}

      {isTranslating && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--surface)] text-[var(--on-surface)] rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fade-in-up border border-[var(--outline-variant)]">
            <h3 className="text-xl font-headline-sm mb-4">Traduciendo Viaje al Inglés</h3>
            <div className="mb-4">
              <div className="h-2 w-full bg-[var(--surface-container-high)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--primary)] transition-all duration-300 ease-out"
                  style={{ width: `${translationProgress}%` }}
                />
              </div>
              <p className="text-right text-xs mt-1 text-[var(--on-surface-variant)]">{translationProgress}%</p>
            </div>
            
            <div className="bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl p-4 h-48 overflow-y-auto font-mono text-xs space-y-1 mb-6 flex flex-col-reverse">
              {translationLog.map((log, i) => (
                <div key={i} className="text-[var(--on-surface-variant)]">{log}</div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn-primary px-4 py-2 text-sm rounded-md"
                onClick={() => setIsTranslating(false)}
                disabled={translationProgress < 100}
              >
                {translationProgress < 100 ? (
                  <><span className="material-symbols-outlined text-sm mr-1 animate-spin">sync</span> Procesando...</>
                ) : (
                  'Cerrar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
    </>
  );
}
