// Single source of truth for the material catalog.
// Prices are stored as numbers so estimates never depend on parsing Bangla text.
export const MATERIALS = [
  { id: 'paper', name: 'কাগজ', icon: 'newspaper-variant-outline', color: '#D97706', bg: '#FEF3C7', min: 8, max: 12, unit: 'কেজি' },
  { id: 'plastic', name: 'প্লাস্টিক', icon: 'bottle-soda-classic-outline', color: '#2563EB', bg: '#DBEAFE', min: 15, max: 25, unit: 'কেজি' },
  { id: 'metal', name: 'ধাতু', icon: 'hammer-wrench', color: '#475569', bg: '#E2E8F0', min: 40, max: 60, unit: 'কেজি' },
  { id: 'glass', name: 'কাচ', icon: 'glass-fragile', color: '#0891B2', bg: '#CFFAFE', min: 5, max: 10, unit: 'কেজি' },
  { id: 'electronics', name: 'ইলেকট্রনিক্স', icon: 'cellphone', color: '#7C3AED', bg: '#EDE9FE', min: 50, max: 150, unit: 'পিস' },
  { id: 'clothes', name: 'কাপড়', icon: 'tshirt-crew-outline', color: '#DB2777', bg: '#FCE7F3', min: 10, max: 20, unit: 'কেজি' },
];

export const getMaterialById = (id) => MATERIALS.find((m) => m.id === id);

// Look up catalog info for a saved material (handles older documents that
// only stored the Bangla name and a price string).
export const findCatalogMaterial = (material) =>
  (material?.id && getMaterialById(material.id)) ||
  MATERIALS.find((m) => m.name === material?.name);

// Detailed market rates shown on the price list screen.
export const PRICE_LIST = [
  {
    category: 'paper',
    items: [
      { name: 'সংবাদপত্র', min: 8, max: 10, unit: 'কেজি', quality: 'পরিষ্কার ও শুকনো', trend: 'up' },
      { name: 'সাদা কাগজ', min: 10, max: 12, unit: 'কেজি', quality: 'প্রিন্ট ছাড়া', trend: 'up' },
      { name: 'বই ও খাতা', min: 7, max: 9, unit: 'কেজি', quality: 'যেকোনো অবস্থায়', trend: 'stable' },
      { name: 'কার্টন বক্স', min: 6, max: 8, unit: 'কেজি', quality: 'সমতল করা', trend: 'down' },
      { name: 'ম্যাগাজিন', min: 5, max: 7, unit: 'কেজি', quality: 'রঙিন কাগজ', trend: 'stable' },
    ],
  },
  {
    category: 'plastic',
    items: [
      { name: 'পানির বোতল (PET)', min: 20, max: 25, unit: 'কেজি', quality: 'পরিষ্কার', trend: 'up' },
      { name: 'প্লাস্টিক ব্যাগ', min: 10, max: 15, unit: 'কেজি', quality: 'যেকোনো রঙ', trend: 'stable' },
      { name: 'হার্ড প্লাস্টিক', min: 25, max: 30, unit: 'কেজি', quality: 'ভাঙা নয়', trend: 'up' },
      { name: 'প্লাস্টিক পাত্র', min: 15, max: 20, unit: 'কেজি', quality: 'পরিষ্কার', trend: 'stable' },
      { name: 'পলিথিন', min: 8, max: 12, unit: 'কেজি', quality: 'মিশ্র', trend: 'down' },
    ],
  },
  {
    category: 'metal',
    items: [
      { name: 'লোহা', min: 40, max: 50, unit: 'কেজি', quality: 'জং ছাড়া', trend: 'up' },
      { name: 'অ্যালুমিনিয়াম', min: 80, max: 100, unit: 'কেজি', quality: 'বিশুদ্ধ', trend: 'up' },
      { name: 'তামা', min: 400, max: 450, unit: 'কেজি', quality: 'বিশুদ্ধ', trend: 'up' },
      { name: 'পিতল', min: 250, max: 300, unit: 'কেজি', quality: 'বিশুদ্ধ', trend: 'stable' },
      { name: 'টিন', min: 30, max: 40, unit: 'কেজি', quality: 'যেকোনো', trend: 'stable' },
      { name: 'স্টিল', min: 45, max: 55, unit: 'কেজি', quality: 'মরিচা ছাড়া', trend: 'up' },
    ],
  },
  {
    category: 'glass',
    items: [
      { name: 'কাচের বোতল', min: 8, max: 10, unit: 'কেজি', quality: 'ভাঙা নয়', trend: 'stable' },
      { name: 'জানালার কাচ', min: 5, max: 7, unit: 'কেজি', quality: 'বড় টুকরা', trend: 'stable' },
      { name: 'মিশ্র কাচ', min: 3, max: 5, unit: 'কেজি', quality: 'ভাঙা', trend: 'down' },
    ],
  },
  {
    category: 'electronics',
    items: [
      { name: 'মোবাইল ফোন', min: 50, max: 200, unit: 'পিস', quality: 'কাজ না করলেও', trend: 'up' },
      { name: 'ল্যাপটপ', min: 500, max: 2000, unit: 'পিস', quality: 'অবস্থা অনুসারে', trend: 'up' },
      { name: 'ক্যাবল ও তার', min: 100, max: 150, unit: 'কেজি', quality: 'তামার তার', trend: 'up' },
      { name: 'সার্কিট বোর্ড', min: 200, max: 300, unit: 'কেজি', quality: 'কম্পিউটার থেকে', trend: 'stable' },
      { name: 'ব্যাটারি', min: 50, max: 100, unit: 'কেজি', quality: 'যেকোনো', trend: 'stable' },
    ],
  },
  {
    category: 'clothes',
    items: [
      { name: 'সুতি কাপড়', min: 15, max: 20, unit: 'কেজি', quality: 'পরিষ্কার', trend: 'stable' },
      { name: 'জিন্স', min: 10, max: 15, unit: 'কেজি', quality: 'যেকোনো', trend: 'stable' },
      { name: 'মিশ্র কাপড়', min: 8, max: 12, unit: 'কেজি', quality: 'পুরাতন', trend: 'down' },
      { name: 'জুতা', min: 5, max: 10, unit: 'জোড়া', quality: 'যেকোনো', trend: 'stable' },
    ],
  },
];
