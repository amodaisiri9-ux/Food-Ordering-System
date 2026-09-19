/**
 * Web search for food advice — Google (if configured), Wikipedia, DuckDuckGo, local guide.
 */

async function searchGoogle(query) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  if (!apiKey || !cseId) return [];

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&num=3`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.items) return [];
    return data.items.map((item) => ({
      title: item.title,
      snippet: item.snippet,
      source: 'Google',
    }));
  } catch {
    return [];
  }
}

async function searchWikipedia(query) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return [];
    const [, titles] = await searchRes.json();
    if (!titles?.length) return [];

    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titles[0])}`
    );
    if (!summaryRes.ok) return [];
    const data = await summaryRes.json();
    if (!data.extract) return [];

    return [{ title: data.title, snippet: data.extract.slice(0, 300), source: 'Wikipedia' }];
  } catch {
    return [];
  }
}

async function searchDuckDuckGo(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.AbstractText) return [];
    return [{ title: data.Heading || query, snippet: data.AbstractText, source: 'Web' }];
  } catch {
    return [];
  }
}

const FOOD_KNOWLEDGE = {
  'grilled chicken': 'Grilled chicken is lean, filling and pairs well with sides — great for a hearty meal.',
  'pasta carbonara': 'Carbonara is a creamy Italian classic — rich and satisfying for pasta lovers.',
  'vegetable curry': 'Vegetable curry is wholesome, spiced and full of nutrients — a solid vegetarian pick.',
  'chocolate lava cake': 'Lava cake has a warm molten center — perfect when you crave something sweet.',
  'beef steak': 'A good steak is protein-rich and indulgent — ideal for a special meal.',
  'spring rolls': 'Spring rolls are light and crispy — a nice starter to open your appetite.',
  'spicy seafood': 'Spicy seafood brings bold, zesty flavours — great if you enjoy heat.',
  'family meal': 'Sharing platters and BBQ sets work well for families — everyone can pick what they like.',
  'family platter': 'Large platters let everyone share — budget-friendly and fun for groups.',
  'vegetarian': 'Vegetable-based dishes and fresh sides are light yet satisfying for vegetarian diners.',
  'dessert': 'A sweet dessert after a main course rounds off the meal nicely.',
  'diabetes': 'Low-sugar meals with vegetables, lean protein and herbal drinks are better for diabetes management.',
  'dairy allergy': 'Dairy-free options like grilled dishes, vegetable curries and fresh juice avoid milk-based ingredients.',
  'child': 'Mild, familiar flavours and smaller portions work well for children.',
  'elderly': 'Soft, easy-to-digest meals with mild seasoning are gentler for seniors.',
};

function getLocalFoodKnowledge(query) {
  const lower = query.toLowerCase();
  const results = [];
  for (const [key, snippet] of Object.entries(FOOD_KNOWLEDGE)) {
    if (lower.includes(key) || key.split(' ').every((w) => lower.includes(w))) {
      results.push({ title: key, snippet, source: 'Guide' });
    }
  }
  return results;
}

async function searchFoodInfo(query) {
  const foodQuery = `${query} food`;
  const [google, wiki, ddg, local] = await Promise.all([
    searchGoogle(foodQuery),
    searchWikipedia(query),
    searchDuckDuckGo(foodQuery),
    Promise.resolve(getLocalFoodKnowledge(query)),
  ]);

  const seen = new Set();
  const combined = [];
  for (const r of [...google, ...wiki, ...ddg, ...local]) {
    const key = r.snippet.slice(0, 50);
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(r);
    }
  }
  return combined.slice(0, 2);
}

/** Turn search results into one natural advice sentence for conversation. */
function toAdviceSentence(results) {
  if (!results.length) return '';
  const text = results[0].snippet;
  const sentence = text.split(/[.!?]/).find((s) => s.trim().length > 20);
  if (!sentence) return '';
  return sentence.trim() + '.';
}

function buildAdviceQuery(needs) {
  const parts = [];
  const p = needs.profile || {};

  if (p.health?.length) parts.push(...p.health, 'healthy diet');
  if (p.allergies?.length) parts.push(...p.allergies, 'allergy safe food');
  if (p.age) parts.push(`${p.age} age appropriate food`);
  if (needs.occasion?.length) parts.push(...needs.occasion);
  if (needs.dietary?.length) parts.push(...needs.dietary);
  if (needs.categories?.length) parts.push(...needs.categories);
  if (p.budgetLabel) parts.push(p.budgetLabel);
  if (p.priceTier) parts.push(p.priceTier);
  if (needs.popular) parts.push('popular');

  const base = parts.length ? parts.join(' ') : needs.rawMessage?.slice(0, 40) || 'food';
  return `${base} meal advice tips`;
}

async function fetchAdvice(needs, topItem) {
  const queries = [
    topItem ? `${topItem.name} food` : null,
    buildAdviceQuery(needs),
  ].filter(Boolean);

  for (const q of queries) {
    const results = await searchFoodInfo(q);
    const sentence = toAdviceSentence(results);
    if (sentence) return sentence;
  }
  return '';
}

module.exports = { searchFoodInfo, fetchAdvice, toAdviceSentence };
