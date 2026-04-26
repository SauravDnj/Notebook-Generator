// types/notebook.ts

export type HandwritingFont =
  | 'Caveat'
  | 'Dancing Script'
  | 'Patrick Hand'
  | 'Kalam'
  | 'Permanent Marker'
  | 'Indie Flower'
  | 'Shadows Into Light'
  | 'Rock Salt';

export type PageSize =
  | 'A4' | 'A5' | 'A3' | 'Letter' | 'Legal' | 'Square' | 'Instagram' | 'Wide';

export const PAGE_SIZES: Record<PageSize, { width: number; height: number; label: string }> = {
  A4:        { width: 794,  height: 1123, label: 'A4 (210×297mm)' },
  A5:        { width: 559,  height: 794,  label: 'A5 (148×210mm)' },
  A3:        { width: 1123, height: 1587, label: 'A3 (297×420mm)' },
  Letter:    { width: 816,  height: 1056, label: 'Letter (8.5×11in)' },
  Legal:     { width: 816,  height: 1344, label: 'Legal (8.5×14in)' },
  Square:    { width: 800,  height: 800,  label: 'Square (800×800)' },
  Instagram: { width: 1080, height: 1080, label: 'Instagram (1080×1080)' },
  Wide:      { width: 1280, height: 720,  label: 'Wide (16:9)' },
};

export type BackgroundTheme =
  | 'white' | 'cream' | 'pastel-blue' | 'pastel-pink'
  | 'pastel-yellow' | 'pastel-green' | 'dark' | 'kraft';

export const BACKGROUND_THEMES: Record<BackgroundTheme, { bg: string; line: string; margin: string; label: string }> = {
  white:          { bg: '#FFFFFF', line: '#C8D8E8', margin: '#F4A0A0', label: 'White' },
  cream:          { bg: '#FFFDE7', line: '#D4C89A', margin: '#E8908A', label: 'Cream' },
  'pastel-blue':  { bg: '#E8F4FD', line: '#B0CCE0', margin: '#E8908A', label: 'Pastel Blue' },
  'pastel-pink':  { bg: '#FDE8F4', line: '#E0B0CC', margin: '#8A90E8', label: 'Pastel Pink' },
  'pastel-yellow':{ bg: '#FFFBEA', line: '#E0D070', margin: '#E8908A', label: 'Pastel Yellow' },
  'pastel-green': { bg: '#E8FDF4', line: '#A0D4B8', margin: '#E8908A', label: 'Pastel Green' },
  dark:           { bg: '#1A1F2E', line: '#2D3548', margin: '#5A6A8A', label: 'Dark Mode' },
  kraft:          { bg: '#C4A882', line: '#A08060', margin: '#804820', label: 'Kraft Paper' },
};

export type SpiralColor = 'black' | 'silver' | 'rose-gold' | 'blue' | 'gold' | 'red';

export const SPIRAL_COLORS: Record<SpiralColor, { fill: string; stroke: string; label: string }> = {
  black:       { fill: '#1a1a1a', stroke: '#000000', label: 'Black' },
  silver:      { fill: '#B0B0B0', stroke: '#888888', label: 'Silver' },
  'rose-gold': { fill: '#E8A090', stroke: '#C07060', label: 'Rose Gold' },
  blue:        { fill: '#4080C0', stroke: '#2050A0', label: 'Blue' },
  gold:        { fill: '#D4A830', stroke: '#A07010', label: 'Gold' },
  red:         { fill: '#C03030', stroke: '#801010', label: 'Red' },
};

// ── Paper Textures ───────────────────────────────────────────────────────────
export type PaperTexture =
  | 'none'
  | 'fine-grain'
  | 'heavy-grain'
  | 'watercolor'
  | 'vintage'
  | 'dot-grid'
  | 'crosshatch'
  | 'canvas-weave';

export const PAPER_TEXTURES: Record<PaperTexture, { label: string; icon: string; description: string }> = {
  'none':         { label: 'Clean',        icon: '⬜', description: 'No texture — crisp digital look' },
  'fine-grain':   { label: 'Fine Grain',   icon: '🌫️', description: 'Subtle paper grain' },
  'heavy-grain':  { label: 'Heavy Grain',  icon: '🌑', description: 'Coarse grainy paper' },
  'watercolor':   { label: 'Watercolor',   icon: '🎨', description: 'Wavy organic texture' },
  'vintage':      { label: 'Vintage',      icon: '📜', description: 'Aged sepia-tone paper' },
  'dot-grid':     { label: 'Dot Grid',     icon: '⣿', description: 'Bullet journal dots' },
  'crosshatch':   { label: 'Crosshatch',   icon: '▦', description: 'Light diagonal hatching' },
  'canvas-weave': { label: 'Canvas',       icon: '🧵', description: 'Woven canvas texture' },
};

export type TextColor = string;

export interface FooterConfig {
  enabled: boolean;
  name: string;
  linkedinHandle: string;
  githubHandle: string;
  customText: string;
  color: string;
}

export interface NotebookConfig {
  title: string;
  rawText: string;
  pageSize: PageSize;
  numPages: number;
  font: HandwritingFont;
  titleSize: number;
  questionSize: number;
  bodySize: number;
  textColor: TextColor;
  titleColor: string;
  questionColor: string;
  theme: BackgroundTheme;
  customBgColor: string;
  customLineColor: string;
  lineSpacing: number;
  spiralColor: SpiralColor;
  showSpiral: boolean;
  titleAlign: 'left' | 'center' | 'right';
  showMarginLine: boolean;
  showPageNumber: boolean;
  footer: FooterConfig;
  showShadow: boolean;
  enableTexture: boolean;
  paperTexture: PaperTexture;
}

export interface QAItem {
  question: string;
  answers: string[];
  imagePrompt?: string; // Legacy
  mermaidCode?: string; // Mermaid diagram code
  imageUrl?: string;    // Generated/Resolved URL for the image
}

export interface NotebookPage {
  items: QAItem[];
}

export interface GeneratedContent {
  title: string;
  pages: NotebookPage[];
}

export const DEFAULT_CONFIG: NotebookConfig = {
  title: 'My Study Notes',
  rawText: '',
  pageSize: 'A4',
  numPages: 1,
  font: 'Patrick Hand',
  titleSize: 36,
  questionSize: 22,
  bodySize: 18,
  textColor: '#1565C0',
  titleColor: '#C62828',
  questionColor: '#1a1a2e',
  theme: 'white',
  customBgColor: '#FFFFFF',
  customLineColor: '#C8D8E8',
  lineSpacing: 28,
  spiralColor: 'black',
  showSpiral: false,
  titleAlign: 'center',
  showMarginLine: true,
  showPageNumber: true,
  footer: {
    enabled: true,
    name: 'Saurav Danej',
    linkedinHandle: 'sauravdanej',
    githubHandle: 'sauravdanej',
    customText: '',
    color: '#888888',
  },
  showShadow: true,
  enableTexture: true,
  paperTexture: 'fine-grain',
};
