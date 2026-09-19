/** Detect health, allergy, age, and price context from customer messages. */

const { normalizeMessage } = require('./singlishParser');

const HEALTH_KEYWORDS = {
  diabetes: ['diabetes', 'diabetic', 'blood sugar', 'sugar free', 'low sugar', 'sugar adui', 'පැස්සුම්', 'දියවැඩියාව'],
  heart: ['heart', 'cholesterol', 'cardiac', 'හෘද', 'කොලෙස්ට්‍රෝල්'],
  gastric: ['gastric', 'ulcer', 'acid reflux', 'acidity', 'ආමාශය', 'ගැස්ට්‍රික්', 'ආම්ලික'],
  hypertension: ['blood pressure', 'hypertension', 'bp', 'අධි රුධිර'],
  weight_loss: ['weight loss', 'lose weight', 'slimming', 'අඩු කිලෝ', 'දැහැගැසීම'],
  low_sodium: ['low sodium', 'salt free', 'ලවණ', 'ආලු'],
};

const ALLERGY_KEYWORDS = {
  dairy: ['dairy', 'lactose', 'milk allergy', 'cheese allergy', 'milk dairy', 'කිරි', 'දුග්ධිරය', 'dairy allergy'],
  gluten: ['gluten', 'wheat allergy', 'celiac', 'ග්ලූටන්', 'තිරිඟු'],
  seafood: ['seafood allergy', 'shellfish', 'fish allergy', 'මාළු අලර්ජි', 'ෂෙල්ෆිෂ්'],
  nuts: ['nut allergy', 'peanut', 'tree nut', 'ඇණ්ඩු', 'පීනට්'],
  egg: ['egg allergy', 'බිත්තර අලර්ජි'],
};

const AGE_KEYWORDS = {
  child: ['child', 'children', 'kid', 'kids', 'baby', 'toddler', 'for child', 'ළමයි', 'ළමා', 'දරුව', 'පාපි'],
  teen: ['teen', 'teenager', 'adolescent', 'යොවුන්', 'තරුණ'],
  elderly: ['elderly', 'senior', 'grandparent', 'grandma', 'grandpa', 'old age', 'elderly grandma', 'elderly grandpa', 'වැයැඩි', 'මුත්තනම්', 'මුතති', 'වෘද්ධ'],
};

function detectList(text, map) {
  return Object.entries(map)
    .filter(([, kws]) => kws.some((k) => text.includes(k)))
    .map(([key]) => key);
}

function extractAgeNumber(text) {
  const ageMatch = text.match(/(\d{1,2})\s*(?:years?\s*old|yr|y\/o|වයස්|අවුරුදු)/i);
  if (!ageMatch) return null;
  const age = parseInt(ageMatch[1], 10);
  if (age <= 12) return 'child';
  if (age <= 17) return 'teen';
  if (age >= 60) return 'elderly';
  return 'adult';
}

function extractBudget(text) {
  const taAdui = text.match(/(\d+)\s*ta\s*adui/i);
  if (taAdui) {
    const max = parseFloat(taAdui[1]);
    return { maxPrice: max, label: `Rs ${max} ta adui`, tier: getPriceTier(max) };
  }

  const rs = text.match(/(?:rs\.?|රු\.?)\s*(\d+)/i);
  if (rs) return { maxPrice: parseFloat(rs[1]), label: `Rs ${rs[1]} ta adui`, tier: getPriceTier(parseFloat(rs[1])) };

  const under = text.match(/under\s*(\d+)/i);
  if (under) return { maxPrice: parseFloat(under[1]), label: `under Rs ${under[1]}`, tier: getPriceTier(parseFloat(under[1])) };

  const range = text.match(/(\d+)\s*[-–to]\s*(\d+)/i);
  if (range) {
    const max = parseFloat(range[2]);
    return { minPrice: parseFloat(range[1]), maxPrice: max, label: `Rs ${range[1]}-${range[2]}`, tier: getPriceTier(max) };
  }

  if (['cheap', 'budget', 'affordable', 'low price', 'less low cheap', 'අඩු', 'ලාභ', 'මිල අඩු'].some((k) => text.includes(k))) {
    return { maxPrice: 10, label: 'komalu/lassanai', tier: 'budget' };
  }
  if (['premium', 'expensive', 'luxury', 'high end', 'උසස්', 'විලාසිතා'].some((k) => text.includes(k))) {
    return { minPrice: 15, label: 'premium මිලට', tier: 'premium' };
  }

  return { tier: null };
}

function getPriceTier(amount) {
  if (amount <= 8) return 'budget';
  if (amount <= 15) return 'mid';
  return 'premium';
}

function analyzeProfile(message, history = '') {
  const ctx = normalizeMessage(`${history} ${message}`);
  const budget = extractBudget(ctx);
  const ageFromNumber = extractAgeNumber(ctx);
  const ageGroups = detectList(ctx, AGE_KEYWORDS);
  const age = ageFromNumber || ageGroups[0] || null;

  return {
    health: detectList(ctx, HEALTH_KEYWORDS),
    allergies: detectList(ctx, ALLERGY_KEYWORDS),
    age,
    maxPrice: budget.maxPrice,
    minPrice: budget.minPrice,
    budgetLabel: budget.label,
    priceTier: budget.tier,
  };
}

/** Item suitability flags derived from name + description. */
function getItemFlags(item) {
  const t = `${item.name} ${item.description}`.toLowerCase();
  return {
    hasDairy: /cream|cheese|milk|ice cream|carbonara|cheesecake|latte/i.test(t),
    hasGluten: /pasta|bread|bruschetta|roll|toast|wheat/i.test(t),
    hasSeafood: /seafood|fish|shell/i.test(t),
    hasNuts: /nut|peanut|almond/i.test(t),
    hasEgg: /egg/i.test(t),
    isSpicy: /spicy|zesty|curry|hot/i.test(t),
    isSweet: /chocolate|cake|ice cream|cheesecake|sweet|sundae|lava/i.test(t),
    isMild: /soup|herbal|juice|bruschetta|grilled/i.test(t) && !/spicy|zesty/i.test(t),
    isSoft: /soup|curry|ice cream|cheesecake|pasta/i.test(t),
    isLight: /soup|juice|herbal|bruschetta|vegetable|salad/i.test(t),
    isKidFriendly: !/spicy|steak|wine|coffee|caffeine/i.test(t) || /ice cream|juice|spring|chicken/i.test(t),
    isElderlyFriendly: /soup|herbal|grilled|bruschetta|juice/i.test(t) && !/spicy|bbq/i.test(t),
    isDiabetesFriendly: !/chocolate|sugar|ice cream|cake|sundae|lava/i.test(t),
    isHeartFriendly: !/steak|bbq|cream|fried|crispy/i.test(t) || /grilled|vegetable|herbal|juice/i.test(t),
    isLowSodium: /herbal|juice|vegetable|bruschetta/i.test(t) && !/bbq|steak|seafood/i.test(t),
    price: parseFloat(item.price),
  };
}

function isExcludedByAllergy(item, allergies) {
  const f = getItemFlags(item);
  if (allergies.includes('dairy') && f.hasDairy) return true;
  if (allergies.includes('gluten') && f.hasGluten) return true;
  if (allergies.includes('seafood') && f.hasSeafood) return true;
  if (allergies.includes('nuts') && f.hasNuts) return true;
  if (allergies.includes('egg') && f.hasEgg) return true;
  return false;
}

function scoreForProfile(item, profile) {
  const f = getItemFlags(item);
  let score = 0;

  if (isExcludedByAllergy(item, profile.allergies)) return -100;

  if (profile.health.includes('diabetes') && f.isDiabetesFriendly) score += 8;
  if (profile.health.includes('diabetes') && f.isSweet) score -= 10;

  if (profile.health.includes('heart') && f.isHeartFriendly) score += 7;
  if (profile.health.includes('heart') && /steak|bbq|cream/i.test(`${item.name} ${item.description}`)) score -= 6;

  if (profile.health.includes('gastric') && f.isMild) score += 7;
  if (profile.health.includes('gastric') && f.isSpicy) score -= 10;

  if (profile.health.includes('hypertension') && f.isLowSodium) score += 6;
  if (profile.health.includes('hypertension') && /bbq|steak|seafood/i.test(`${item.name} ${item.description}`)) score -= 4;

  if (profile.health.includes('weight_loss') && f.isLight) score += 6;
  if (profile.health.includes('weight_loss') && f.isSweet) score -= 5;

  if (profile.age === 'child' && f.isKidFriendly) score += 8;
  if (profile.age === 'child' && f.isSpicy) score -= 8;

  if (profile.age === 'elderly' && f.isElderlyFriendly) score += 8;
  if (profile.age === 'elderly' && f.isSpicy) score -= 6;
  if (profile.age === 'elderly' && f.isSoft) score += 3;

  if (profile.age === 'teen' && item.isPopular) score += 4;

  if (profile.maxPrice && f.price <= profile.maxPrice) score += 5;
  if (profile.maxPrice && f.price > profile.maxPrice) score -= 8;

  if (profile.minPrice && f.price >= profile.minPrice) score += 3;

  if (profile.priceTier === 'budget' && f.price <= 8) score += 4;
  if (profile.priceTier === 'premium' && f.price >= 15) score += 4;

  return score;
}

const HEALTH_RESPONSE = {
  diabetes: 'පැස්සුම්/දියවැඩියාව ගැටලුව හොඳයි දැනගත්තා — මම අඩු සීනි, සැහැල්ලු options බලන්නේ.',
  heart: 'හෘද සෞඛ්‍ය ගැන සැලකිලිමත් වෙන්න ඕනේ කිව්වා නේ — මම lean, grilled, vegetable-based items ට priority දෙනවා.',
  gastric: 'ආමාශයට සැහැල්ලු ආහාර ඕනේ නේ — spicy දේවල් avoid කරලා mild options තෝරනවා.',
  hypertension: 'රුධිර පීඩනය ගැන සලස්වයි — අඩු ලවණ, සැහැල්ලු ආහාර recommend කරනවා.',
  weight_loss: 'අඩු කිලෝ ගැනීමට නම් light, පෝෂණවත් ආහාර හොඳයි — මම ඒවා බලන්නේ.',
  low_sodium: 'අඩු ලවණ ආහාර ඕනේ නේ — grilled, vegetable, herbal options හොඳයි.',
};

const ALLERGY_RESPONSE = {
  dairy: 'කිරි/දුග්ධිර අලර්ජි එක තියෙන එක හොඳයි දැනගත්තා — dairy තියෙන කෑම් avoid කරනවා.',
  gluten: 'ග්ලූටන් අලර්ජි එකට pasta, bread වගේ දේවල් avoid කරනවා.',
  seafood: 'මාළු/මුහුදු ආහාර අලර්ජි එකට seafood items skip කරනවා.',
  nuts: 'ඇණ්ඩු අලර්ජි එකට nut-containing items avoid කරනවා.',
  egg: 'බිත්තර අලර්ජි එකට egg-based items avoid කරනවා.',
};

const AGE_RESPONSE = {
  child: 'ළමයින්ට ගැලපෙන mild, පෝෂණවත්, ඌෂ්ණ නැති ආහාර තෝරනවා.',
  teen: 'තරුණයින්ට popular, filling ආහාර ටිකක් recommend කරනවා.',
  elderly: 'වැයැඩි අයට සැහැල්ලු, පහසුවෙන් කැමටි, digest කරන්න පුළුවන් ආහාර බලන්නේ.',
  adult: null,
};

const PRICE_RESPONSE = {
  budget: 'ලාභ මිලට හොඳ value එකක් ලැබෙන items තෝරනවා.',
  mid: 'මධ්‍යම මිල පරාසයට හොඳ quality එකක් ලැබෙන ආහාර බලන්නේ.',
  premium: 'quality එකට priority දෙලා premium items recommend කරනවා.',
};

function buildProfileContext(profile) {
  const lines = [];

  for (const h of profile.health) {
    if (HEALTH_RESPONSE[h]) lines.push(HEALTH_RESPONSE[h]);
  }
  for (const a of profile.allergies) {
    if (ALLERGY_RESPONSE[a]) lines.push(ALLERGY_RESPONSE[a]);
  }
  if (profile.age && AGE_RESPONSE[profile.age]) {
    lines.push(AGE_RESPONSE[profile.age]);
  }
  if (profile.budgetLabel) {
    lines.push(`${profile.budgetLabel} මිලට ගැලපෙන ආහාර බලන්නේ.`);
  } else if (profile.priceTier && PRICE_RESPONSE[profile.priceTier]) {
    lines.push(PRICE_RESPONSE[profile.priceTier]);
  }

  return lines;
}

module.exports = {
  analyzeProfile,
  getItemFlags,
  isExcludedByAllergy,
  scoreForProfile,
  buildProfileContext,
};
