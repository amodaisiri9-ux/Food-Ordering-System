/**
 * Singlish + English + Sinhala — treat as one language.
 * Normalizes mixed input and picks a matching response style.
 */

const SINGLISH_PHRASES = [
  ['recommend karanna', 'recommend'],
  ['rec karanna', 'recommend'],
  ['order ekak', 'order meal'],
  ['main ekak', 'main course'],
  ['dessert ekak', 'dessert sweet'],
  ['starter ekak', 'starter'],
  ['drink ekak', 'drink beverage'],
  ['beverage ekak', 'drink beverage'],
  ['family ekata', 'family'],
  ['kuttamata', 'family'],
  ['mata oni', 'need want for me'],
  ['mata one', 'need want for me'],
  ['mokadda oni', 'what need'],
  ['monawada oni', 'what need'],
  ['sugar adui', 'low sugar diabetes'],
  ['sugar nathi', 'sugar free diabetes'],
  ['kiru allergy', 'dairy milk allergy'],
  ['kirige allergy', 'dairy milk allergy'],
  ['mas nathi', 'no meat vegetarian'],
  ['jaala nathi', 'no spicy mild'],
  ['miris nathi', 'no spicy mild'],
  ['adui de', 'less low cheap'],
  ['komalu de', 'cheap budget affordable'],
  ['lassanai de', 'cheap budget affordable'],
  ['wadi miris', 'very spicy hot'],
  ['podi lamaya', 'child kid baby'],
  ['lamayekata', 'child kid for child'],
  ['ajjige', 'elderly grandma grandpa'],
  ['muththanata', 'elderly senior'],
  ['health nisa', 'health condition'],
  ['allergy ekak', 'allergy'],
  ['under rs', 'under rs'],
  ['ta adui', 'under less'],
  ['wage', 'like similar'],
  ['penna', 'show recommend'],
  ['balanna', 'show look recommend'],
  ['kanna oni', 'want eat food meal'],
  ['kewanna oni', 'want eat food meal'],
  ['kai ekak', 'food meal'],
  ['rasa ekak', 'taste flavor'],
  ['sudu de', 'sweet dessert'],
  ['peni de', 'sweet dessert'],
  ['popular de', 'popular best'],
  ['hari food', 'good food'],
  ['hari ekak', 'good recommend'],
];

const SINGLISH_WORDS = {
  mata: 'for me',
  mokadda: 'what',
  monawada: 'what',
  oni: 'need want',
  onda: 'need want',
  one: 'need want',
  ekak: 'a one',
  karanna: 'do make',
  machan: '',
  bro: '',
  ape: 'our',
  hari: 'okay good',
  kanna: 'eat food meal',
  kewanna: 'eat food',
  kai: 'food meal',
  kiru: 'milk dairy',
  kirige: 'milk dairy',
  mas: 'meat',
  jaala: 'spicy hot',
  miris: 'spicy chili',
  sudu: 'sweet',
  peni: 'sweet dessert',
  lamaya: 'child kid',
  lamayek: 'child kid',
  ajja: 'elderly grandpa',
  ajji: 'elderly grandma',
  komalu: 'cheap budget',
  lassanai: 'cheap affordable',
  adui: 'less low under',
  wadi: 'more very',
  bewanne: 'drink',
  bewanwa: 'drink beverage',
  rasa: 'taste flavor',
  wisthara: 'details about',
  denna: 'give recommend',
  balanna: 'see look',
  penna: 'show',
  theruma: 'understand',
  gane: 'for',
  nisa: 'because due',
  nathi: 'no without free',
  thiyenawa: 'available have',
  hoyaganna: 'find search',
};

const GREETING_SINGLISH = ['ayubowan', 'hello', 'hi', 'hey', 'hola', 'හායි', 'ආයුබෝවන්', 'koheda', 'kohomada', 'kohomd'];
const THANKS_SINGLISH = ['thank', 'thanks', 'stuti', 'ස්තුතියි', 'honadowai', 'honadoo', 'bohoma stuti'];

function normalizeMessage(text) {
  let normalized = ` ${text.toLowerCase()} `;

  for (const [phrase, replacement] of SINGLISH_PHRASES) {
    normalized = normalized.split(phrase).join(` ${replacement} `);
  }

  for (const [word, replacement] of Object.entries(SINGLISH_WORDS)) {
    const re = new RegExp(`\\b${word}\\b`, 'g');
    normalized = normalized.replace(re, ` ${replacement} `);
  }

  return normalized.replace(/\s+/g, ' ').trim();
}

function detectLanguageStyle(rawMessage) {
  const text = rawMessage.toLowerCase();
  const sinhalaCount = (rawMessage.match(/[\u0D80-\u0DFF]/g) || []).length;
  const singlishHits = Object.keys(SINGLISH_WORDS).filter((w) => new RegExp(`\\b${w}\\b`).test(text)).length;
  const singlishPhraseHits = SINGLISH_PHRASES.filter(([p]) => text.includes(p)).length;

  if (sinhalaCount >= 4) return 'sinhala';
  if (singlishHits >= 2 || singlishPhraseHits >= 1) return 'singlish';
  return 'english';
}

function detectIntentNormalized(normalized, raw) {
  const rawLow = raw.toLowerCase();
  if (GREETING_SINGLISH.some((k) => rawLow.includes(k) || normalized.includes(k))) return 'greeting';
  if (THANKS_SINGLISH.some((k) => rawLow.includes(k) || normalized.includes(k))) return 'thanks';
  return 'food_request';
}

/** Response templates by language style */
const REPLIES = {
  greeting: {
    singlish:
      'Ayubowan machan! 😊 Food Hub friend ekak wage help karannam. ' +
      'Health issue, allergy, age, price — mokuth oni nam kiyanna, hari menu ekak select karala dennam.',
    sinhala:
      'ආයුබෝවන්! 😊 Food Hub එකේ ඔයාගේ මිතුරා වගේ help කරන්න ඉන්නේ. ' +
      'සෞඛ්‍යය, අලර්ජි, වයස, මිල — ඕනේ දේ කියන්න, හොඳ menu එකක් තෝරා දෙන්නම්.',
    english:
      'Hello! 😊 I\'m here like your Food Hub buddy. ' +
      'Tell me about health, allergies, age, or budget — I\'ll pick the right menu for you.',
  },
  thanks: {
    singlish: 'Issarahai machan! 😊 Thawa oni nam kiyanna.',
    sinhala: 'ඉතින් කමක් නෑ! 😊 තව ඕනේ නම් කියන්න.',
    english: 'You\'re welcome! 😊 Let me know if you need anything else.',
  },
  understood: {
    singlish: 'Hari hari, mata therunawa! 👍',
    sinhala: 'හරි, ඔයාගේ request එක තේරුණා!',
    english: 'Got it, I understand what you need!',
  },
  mentioned: {
    singlish: (name) => `Ow ${name} gane da? Menu eke thiyenawa.`,
    sinhala: (name) => `ඔව්, ${name} ගැන අහන්නේ නේ?`,
    english: (name) => `Ah, you're asking about ${name}? We've got that on the menu.`,
  },
  noMatch: {
    singlish: 'Eka menu eke na machan. Wena price ekak ho rasa ekak kiyanna, balannam.',
    sinhala: 'ඒකට හරියටම ගැලපෙන එක menu එකේ දැන් නෑ. වෙනස් මිලක් හෝ රසයක් කිව්වොත් බලන්නම්.',
    english: 'Nothing on the menu fits that exactly. Try a different price or taste — I\'ll look again.',
  },
  recHealth: {
    singlish: (name, price, desc) =>
      `Health/allergy nisa balala **${name}** (Rs ${price}) hari pick ekak — ${desc}.`,
    sinhala: (name, price, desc) =>
      `සෞඛ්‍යය/අලර්ජි බලලා **${name}** (Rs ${price}) හොඳ pick එකක් — ${desc}.`,
    english: (name, price, desc) =>
      `Considering your health/allergy needs, **${name}** (Rs ${price}) is a safe pick — ${desc}.`,
  },
  recChild: {
    singlish: (name, price, desc) => `Lamayata hari **${name}** (Rs ${price}) — ${desc}.`,
    sinhala: (name, price, desc) => `ළමයින්ට හොඳයි **${name}** (Rs ${price}) — ${desc}.`,
    english: (name, price, desc) => `Kid-friendly choice: **${name}** (Rs ${price}) — ${desc}.`,
  },
  recElderly: {
    singlish: (name, price, desc) => `Ajjige/muththanata soft — **${name}** (Rs ${price}), ${desc}.`,
    sinhala: (name, price, desc) => `වැයැඩි අයට සැහැල්ලුයි — **${name}** (Rs ${price}), ${desc}.`,
    english: (name, price, desc) => `Gentle for seniors — **${name}** (Rs ${price}), ${desc}.`,
  },
  recBudget: {
    singlish: (name, price, desc) => `Price ekata hari — **${name}** (Rs ${price}) value eka loku. ${desc}.`,
    sinhala: (name, price, desc) => `මිලට හොඳයි — **${name}** (Rs ${price}) value එක ලොකුයි. ${desc}.`,
    english: (name, price, desc) => `Great value — **${name}** (Rs ${price}). ${desc}.`,
  },
  recPremium: {
    singlish: (name, price, desc) => `Quality ekata **${name}** (Rs ${price}) top pick — ${desc}.`,
    sinhala: (name, price, desc) => `Quality එකට **${name}** (Rs ${price}) හොඳ pick — ${desc}.`,
    english: (name, price, desc) => `Premium pick — **${name}** (Rs ${price}). ${desc}.`,
  },
  recDefault: {
    singlish: (name, price, desc) => `Mata hithanne **${name}** (Rs ${price}) badama hari — ${desc}.`,
    sinhala: (name, price, desc) => `මම හිතන්නේ **${name}** (Rs ${price}) ඔයාට වැඩියෙන්ම ගැලපෙයි — ${desc}.`,
    english: (name, price, desc) => `I'd go with **${name}** (Rs ${price}) — ${desc}.`,
  },
  moreItems: {
    singlish: (alts) => ` Thawa ${alts} balanna.`,
    sinhala: (alts) => ` තවත් ${alts} බලන්න.`,
    english: (alts) => ` Also check out ${alts}.`,
  },
  addCart: {
    singlish: ' Pahala cards valin cart ekata add karanna puluwan.',
    sinhala: ' පහළ cards වලින් cart එකට add කරන්න පුළුවන්.',
    english: ' Add to cart from the cards below.',
  },
};

const PROFILE_CONTEXT = {
  diabetes: {
    singlish: 'Diabetes/sugar issue eka therunawa — sugar adui, soft options balanawa.',
    sinhala: 'පැස්සුම් ගැටලුව තේරුණා — අඩු සීනි options බලනවා.',
    english: 'Noted your diabetes concern — looking at low-sugar options.',
  },
  heart: {
    singlish: 'Heart health gane hari — grilled, vegetable items priority.',
    sinhala: 'හෘද සෞඛ්‍යට grilled, vegetable items priority.',
    english: 'For heart health — prioritizing grilled and veggie options.',
  },
  gastric: {
    singlish: 'Gastric issue nisa spicy nathi mild food balanawa.',
    sinhala: 'ආමාශයට spicy නැති mild food බලනවා.',
    english: 'Stomach-friendly — skipping spicy, going mild.',
  },
  hypertension: {
    singlish: 'BP high nisa low salt, light food recommend karannam.',
    sinhala: 'රුධිර පීඩනයට අඩු ලවණ, සැහැල්ලු ආහාර.',
    english: 'For blood pressure — low-sodium, light meals.',
  },
  weight_loss: {
    singlish: 'Weight adui karanne nisa light, healthy food balanawa.',
    sinhala: 'අඩු කිලෝ සඳහා light, healthy food.',
    english: 'For weight goals — light, healthy picks.',
  },
  dairy: {
    singlish: 'Kiru/dairy allergy therunawa — dairy thibba food avoid karannam.',
    sinhala: 'කිරි අලර්ජි එකට dairy food avoid කරනවා.',
    english: 'Dairy allergy noted — avoiding milk-based items.',
  },
  gluten: {
    singlish: 'Gluten allergy nisa pasta, bread type avoid.',
    sinhala: 'ග්ලූටන් අලර්ජිට pasta, bread avoid.',
    english: 'Gluten allergy — skipping pasta and bread items.',
  },
  seafood: {
    singlish: 'Seafood allergy nisa fish/seafood items skip.',
    sinhala: 'මාළු අලර්ජිට seafood skip.',
    english: 'Seafood allergy — no fish or seafood dishes.',
  },
  child: {
    singlish: 'Lamayekata mild, nutrition food select karannam.',
    sinhala: 'ළමයින්ට mild, පෝෂණ food තෝරනවා.',
    english: 'Picking mild, nutritious food for the child.',
  },
  elderly: {
    singlish: 'Ajjige/muththanata soft, easy-to-eat food balanawa.',
    sinhala: 'වැයැඩි අයට soft, පහසු ආහාර බලනවා.',
    english: 'Soft, easy meals for the elderly.',
  },
  budget: {
    singlish: (label) => `${label} price range ekata match wena food balanawa.`,
    sinhala: (label) => `${label} මිලට ගැලපෙන ආහාර බලනවා.`,
    english: (label) => `Matching items to your ${label} budget.`,
  },
};

function buildProfileLines(profile, style) {
  const lines = [];
  for (const h of profile.health) {
    if (PROFILE_CONTEXT[h]?.[style]) lines.push(PROFILE_CONTEXT[h][style]);
  }
  for (const a of profile.allergies) {
    if (PROFILE_CONTEXT[a]?.[style]) lines.push(PROFILE_CONTEXT[a][style]);
  }
  if (profile.age === 'child' && PROFILE_CONTEXT.child[style]) lines.push(PROFILE_CONTEXT.child[style]);
  if (profile.age === 'elderly' && PROFILE_CONTEXT.elderly[style]) lines.push(PROFILE_CONTEXT.elderly[style]);
  if (profile.budgetLabel && PROFILE_CONTEXT.budget[style]) {
    lines.push(PROFILE_CONTEXT.budget[style](profile.budgetLabel));
  }
  return lines;
}

const SUGGESTIONS = {
  singlish: [
    'Mata diabetes nisa sugar adui meal ekak',
    'Kiru allergy — safe food',
    'Lamayekata kanna denna Rs 10 ta adui',
    'Ajjige soft food oni',
    'Spicy main ekak Rs 15 ta adui',
    'Popular de rec karanna',
  ],
  sinhala: [
    'දියවැඩියාවට අඩු සීනි ආහාර',
    'කිරි අලර්ජි — safe food',
    'ළමයින්ට Rs 10 ට අඩු',
    'වැයැඩි අයට soft food',
  ],
  english: [
    'Low sugar meal for diabetes',
    'Dairy-free safe food',
    'Kid meal under Rs 10',
    'Soft food for elderly',
  ],
};

function getSuggestions(needs, style) {
  const s = [];
  const p = needs.profile;

  if (style === 'singlish') {
    if (p.health.includes('diabetes')) s.push('Diabetes nisa sugar adui meal');
    if (p.allergies.includes('dairy')) s.push('Kiru allergy safe food');
    if (p.age === 'child') s.push('Lamayekata meal ekak');
    if (p.maxPrice) s.push(`Rs ${p.maxPrice} ta adui wadi options`);
    if (!s.length) return SUGGESTIONS.singlish.slice(0, 4);
    return [...new Set(s)].slice(0, 4);
  }

  if (style === 'sinhala') return SUGGESTIONS.sinhala;
  return SUGGESTIONS.english;
}

function t(template, style, ...args) {
  const entry = template[style] || template.singlish;
  return typeof entry === 'function' ? entry(...args) : entry;
}

module.exports = {
  normalizeMessage,
  detectLanguageStyle,
  detectIntentNormalized,
  buildProfileLines,
  getSuggestions,
  REPLIES,
  t,
  SUGGESTIONS,
};
