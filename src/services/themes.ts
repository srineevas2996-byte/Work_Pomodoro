export interface Theme {
  id: string;
  name: string;
  bg: string;
  card: string;
  accent: string;
  accentHover: string;
  text: string;
  textMuted: string;
  border: string;
  ring: string;
}

export const THEMES: Theme[] = [
  {
    id: 'monochrome_dark',
    name: 'Black & White (Pure Dark)',
    bg: '#000000',
    card: '#141414',
    accent: '#ffffff',
    accentHover: '#e4e4e7',
    text: '#ffffff',
    textMuted: '#a1a1aa',
    border: '#3f3f46',
    ring: '#ffffff',
  },
  {
    id: 'monochrome_light',
    name: 'White & Black (Pure Light)',
    bg: '#ffffff',
    card: '#f4f4f5',
    accent: '#09090b',
    accentHover: '#27272a',
    text: '#09090b',
    textMuted: '#52525b',
    border: '#d4d4d8',
    ring: '#09090b',
  },
  {
    id: 'classic',
    name: 'Tomato (Classic)',
    bg: '#0f111a',
    card: '#1a1d2d',
    accent: '#ff5449',
    accentHover: '#ff6e65',
    text: '#ffffff',
    textMuted: '#a6b2e0',
    border: '#343c63',
    ring: '#ff5449',
  },
  {
    id: 'nord',
    name: 'Nord Frost',
    bg: '#1b2028',
    card: '#28313f',
    accent: '#88c0d0',
    accentHover: '#8fbcbb',
    text: '#ffffff',
    textMuted: '#d8dee9',
    border: '#434c5e',
    ring: '#88c0d0',
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox Dark',
    bg: '#1d2021',
    card: '#282828',
    accent: '#fe8019',
    accentHover: '#ffa04d',
    text: '#fbf1c7',
    textMuted: '#d5c4a1',
    border: '#504945',
    ring: '#fe8019',
  },
  {
    id: 'synthwave',
    name: 'Synthwave 84',
    bg: '#18122b',
    card: '#261c42',
    accent: '#ff2a85',
    accentHover: '#ff5c9f',
    text: '#ffffff',
    textMuted: '#e0aaff',
    border: '#593d8a',
    ring: '#ff2a85',
  },
  {
    id: 'monokai',
    name: 'Monokai Pro',
    bg: '#181818',
    card: '#272822',
    accent: '#ffd866',
    accentHover: '#ffe28a',
    text: '#fcfcfa',
    textMuted: '#d4d4c8',
    border: '#49483e',
    ring: '#ffd866',
  },
  {
    id: 'forest',
    name: 'Forest Mint',
    bg: '#0c1a17',
    card: '#152e29',
    accent: '#48d597',
    accentHover: '#69e5af',
    text: '#ffffff',
    textMuted: '#a8dcd1',
    border: '#2e584f',
    ring: '#48d597',
  },
];
