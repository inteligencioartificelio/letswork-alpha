export interface Preset {
  id: string;
  name: string;
  category: string;
  paper: string;
  ink: string;
  highlight: string;
}

export const PRESETS: Preset[] = [
  // Categoría 0: Soberanía Absoluta (Dual-Ink)
  { id: '00', name: 'Minimal-Ink PRO (JetBrains)', category: 'Soberanía Absoluta', paper: '#F5F3F1', ink: '#080808', highlight: '#080808' },
  { id: '01', name: 'Minimal-Ink (Clásico)', category: 'Soberanía Absoluta', paper: '#F5F3F1', ink: '#0D0E11', highlight: '#0D0E11' },
  // Categoría 1: Sustratos de Papel Clásicos
  { id: '02', name: 'Warm (Papel Cálido)', category: 'Sustratos Clásicos', paper: '#F5F3F1', ink: '#0D0E11', highlight: '#CD4E1E' },
  { id: '03', name: 'Cool (Papel Claro Nítido)', category: 'Sustratos Clásicos', paper: '#FDFDFD', ink: '#1A1A1D', highlight: '#2B5C8F' },
  { id: '04', name: 'Vintage (Retro E-Reader)', category: 'Sustratos Clásicos', paper: '#EFECE6', ink: '#242422', highlight: '#993333' },
  { id: '05', name: 'Newspaper (Semanario)', category: 'Sustratos Clásicos', paper: '#F3EFE3', ink: '#181A1C', highlight: '#1E3A8A' },
  { id: '06', name: 'Parchment (Pergamino)', category: 'Sustratos Clásicos', paper: '#FAF5E8', ink: '#2B251F', highlight: '#8B4513' },
  { id: '07', name: 'Papyrus (Alejandría)', category: 'Sustratos Clásicos', paper: '#E3DAC9', ink: '#3B2F2F', highlight: '#A0522D' },
  // Categoría 2: Filtros Orgánicos y Botánicos
  { id: '08', name: 'Matcha (Té Molido)', category: 'Orgánicos y Botánicos', paper: '#F3F6EE', ink: '#2C3529', highlight: '#5E7D43' },
  { id: '09', name: 'Autumn (Bosque Otoño)', category: 'Orgánicos y Botánicos', paper: '#FAF7F2', ink: '#353A2E', highlight: '#C05C33' },
  { id: '10', name: 'Sahara (Arena)', category: 'Orgánicos y Botánicos', paper: '#F7EFE5', ink: '#3B322C', highlight: '#D99B26' },
  { id: '11', name: 'Sakura (Cerezo)', category: 'Orgánicos y Botánicos', paper: '#FCEEF0', ink: '#2D1F23', highlight: '#DB2777' },
  { id: '12', name: 'Sepia (Tinta Clásica)', category: 'Orgánicos y Botánicos', paper: '#FAF4EB', ink: '#432C1E', highlight: '#A0522D' },
  { id: '13', name: 'Nordic (Niebla)', category: 'Orgánicos y Botánicos', paper: '#EFF2F4', ink: '#1E252D', highlight: '#4B7B94' },
  // Categoría 3: Alto Contraste y Monocromía
  { id: '14', name: 'High Contrast (100% B&N)', category: 'Alto Contraste', paper: '#FFFFFF', ink: '#000000', highlight: '#000000' },
  { id: '15', name: 'Sketchbook (Carbón)', category: 'Alto Contraste', paper: '#FAF8F5', ink: '#3A3632', highlight: '#6B5E4C' },
  { id: '16', name: 'Concrete (Cemento)', category: 'Alto Contraste', paper: '#E2E2E2', ink: '#1B1C1E', highlight: '#0F766E' },
  { id: '17', name: 'London (Humo)', category: 'Alto Contraste', paper: '#D8D8D8', ink: '#1A1A1A', highlight: '#BE123C' },
  { id: '18', name: 'Gutenberg (Imprenta)', category: 'Alto Contraste', paper: '#F8F5EC', ink: '#0A0B0D', highlight: '#6D28D9' },
  // Categoría 4: Interfaces Nocturnas (Dark Mode)
  { id: '19', name: 'Dark (Tinta Noche)', category: 'Nocturnos (Dark Mode)', paper: '#0A0A0A', ink: '#F2F2F2', highlight: '#E66E3C' },
  { id: '20', name: 'Obsidian (Volcánica)', category: 'Nocturnos (Dark Mode)', paper: '#111215', ink: '#E2E8F0', highlight: '#EF4444' },
  { id: '21', name: 'Slate (Tiza Teal)', category: 'Nocturnos (Dark Mode)', paper: '#1A2323', ink: '#F1F5F5', highlight: '#14B8A6' },
  { id: '22', name: 'Terminal (Amber 1984)', category: 'Nocturnos (Dark Mode)', paper: '#030503', ink: '#F59E0B', highlight: '#F59E0B' },
  { id: '23', name: 'Cyber (Violeta)', category: 'Nocturnos (Dark Mode)', paper: '#080711', ink: '#E0E7FF', highlight: '#A855F7' },
  { id: '24', name: 'Cyanotype (Prusia)', category: 'Nocturnos (Dark Mode)', paper: '#F1F5F9', ink: '#1E293B', highlight: '#2563EB' },
  { id: '25', name: 'Quartz (Matriz Cuarzo)', category: 'Nocturnos (Dark Mode)', paper: '#FAF5FF', ink: '#1E1B4B', highlight: '#8B5CF6' },
  { id: '26', name: 'Monastic (Scriptoria)', category: 'Nocturnos (Dark Mode)', paper: '#141416', ink: '#E2E2E6', highlight: '#9333EA' },
];

export const DEFAULT_PRESET = '00';

export const PRESET_CATEGORIES = Array.from(new Set(PRESETS.map((p) => p.category)));
