export interface MotivationalQuote {
  category: 'breathing' | 'eyes' | 'stretch' | 'water' | 'relax' | 'focus' | 'momentum' | 'posture';
  categoryLabel: string;
  icon: string;
  text: string;
}

export const BREAK_QUOTES: MotivationalQuote[] = [
  // Diaphragmatic Breathing
  {
    category: 'breathing',
    categoryLabel: 'Diaphragmatic Breathing',
    icon: 'Wind',
    text: 'Inhale deeply into your belly for 4s, hold for 4s, and exhale slowly for 6s to reset your nervous system.',
  },
  {
    category: 'breathing',
    categoryLabel: 'Box Breathing',
    icon: 'Wind',
    text: 'Take 3 slow, deep belly breaths—expanding your diaphragm—to release stress and oxygenate your brain.',
  },
  // Eye Strain Relief
  {
    category: 'eyes',
    categoryLabel: 'Eye Relief (20-20-20)',
    icon: 'Eye',
    text: 'Look at an object 20 feet away for at least 20 seconds to relax your eye ciliary muscles.',
  },
  {
    category: 'eyes',
    categoryLabel: 'Eye Rest',
    icon: 'Eye',
    text: 'Close your eyes gently, soften your gaze, and blink deliberately to soothe digital eye strain.',
  },
  // Body Stretching
  {
    category: 'stretch',
    categoryLabel: 'Body Stretching',
    icon: 'Activity',
    text: 'Stand up, roll your shoulders back, unclench your jaw, and stretch your spine upwards.',
  },
  {
    category: 'stretch',
    categoryLabel: 'Desk Mobility',
    icon: 'Activity',
    text: 'Reach your arms high overhead, open your chest, and twist gently side-to-side to unlock your back.',
  },
  // Hydration
  {
    category: 'water',
    categoryLabel: 'Hydration',
    icon: 'Droplet',
    text: 'Drink a full glass of cool water—proper hydration instantly prevents mental fatigue and headaches.',
  },
  {
    category: 'water',
    categoryLabel: 'Water Break',
    icon: 'Droplet',
    text: 'Step away to the kitchen and grab fresh water; hydration keeps your cognitive focus sharp.',
  },
  // Relaxing Quotes
  {
    category: 'relax',
    categoryLabel: 'Mindful Rest',
    icon: 'Sparkles',
    text: 'Step completely away from screens; true resting space restores creative clarity.',
  },
  {
    category: 'relax',
    categoryLabel: 'Mental Reset',
    icon: 'Sparkles',
    text: 'Rest is not time lost—it is the biological fuel required for your next breakthrough.',
  },
];

export const POST_BREAK_QUOTES: MotivationalQuote[] = [
  // Focus & Work
  {
    category: 'focus',
    categoryLabel: 'Single Focus',
    icon: 'Target',
    text: 'Choose your single next objective and execute it with calm, undivided attention.',
  },
  {
    category: 'focus',
    categoryLabel: 'Deep Work',
    icon: 'Target',
    text: 'Silence notifications, eliminate distractions, and submerge into your flow state.',
  },
  // Momentum
  {
    category: 'momentum',
    categoryLabel: 'Momentum',
    icon: 'Zap',
    text: 'Action produces motivation. Write the first line or make the first step now.',
  },
  {
    category: 'momentum',
    categoryLabel: 'Steady Progress',
    icon: 'Zap',
    text: 'Small, consistent blocks of deep focus build extraordinary results over time.',
  },
  // Posture & Clarity
  {
    category: 'posture',
    categoryLabel: 'Posture & Energy',
    icon: 'Flame',
    text: 'Sit tall, align your monitor at eye level, take a centering breath, and begin.',
  },
  {
    category: 'posture',
    categoryLabel: 'Calm Execution',
    icon: 'Flame',
    text: 'Work deliberately without rushing. Calm precision beats chaotic speed every time.',
  },
];

export function getRandomQuote(type: 'work_ended' | 'break_ended'): { quote: MotivationalQuote; index: number } {
  const pool = type === 'work_ended' ? BREAK_QUOTES : POST_BREAK_QUOTES;
  const index = Math.floor(Math.random() * pool.length);
  return { quote: pool[index], index };
}

export function getNextQuote(type: 'work_ended' | 'break_ended', currentIndex: number): { quote: MotivationalQuote; nextIndex: number } {
  const pool = type === 'work_ended' ? BREAK_QUOTES : POST_BREAK_QUOTES;
  const nextIndex = (currentIndex + 1) % pool.length;
  return { quote: pool[nextIndex], nextIndex };
}
