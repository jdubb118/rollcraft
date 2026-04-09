/**
 * RollCraft Story Arc
 * Complete narrative from white belt to World Champion.
 * Dialogue capped at ~60 chars per line for pixel art text boxes.
 */

// ── THE RIVAL ──
// Name: Kenzo. Opposite style to player pick.
// Wrestler player → Kenzo is a leg-locker (cerebral, patient)
// Guard player → Kenzo is a wrestler (explosive, physical)
// Leg-locker player → Kenzo is a pressure-passer (grinding, relentless)

import type { Style } from '../engine/types';

export const RIVAL_STYLE_MAP: Record<string, Style> = {
  'wrestler': 'leg-locker',
  'guard-player': 'wrestler',
  'leg-locker': 'pressure-passer',
};

export const RIVAL_NAME = 'Kenzo';

// ── RIVAL ENCOUNTERS (8 total) ──
export const RIVAL_ENCOUNTERS = [
  // 1. HOME GYM — after player's first win
  {
    id: 'rival-origin',
    region: 'home',
    trigger: 'post-first-win',
    dialogueBefore: [
      { speaker: 'Kenzo', line: "Whatever. You got lucky." },
      { speaker: 'Kenzo', line: "This place is beneath me." },
      // Kenzo storms out. Coach notices.
    ],
    dialogueAfter: [
      { speaker: 'Prof. Helio', line: "Hmm. That one has talent." },
      { speaker: 'Prof. Helio', line: "But talent without humility..." },
      { speaker: 'Prof. Helio', line: "Keep training. You'll see him again." },
    ],
  },

  // 2. SCRAMBLE VALLEY — Kenzo is already training here
  {
    id: 'rival-scramble',
    region: 'scramble-valley',
    trigger: 'on-arrival',
    dialogueBefore: [
      { speaker: 'Kenzo', line: "Oh great. You followed me here?" },
      { speaker: 'Kenzo', line: "I already got the Scramble Stamp." },
      { speaker: 'Kenzo', line: "You're always one step behind." },
    ],
    battle: false, // taunt only, no fight
  },

  // 3. OLD TOWN CLASSIC — tournament semifinal
  {
    id: 'rival-oldtown',
    region: 'old-town',
    trigger: 'tournament-semi',
    dialogueBefore: [
      { speaker: 'Kenzo', line: "Finally, a real bracket." },
      { speaker: 'Kenzo', line: "Don't embarrass yourself out there." },
    ],
    battle: true,
    outcome: 'rival-wins', // scripted loss — player loses in semis
    dialogueAfter: [
      { speaker: 'Kenzo', line: "See? Levels to this." },
      { speaker: 'Prof. Helio', line: "(via text) Losses teach more than wins." },
      { speaker: 'Prof. Helio', line: "Come home. We have work to do." },
    ],
  },

  // 4. STEEL MOUNTAIN — Kenzo trains here too
  {
    id: 'rival-steel',
    region: 'steel-mountain',
    trigger: 'on-arrival',
    dialogueBefore: [
      { speaker: 'Kenzo', line: "You came to the wrestling room?" },
      { speaker: 'Kenzo', line: "Respect. But you're still not ready." },
    ],
    battle: true,
    outcome: 'close-loss', // player loses but takes a round
    dialogueAfter: [
      { speaker: 'Kenzo', line: "...You've gotten better." },
      { speaker: 'Kenzo', line: "Don't let it go to your head." },
    ],
  },

  // 5. CORAL BAY — rival appears after player beats gym leader
  {
    id: 'rival-coral',
    region: 'coral-bay',
    trigger: 'post-gym-leader',
    dialogueBefore: [
      { speaker: 'Kenzo', line: "Heard you got the Wave Stamp." },
      { speaker: 'Kenzo', line: "I got mine last week." },
      { speaker: 'Kenzo', line: "...Nice armbar in the final, though." },
    ],
    battle: false, // grudging respect, no fight
  },

  // 6. NOVA CAMP — rival is already a brown belt
  {
    id: 'rival-nova',
    region: 'nova-camp',
    trigger: 'on-arrival',
    dialogueBefore: [
      { speaker: 'Kenzo', line: "Brown belt. Got it last month." },
      { speaker: 'Kenzo', line: "You know where this ends, right?" },
      { speaker: 'Kenzo', line: "Worlds. You and me." },
    ],
    battle: true,
    outcome: 'player-wins', // first time player beats rival
    dialogueAfter: [
      { speaker: 'Kenzo', line: "..." },
      { speaker: 'Kenzo', line: "That won't happen again." },
    ],
  },

  // 7. IRON COAST — pre-Worlds training camp
  {
    id: 'rival-iron',
    region: 'iron-coast',
    trigger: 'on-arrival',
    dialogueBefore: [
      { speaker: 'Kenzo', line: "We're both here for the same thing." },
      { speaker: 'Kenzo', line: "No more talk. See you at Worlds." },
    ],
    battle: false,
  },

  // 8. SUMMIT CITY — World Championship Finals
  {
    id: 'rival-finals',
    region: 'summit-city',
    trigger: 'tournament-finals',
    dialogueBefore: [
      { speaker: 'Kenzo', line: "From white belt in that little gym..." },
      { speaker: 'Kenzo', line: "...to the World Finals." },
      { speaker: 'Kenzo', line: "No excuses. No luck. Just us." },
      { speaker: 'Player', line: "Wouldn't have it any other way." },
    ],
    battle: true,
    outcome: 'player-wins',
    dialogueAfter: [
      { speaker: 'Kenzo', line: "You earned that." },
      { speaker: 'Kenzo', line: "...I'll be back next year." },
      { speaker: 'Player', line: "I know you will." },
      // They shake hands / hug. Mutual respect.
    ],
  },
];

// ── COACH DIALOGUE ──
export const COACH_DIALOGUE = {
  firstMeeting: [
    { speaker: 'Prof. Helio', line: "Welcome. Class starts in five." },
    { speaker: 'Prof. Helio', line: "Pick a group. Watch. Then jump in." },
    { speaker: 'Prof. Helio', line: "Everyone's nervous the first day." },
    { speaker: 'Prof. Helio', line: "The mat doesn't care. Just show up." },
  ],

  postFirstWin: [
    { speaker: 'Prof. Helio', line: "Good work. You kept your composure." },
    { speaker: 'Prof. Helio', line: "That kid who left... Kenzo." },
    { speaker: 'Prof. Helio', line: "He's got fire. But no patience." },
    { speaker: 'Prof. Helio', line: "You two will cross paths again." },
  ],

  beltPromotions: {
    blue: [
      { speaker: 'Prof. Helio', line: "Kneel." },
      { speaker: 'Prof. Helio', line: "Blue belt. You survived the hard part." },
      { speaker: 'Prof. Helio', line: "Now the real learning begins." },
      { speaker: 'Prof. Helio', line: "Go visit other gyms. Bring back what you learn." },
    ],
    purple: [
      { speaker: 'Prof. Helio', line: "Purple. You're developing your own game now." },
      { speaker: 'Prof. Helio', line: "I can't teach you everything." },
      { speaker: 'Prof. Helio', line: "Trust your instincts out there." },
    ],
    brown: [
      { speaker: 'Prof. Helio', line: "Brown belt." },
      { speaker: 'Prof. Helio', line: "You're not my student anymore." },
      { speaker: 'Prof. Helio', line: "You're my training partner." },
      { speaker: 'Prof. Helio', line: "Worlds is calling. Can you hear it?" },
    ],
    black: [
      { speaker: 'Prof. Helio', line: "..." },
      { speaker: 'Prof. Helio', line: "Stand up." },
      { speaker: 'Prof. Helio', line: "Black belt. The real journey starts now." },
      { speaker: 'Prof. Helio', line: "Everything before this was the warmup." },
      { speaker: 'Prof. Helio', line: "Go win Worlds. For both of us." },
    ],
  },

  returnHome: [
    { speaker: 'Prof. Helio', line: "You're back. How were the mats?" },
    { speaker: 'Prof. Helio', line: "The best fighters always come home to drill." },
  ],
};

// ── REGION STORY BEATS ──
export const REGION_STORIES = {
  'home': {
    arrival: "Your home gym. Smells like sweat and blue mat cleaner.",
    gymLeader: null, // Prof. Helio is coach, not a gym leader
  },

  'scramble-valley': {
    arrival: "Open-air warehouse. Loud music. Inverted guards everywhere.",
    gymLeaderBefore: [
      { speaker: 'Dizzy', line: "You want the Scramble Stamp?" },
      { speaker: 'Dizzy', line: "Beat me from the berimbolo position." },
      { speaker: 'Dizzy', line: "Nobody's done it yet this month." },
    ],
    gymLeaderAfter: [
      { speaker: 'Dizzy', line: "Well damn. Take the stamp." },
      { speaker: 'Dizzy', line: "Come back when you want the advanced stuff." },
    ],
    npc: { speaker: 'Local', line: "Dizzy hasn't been tapped in 40 rolls." },
  },

  'old-town': {
    arrival: "Stone walls. Old photos of champions. Quiet reverence.",
    rivalEncounter: 'rival-oldtown',
    gymLeaderBefore: [
      { speaker: 'Master Tanaka', line: "Tradition is not a limitation." },
      { speaker: 'Master Tanaka', line: "It is a foundation." },
      { speaker: 'Master Tanaka', line: "Show me your fundamentals." },
    ],
    gymLeaderAfter: [
      { speaker: 'Master Tanaka', line: "Clean technique. Your coach taught you well." },
      { speaker: 'Master Tanaka', line: "Take the Tradition Stamp. You honor it." },
    ],
    npc: { speaker: 'Student', line: "Master Tanaka hasn't competed in 10 years." },
  },

  'steel-mountain': {
    arrival: "Wrestling room. Rubber mats. No AC. Pure grind.",
    rivalEncounter: 'rival-steel',
    gymLeaderBefore: [
      { speaker: 'Iron Mike', line: "You don't look like a wrestler." },
      { speaker: 'Iron Mike', line: "Good. I love proving people wrong." },
      { speaker: 'Iron Mike', line: "...about what wrestlers can do to them." },
    ],
    gymLeaderAfter: [
      { speaker: 'Iron Mike', line: "Tough kid. Take the Iron Stamp." },
      { speaker: 'Iron Mike', line: "And eat something. You look skinny." },
    ],
  },

  'coral-bay': {
    arrival: "Ocean breeze through open walls. Best vibes, deadliest guards.",
    rivalEncounter: 'rival-coral',
    gymLeaderBefore: [
      { speaker: 'Marina', line: "Relax. Feel the flow." },
      { speaker: 'Marina', line: "The guard is like water." },
      { speaker: 'Marina', line: "Now drown in it." },
    ],
    gymLeaderAfter: [
      { speaker: 'Marina', line: "Beautiful. You passed my guard." },
      { speaker: 'Marina', line: "Not many can say that. Wave Stamp is yours." },
    ],
  },

  'sambo-district': {
    arrival: "Underground gym. Dim lights. Combat posters. No tourists.",
    gymLeaderBefore: [
      { speaker: 'Viktor', line: "In Russia, grappling is not a hobby." },
      { speaker: 'Viktor', line: "It is survival. Show me you understand." },
    ],
    gymLeaderAfter: [
      { speaker: 'Viktor', line: "You fight like you've been hungry before." },
      { speaker: 'Viktor', line: "Combat Stamp. Don't waste it." },
    ],
  },

  'nova-camp': {
    arrival: "High-tech facility. Screens, sensors, video replay rooms.",
    rivalEncounter: 'rival-nova',
    gymLeaderBefore: [
      { speaker: 'Dr. Yun', line: "I've watched your footage." },
      { speaker: 'Dr. Yun', line: "Your A-game is strong. Your B-game is not." },
      { speaker: 'Dr. Yun', line: "Let's see how you adapt when Plan A fails." },
    ],
    gymLeaderAfter: [
      { speaker: 'Dr. Yun', line: "Fascinating. You adapted mid-round." },
      { speaker: 'Dr. Yun', line: "Precision Stamp. You've earned the data." },
    ],
  },

  'iron-coast': {
    arrival: "Cliffside mega-gym. Champion banners everywhere. The final stop.",
    rivalEncounter: 'rival-iron',
    gymLeaderBefore: [
      { speaker: 'The Professor', line: "You want the Champion Stamp?" },
      { speaker: 'The Professor', line: "Everyone who stands here thinks they're ready." },
      { speaker: 'The Professor', line: "Prove it." },
    ],
    gymLeaderAfter: [
      { speaker: 'The Professor', line: "You're ready for Worlds." },
      { speaker: 'The Professor', line: "Champion Stamp. Last one. Now go." },
    ],
  },

  'summit-city': {
    arrival: "The coliseum. Banners of every champion. This is it.",
  },
};

// ── WORLD CHAMPIONSHIP ARC ──
export const WORLDS_ARC = {
  qualifying: [
    { speaker: 'Announcer', line: "Welcome to the World Championships." },
    { speaker: 'Announcer', line: "32 of the best grapplers on the planet." },
    { speaker: 'Prof. Helio', line: "(via text) I'm watching. Make it count." },
  ],

  // Bracket: player and Kenzo on opposite sides
  bracketReveal: [
    { speaker: 'Player', line: "Kenzo's on the other side of the bracket." },
    { speaker: 'Player', line: "If we both win... we meet in the finals." },
  ],

  // Semi-final vs legendary NPC
  semiFinalBefore: [
    { speaker: 'Announcer', line: "Semi-final: vs. Royce 'The Ghost' Tanaka." },
    { speaker: 'The Ghost', line: "I've won this tournament three times." },
    { speaker: 'The Ghost', line: "You remind me of myself at your age." },
    { speaker: 'The Ghost', line: "Let's see if you're ready." },
  ],
  semiFinalAfter: [
    { speaker: 'The Ghost', line: "The throne is yours to take." },
    { speaker: 'The Ghost', line: "One more match. Don't hold back." },
  ],

  // Other side: Kenzo beats his semi-final opponent
  kenzoSemiWin: [
    { speaker: 'Announcer', line: "Other bracket: Kenzo wins by submission!" },
    { speaker: 'Announcer', line: "Finals is set." },
  ],

  // Finals dialogue is in RIVAL_ENCOUNTERS[7] (rival-finals)

  // Victory
  victory: [
    { speaker: 'Announcer', line: "YOUR NAME... WORLD CHAMPION!" },
    { speaker: 'Prof. Helio', line: "I knew it from day one." },
    { speaker: 'Prof. Helio', line: "When you walked into that gym..." },
    { speaker: 'Prof. Helio', line: "...and chose to stay." },
  ],
};

// ── POST-CREDITS ──
export const POST_CREDITS = [
  { speaker: '', line: "Six months later..." },
  { speaker: '', line: "You're back at the Home Gym." },
  { speaker: '', line: "A nervous white belt walks through the door." },
  { speaker: 'White Belt', line: "Um... is this where I sign up?" },
  { speaker: 'Player', line: "Yeah. Class starts in five." },
  { speaker: 'Player', line: "Pick a group. Watch. Then jump in." },
  { speaker: 'Player', line: "Everyone's nervous the first day." },
  // Player repeats Prof. Helio's exact words. Full circle.
  { speaker: '', line: "The cycle continues." },
  { speaker: '', line: "GRAPPLE QUEST" },
  { speaker: '', line: "Thank you for playing." },
];
