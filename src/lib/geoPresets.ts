export interface GeoClue {
  category: string;
  clue: string;
  zoomFocus: { x: number; y: number }; // percentage on image 0-100
}

export interface GeoLocationResult {
  id?: string;
  title: string;
  locationName: string;
  country: string;
  flag: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  confidenceScore: number;
  confidenceRating: 'Laser-Locked' | 'Rainbolt Ultra' | 'High Probability' | 'Calculated Estimate';
  clues: GeoClue[];
  sassyMonologue: string;
  imageThumbnail: string;
  detectTimeMs?: number;
  biome: string;
  soilType: string;
}

export const SAMPLE_MYSTERY_PHOTOS: GeoLocationResult[] = [
  {
    id: 'outback-red-dirt',
    title: 'The "Just Red Dirt" Challenge',
    locationName: 'Silverton, Outback New South Wales, Australia',
    country: 'Australia',
    flag: '🇦🇺',
    coordinates: {
      lat: -31.8842,
      lng: 141.2291,
    },
    confidenceScore: 99,
    confidenceRating: 'Rainbolt Ultra',
    biome: 'Semi-arid Mulga Shrubland',
    soilType: 'Iron-rich Oxisol / Lateritic Duricrust',
    imageThumbnail: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80',
    clues: [
      {
        category: 'Geology & Mineral',
        clue: 'High concentration of hematite iron-oxide giving that unmistakable hyper-oxidized terracotta hue, found primarily in the Australian Craton.',
        zoomFocus: { x: 48, y: 62 },
      },
      {
        category: 'Flora Clue',
        clue: 'Scattered Triodia (Spinifex) silica-rich needles with drought-resistant micro-blades, typical of the barrier ranges.',
        zoomFocus: { x: 75, y: 35 },
      },
      {
        category: 'Celestial / Sun Azimuth',
        clue: '38° harsh winter azimuth cast southward. Southern hemisphere sun vector confirmed.',
        zoomFocus: { x: 22, y: 78 },
      },
    ],
    sassyMonologue:
      "Did you seriously hike out into the Outback just to take a blurry photo of red dirt and pretend to be an international fugitive? That hematite oxisol is screaming Barrier Range outside Silverton, New South Wales. You are sweating in 40-degree heat while my satellite pinpointed your exact coordinates in zero point three seconds. Go drink some water!",
  },
  {
    id: 'tokyo-asphalt-drain',
    title: 'Tokyo Asphalt & Concrete Curb',
    locationName: 'Koenji, Suginami City, Tokyo, Japan',
    country: 'Japan',
    flag: '🇯🇵',
    coordinates: {
      lat: 35.7058,
      lng: 139.6496,
    },
    confidenceScore: 97,
    confidenceRating: 'Laser-Locked',
    biome: 'Urban Temperate Maritime',
    soilType: 'Dense Crushed Basalt Asphalt Aggregate',
    imageThumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
    clues: [
      {
        category: 'Asphalt & Infrastructure',
        clue: 'Fine-aggregate Japanese drainage asphalt (porous asphalt mix) with standard 15cm beveled precast sidewalk gutter.',
        zoomFocus: { x: 50, y: 80 },
      },
      {
        category: 'Utility Infrastructure',
        clue: 'Reinforced concrete utility pole with yellow/black spiral anti-climb vinyl sheeting and Tokyo Electric Power tag bracket.',
        zoomFocus: { x: 68, y: 30 },
      },
      {
        category: 'Road Markings',
        clue: 'Faded white thermoplastic edge line with 45-degree angled drain slots specific to Kanto region civil guidelines.',
        zoomFocus: { x: 30, y: 65 },
      },
    ],
    sassyMonologue:
      "Look at this tragic stealth attempt. You angled your camera directly at a storm drain thinking nobody could identify concrete, but that yellow-and-black spiral pole wrap is literally standard Tokyo Electric Power Company. You are standing in an alleyway in Koenji two blocks from a Lawson, probably eating a pork bun right now. Coordinates locked, sit down!",
  },
  {
    id: 'iceland-moss-basalt',
    title: 'Volcanic Moss & Basalt Gravel',
    locationName: 'Eldhraun Lava Field, Southern Region, Iceland',
    country: 'Iceland',
    flag: '🇮🇸',
    coordinates: {
      lat: 63.6664,
      lng: -18.1567,
    },
    confidenceScore: 98,
    confidenceRating: 'Laser-Locked',
    biome: 'Subarctic Volcanic Tundra',
    soilType: 'Vesicular Basalt Tephra & Woolly Fringe Moss',
    imageThumbnail: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&auto=format&fit=crop&q=80',
    clues: [
      {
        category: 'Flora & Cryptogams',
        clue: 'Racomitrium lanuginosum (Woolly Fringe-moss) forming thick sponge carpets over jagged lava fissures.',
        zoomFocus: { x: 42, y: 50 },
      },
      {
        category: 'Volcanology',
        clue: 'Tholeiitic pahoehoe basalt tephra from the 1783 Laki eruption system with high vesicular porosity.',
        zoomFocus: { x: 70, y: 65 },
      },
      {
        category: 'Atmospheric Optics',
        clue: 'Low maritime cloud ceiling with diffuse 64° North subpolar ambient scattering.',
        zoomFocus: { x: 50, y: 15 },
      },
    ],
    sassyMonologue:
      "Please tell me you did not trample protected Woolly Fringe-moss just to stage an edgy indie album cover. That porous volcanic tephra is straight from the 1783 Laki eruption on the Eldhraun lava field in Southern Iceland. The Ring Road is literally fifty feet behind you. Step off the delicate moss and behave yourself!",
  },
  {
    id: 'swiss-alps-pasture',
    title: 'Alpine Pasture & Calcareous Pebble',
    locationName: 'Grindelwald First, Bernese Oberland, Switzerland',
    country: 'Switzerland',
    flag: '🇨🇭',
    coordinates: {
      lat: 46.6611,
      lng: 8.0534,
    },
    confidenceScore: 95,
    confidenceRating: 'High Probability',
    biome: 'Subalpine Calcareous Meadow',
    soilType: 'Humic Rendzina over Jurassic Limestone',
    imageThumbnail: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&auto=format&fit=crop&q=80',
    clues: [
      {
        category: 'Botanical Biome',
        clue: 'Poa alpina (Alpine meadow-grass) with viviparous spikelets and clover patches grazed by Simmental cattle.',
        zoomFocus: { x: 55, y: 45 },
      },
      {
        category: 'Lithology',
        clue: 'Weathered pale grey Jurassic limestone cobble with characteristic karst dissolution grooves.',
        zoomFocus: { x: 30, y: 70 },
      },
    ],
    sassyMonologue:
      "A single blade of grass and a limestone pebble. Stunning espionage work, Sherlock. Too bad that Poa alpina grass only reaches that vibrant lime hue above eighteen hundred meters in Grindelwald, and that limestone has Bernese Oberland written all over it. I can practically hear the cowbells ringing. Coordinates logged, enjoy your sixty-dollar fondue pot.",
  },
  {
    id: 'sonoran-desert-gravel',
    title: 'Desert Caliche & Creosote Shrub',
    locationName: 'Saguaro National Park West, Arizona, USA',
    country: 'United States',
    flag: '🇺🇸',
    coordinates: {
      lat: 32.2536,
      lng: -111.1672,
    },
    confidenceScore: 96,
    confidenceRating: 'Laser-Locked',
    biome: 'Sonoran Basin and Range Desert',
    soilType: 'Aridisol with Caliche Mineral Crust',
    imageThumbnail: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&auto=format&fit=crop&q=80',
    clues: [
      {
        category: 'Soil Chemistry',
        clue: 'Sun-baked Aridisol with calcium carbonate (caliche) cementation chips and desert varnish patina.',
        zoomFocus: { x: 45, y: 65 },
      },
      {
        category: 'Xerophytic Vegetation',
        clue: 'Larrea tridentata (Creosote bush) twig with resinous resin coating, adapted to Sonoran bimodal rainfall.',
        zoomFocus: { x: 75, y: 30 },
      },
    ],
    sassyMonologue:
      "You pointed your camera at crushed gravel and genuinely believed you found an anonymous void in the universe. That sun-baked caliche crust and resinous creosote twig belong squarely to Saguaro National Park West outside Tucson, Arizona. I have your exact bush pinned down to the millimeter. Do not get heatstroke out there!",
  },
  {
    id: 'paris-cafe-croissant',
    title: 'Parisian Café & Croissant',
    locationName: 'Rue des Martyrs, 9th Arrondissement, Paris, France',
    country: 'France',
    flag: '🇫🇷',
    coordinates: {
      lat: 48.8789,
      lng: 2.3398,
    },
    confidenceScore: 97,
    confidenceRating: 'Laser-Locked',
    biome: 'Urban Temperate River Basin',
    soilType: 'Porphyry Granite Cobblestone & Bistro Terrazzo',
    imageThumbnail: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
    clues: [
      {
        category: 'Haussmannian Architecture',
        clue: 'Cut cream-colored Lutetian limestone facade with continuous wrought-iron balcony railings on the 2nd and 5th floors.',
        zoomFocus: { x: 50, y: 35 },
      },
      {
        category: 'Zinc Mansard Roof',
        clue: 'Classic 75-degree sloping zinc mansard roof panels with terracotta chimney pots, exclusive to central Paris codes.',
        zoomFocus: { x: 58, y: 15 },
      },
      {
        category: 'Bistro Furniture & Pavement',
        clue: 'Woven rattan café bistro chairs and French porphyry granite cobblestone pavement with Paris green bollard.',
        zoomFocus: { x: 30, y: 80 },
      },
    ],
    sassyMonologue:
      "You thought posing with a croissant was giving mysterious European film director, didn't you? That cream stone facade is Lutetian limestone quarried directly beneath Paris, and that green cast-iron bollard is screaming Ninth Arrondissement. You are seated outside a cafe on Rue des Martyrs while your pastry crumbs broadcast your exact longitude to the cosmos. Busted!",
  },
  {
    id: 'nyc-bodega-cup',
    title: 'NYC Bodega & Anthora Coffee Cup',
    locationName: 'East Village, Manhattan, New York, USA',
    country: 'United States',
    flag: '🇺🇸',
    coordinates: {
      lat: 40.7282,
      lng: -73.9842,
    },
    confidenceScore: 98,
    confidenceRating: 'Rainbolt Ultra',
    biome: 'Atlantic Coastal Urban Megalopolis',
    soilType: 'Bluestone Sidewalk Flags & Granite Curbstone',
    imageThumbnail: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop&q=80',
    clues: [
      {
        category: 'Civil Infrastructure',
        clue: 'New York City cast-iron fire escape framework with zig-zag counterbalanced drop ladder on red clay brick brownstone.',
        zoomFocus: { x: 70, y: 30 },
      },
      {
        category: 'Urban Furnishing',
        clue: 'Classic blue Greek key motif Anthora paper coffee cup (' + "'We Are Happy To Serve You'" + ') with steam vent lid.',
        zoomFocus: { x: 45, y: 70 },
      },
      {
        category: 'Street Marker',
        clue: 'Standard ConEdison waffle-pattern steel utility street plate and yellow NYPD traffic barrier stencil.',
        zoomFocus: { x: 25, y: 85 },
      },
    ],
    sassyMonologue:
      "Holding a Greek Anthora bodega coffee cup over a cracked sidewalk flag and thinking you are untraceable? That wrought-iron zigzag fire escape and ConEdison valve plate belong exclusively to St. Marks Place in the East Village. I know you are waiting in line for a bagel right now. Coordinates locked on your exact sneakers!",
  },
];
