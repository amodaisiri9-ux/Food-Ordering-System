const { FoodItem } = require('../models');
const { fetchAdvice } = require('../utils/webSearch');
const {
  analyzeProfile,
  isExcludedByAllergy,
  scoreForProfile,
} = require('../utils/customerProfile');
const {
  normalizeMessage,
  detectLanguageStyle,
  detectIntentNormalized,
  buildProfileLines,
  getSuggestions,
  REPLIES,
  t,
  SUGGESTIONS,
} = require('../utils/singlishParser');

const CATEGORY_KEYWORDS = {
  Starters: ['starter', 'appetizer', 'snack', 'පිටිරවුම', 'ආරම්භක'],
  'Main Course': ['main', 'main course', 'lunch', 'dinner', 'rice', 'ප්‍රධාන', 'දිවා', 'රාත්‍රී'],
  Desserts: ['dessert', 'sweet', 'cake', 'ice cream', 'chocolate', 'මිහිරි', 'අතුරුපස'],
  Beverages: ['drink', 'beverage', 'juice', 'coffee', 'tea', 'පාන', 'බීම'],
  Specials: ['special', 'platter', 'bbq', 'seafood', 'විශේෂ', 'ප්ලැටර්'],
};

const DIETARY_KEYWORDS = {
  vegetarian: ['vegetarian', 'vegan', 'veggie', 'vegetable', 'no meat', 'එළවළු', 'නිර්මාංශ'],
  meat: ['meat', 'beef', 'steak', 'chicken', 'grill', 'bbq', 'මස්', 'කුකුල්'],
  seafood: ['seafood', 'fish', 'මාළු', 'මුහුදු'],
  spicy: ['spicy', 'hot', 'zesty', 'very spicy', 'ඌෂ්ණ', 'කුරුරු'],
  mild: ['mild', 'light', 'no spicy', 'සැහැල්ලු'],
};

const OCCASION_KEYWORDS = {
  family: ['family', 'share', 'group', 'platter', 'කුටුම්බය'],
  quick: ['quick', 'fast', 'hurry', 'ඉක්මන්'],
  romantic: ['date', 'romantic', 'couple'],
};

function detectFromKeywords(text, map) {
  return Object.entries(map)
    .filter(([, kws]) => kws.some((k) => text.includes(k)))
    .map(([key]) => key);
}

function wantsPopular(text) {
  return ['popular', 'best', 'recommend', 'top', 'favorite', 'ප්‍රසිද්ධ', 'suggest', 'show'].some((k) => text.includes(k));
}

function findMentionedMenuItems(message, allItems) {
  const lower = message.toLowerCase();
  const normalized = normalizeMessage(message);
  return allItems.filter((item) => {
    const name = item.name.toLowerCase();
    return (
      lower.includes(name) ||
      normalized.includes(name) ||
      name.split(/\s+/).filter((w) => w.length > 3).some((w) => lower.includes(w) || normalized.includes(w))
    );
  });
}

function analyzeCustomerNeeds(message, history, allItems) {
  const historyText = history.slice(-3).map((h) => h.content || '').join(' ');
  const raw = message.trim();
  const normalized = normalizeMessage(`${historyText} ${raw}`);
  const langStyle = detectLanguageStyle(raw);

  return {
    intent: detectIntentNormalized(normalized, raw),
    langStyle,
    normalized,
    categories: detectFromKeywords(normalized, CATEGORY_KEYWORDS),
    dietary: detectFromKeywords(normalized, DIETARY_KEYWORDS),
    occasion: detectFromKeywords(normalized, OCCASION_KEYWORDS),
    popular: wantsPopular(normalized),
    mentionedItems: findMentionedMenuItems(raw, allItems),
    rawMessage: raw,
    profile: analyzeProfile(raw, historyText),
  };
}

function scoreItem(item, needs) {
  let score = scoreForProfile(item, needs.profile);
  const desc = `${item.name} ${item.description}`.toLowerCase();
  const price = parseFloat(item.price);

  if (needs.mentionedItems.some((m) => m.id === item.id)) score += 20;
  if (needs.categories.includes(item.category)) score += 5;
  if (needs.popular && item.isPopular) score += 4;
  if (needs.dietary.includes('vegetarian') && /vegetable|bruschetta|curry|herbal/i.test(desc)) score += 4;
  if (needs.dietary.includes('meat') && /chicken|beef|steak|bbq|pancetta/i.test(desc)) score += 4;
  if (needs.dietary.includes('seafood') && /seafood|fish/i.test(desc)) score += 5;
  if (needs.dietary.includes('spicy') && /spicy|zesty|curry/i.test(desc)) score += 4;
  if (needs.occasion.includes('family') && /platter|bbq|set/i.test(desc)) score += 4;

  if (needs.profile.maxPrice && price > needs.profile.maxPrice) score -= 15;
  if (needs.profile.minPrice && price < needs.profile.minPrice) score -= 5;

  if (item.isPopular) score += 1;
  score += (item.averageRating || 4) * 0.5;
  return score;
}

function filterAndRankItems(allItems, needs) {
  let items = allItems.filter((item) => !isExcludedByAllergy(item, needs.profile.allergies));

  if (needs.categories.length === 1) {
    const f = items.filter((i) => i.category === needs.categories[0]);
    if (f.length) items = f;
  }
  if (needs.popular) {
    const f = items.filter((i) => i.isPopular);
    if (f.length) items = f;
  }
  if (needs.profile.maxPrice) {
    const f = items.filter((i) => parseFloat(i.price) <= needs.profile.maxPrice);
    if (f.length) items = f;
  }
  if (needs.profile.minPrice) {
    const f = items.filter((i) => parseFloat(i.price) >= needs.profile.minPrice);
    if (f.length) items = f;
  }

  return items
    .map((item) => ({ item, score: scoreItem(item, needs) }))
    .filter((s) => s.score > -50)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);
}

function buildNaturalReply(needs, recommendations, advice) {
  const style = needs.langStyle;

  if (needs.intent === 'greeting') {
    return {
      reply: t(REPLIES.greeting, style),
      suggestions: SUGGESTIONS[style]?.slice(0, 4) || SUGGESTIONS.singlish.slice(0, 4),
    };
  }

  if (needs.intent === 'thanks') {
    return {
      reply: t(REPLIES.thanks, style),
      suggestions: getSuggestions(needs, style),
    };
  }

  const parts = [];
  const profileLines = buildProfileLines(needs.profile, style);

  if (profileLines.length) {
    parts.push(profileLines.join(' '));
  } else if (needs.mentionedItems.length) {
    parts.push(t(REPLIES.mentioned, style, needs.mentionedItems[0].name));
  } else {
    parts.push(t(REPLIES.understood, style));
  }

  if (!recommendations.length) {
    return {
      reply: parts.join(' ') + ' ' + t(REPLIES.noMatch, style),
      suggestions: getSuggestions(needs, style),
    };
  }

  if (advice) parts.push(advice);

  const top = recommendations[0];
  const topPrice = parseFloat(top.price).toFixed(2);
  let recPart;

  if (needs.profile.health.length || needs.profile.allergies.length) {
    recPart = t(REPLIES.recHealth, style, top.name, topPrice, top.description);
  } else if (needs.profile.age === 'child') {
    recPart = t(REPLIES.recChild, style, top.name, topPrice, top.description);
  } else if (needs.profile.age === 'elderly') {
    recPart = t(REPLIES.recElderly, style, top.name, topPrice, top.description);
  } else if (needs.profile.budgetLabel || needs.profile.priceTier === 'budget') {
    recPart = t(REPLIES.recBudget, style, top.name, topPrice, top.description);
  } else if (needs.profile.priceTier === 'premium') {
    recPart = t(REPLIES.recPremium, style, top.name, topPrice, top.description);
  } else {
    recPart = t(REPLIES.recDefault, style, top.name, topPrice, top.description);
  }

  if (recommendations.length > 1) {
    const alts = recommendations.slice(1, 3).map((i) => `**${i.name}** (Rs ${parseFloat(i.price).toFixed(2)})`).join(', ');
    recPart += t(REPLIES.moreItems, style, alts);
  }

  recPart += t(REPLIES.addCart, style);
  parts.push(recPart);

  return { reply: parts.join(' '), suggestions: getSuggestions(needs, style) };
}

function formatFoodItem(item) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: parseFloat(item.price),
    category: item.category,
    image: item.image,
    rating: item.averageRating || 4.8,
    isPopular: item.isPopular,
  };
}

exports.chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a message' });
    }

    const allItems = await FoodItem.findAll({ where: { isAvailable: true } });
    const needs = analyzeCustomerNeeds(message, history, allItems);

    let topItems = filterAndRankItems(allItems, needs).slice(0, 3);

    if (!topItems.length) {
      topItems = allItems
        .filter((i) => !isExcludedByAllergy(i, needs.profile.allergies))
        .filter((i) => i.isPopular)
        .slice(0, 3);
    }

    if (needs.intent === 'greeting' || needs.intent === 'thanks') {
      topItems = allItems.filter((i) => i.isPopular).slice(0, 3);
    }

    const advice = needs.intent === 'food_request' ? await fetchAdvice(needs, topItems[0]) : '';
    const { reply, suggestions } = buildNaturalReply(needs, topItems, advice);

    res.status(200).json({
      success: true,
      data: {
        reply,
        recommendations: topItems.map(formatFoodItem),
        suggestions,
        langStyle: needs.langStyle,
        profile: {
          health: needs.profile.health,
          allergies: needs.profile.allergies,
          age: needs.profile.age,
          budget: needs.profile.budgetLabel || needs.profile.priceTier,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getWelcome = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        reply:
          'Ayubowan machan! 😊 Food Hub friend ekak wage help karannam. ' +
          'Singlish, English, Sinhala — kohomada kiyath pirihinda ganne. ' +
          'Health, allergy, age, price — mokuth oni nam kiyanna, hari menu ekak select karala dennam.',
        suggestions: SUGGESTIONS.singlish.slice(0, 4),
      },
    });
  } catch (err) {
    next(err);
  }
};
