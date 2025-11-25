import prisma from './prisma';

// Default banned words (can be overridden by database settings)
// Focus on spam/scam terms - admins can add other words via moderation settings
const DEFAULT_BANNED_WORDS = [
  'spam', 'scam', 'viagra', 'cialis', 'casino', 'lottery',
  'cryptocurrency giveaway', 'free bitcoin', 'click here now',
  'act now', 'limited time offer', 'make money fast',
  'work from home opportunity', 'nigerian prince'
];

// Cache for moderation settings
let moderationSettingsCache = null;
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get moderation settings from database with caching
 */
async function getModerationSettings() {
  const now = Date.now();

  if (moderationSettingsCache && now < cacheExpiry) {
    return moderationSettingsCache;
  }

  try {
    const settings = await prisma.moderationSettings.findFirst({
      where: { isActive: true }
    });

    if (settings) {
      moderationSettingsCache = settings;
      cacheExpiry = now + CACHE_DURATION;
      return settings;
    }
  } catch (error) {
    console.error('Error fetching moderation settings:', error);
  }

  // Return defaults if no settings found
  return {
    profanityFilter: true,
    bannedWords: DEFAULT_BANNED_WORDS.join(','),
    filterAction: 'CENSOR' // CENSOR, BLOCK, or FLAG
  };
}

/**
 * Clear the moderation settings cache
 */
export function clearModerationCache() {
  moderationSettingsCache = null;
  cacheExpiry = 0;
}

/**
 * Get the list of banned words
 */
export async function getBannedWords() {
  const settings = await getModerationSettings();

  if (!settings.bannedWords) {
    return DEFAULT_BANNED_WORDS;
  }

  // Parse banned words from comma-separated string
  return settings.bannedWords
    .split(',')
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length > 0);
}

/**
 * Check if profanity filter is enabled
 */
export async function isProfanityFilterEnabled() {
  const settings = await getModerationSettings();
  return settings.profanityFilter === true;
}

/**
 * Get the filter action (CENSOR, BLOCK, or FLAG)
 */
export async function getFilterAction() {
  const settings = await getModerationSettings();
  return settings.filterAction || 'CENSOR';
}

/**
 * Check text for banned words
 * @param {string} text - Text to check
 * @returns {Promise<{hasBannedWords: boolean, matches: string[], filtered: string}>}
 */
export async function checkContent(text) {
  if (!text) {
    return { hasBannedWords: false, matches: [], filtered: text };
  }

  const isEnabled = await isProfanityFilterEnabled();
  if (!isEnabled) {
    return { hasBannedWords: false, matches: [], filtered: text };
  }

  const bannedWords = await getBannedWords();
  const matches = [];
  let filtered = text;

  // Create regex patterns for each banned word
  for (const word of bannedWords) {
    if (!word) continue;

    // Escape special regex characters
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match whole words only (case-insensitive)
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');

    if (regex.test(text)) {
      matches.push(word);
      // Censor the word with asterisks
      filtered = filtered.replace(regex, (match) => '*'.repeat(match.length));
    }
  }

  return {
    hasBannedWords: matches.length > 0,
    matches,
    filtered
  };
}

/**
 * Filter content based on moderation settings
 * @param {string} text - Text to filter
 * @returns {Promise<{allowed: boolean, text: string, flagged: boolean, reason: string|null}>}
 */
export async function filterContent(text) {
  const { hasBannedWords, matches, filtered } = await checkContent(text);

  if (!hasBannedWords) {
    return { allowed: true, text, flagged: false, reason: null };
  }

  const action = await getFilterAction();

  switch (action) {
    case 'BLOCK':
      return {
        allowed: false,
        text,
        flagged: false,
        reason: `Content contains prohibited words: ${matches.join(', ')}`
      };

    case 'FLAG':
      return {
        allowed: true,
        text, // Keep original text
        flagged: true,
        reason: `Content flagged for review - contains: ${matches.join(', ')}`
      };

    case 'CENSOR':
    default:
      return {
        allowed: true,
        text: filtered, // Return censored text
        flagged: false,
        reason: null
      };
  }
}

/**
 * Strip HTML tags for text analysis
 */
export function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check and filter HTML content
 */
export async function filterHtmlContent(html) {
  const plainText = stripHtml(html);
  const result = await filterContent(plainText);

  if (!result.allowed) {
    return result;
  }

  if (result.text !== plainText) {
    // Content was censored - need to censor in HTML too
    const { matches } = await checkContent(plainText);
    let filteredHtml = html;

    for (const word of matches) {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
      filteredHtml = filteredHtml.replace(regex, (match) => '*'.repeat(match.length));
    }

    return { ...result, text: filteredHtml };
  }

  return { ...result, text: html };
}

export default {
  checkContent,
  filterContent,
  filterHtmlContent,
  getBannedWords,
  isProfanityFilterEnabled,
  getFilterAction,
  clearModerationCache,
  stripHtml
};
