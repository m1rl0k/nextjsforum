import prisma from './prisma';

// Default ranks configuration
const DEFAULT_RANKS = [
  { name: 'New Member', minPosts: 0, color: '#888888', icon: '🌱' },
  { name: 'Member', minPosts: 10, color: '#4CAF50', icon: '👤' },
  { name: 'Active Member', minPosts: 50, color: '#2196F3', icon: '⭐' },
  { name: 'Senior Member', minPosts: 100, color: '#9C27B0', icon: '🌟' },
  { name: 'Expert', minPosts: 250, color: '#FF9800', icon: '🏆' },
  { name: 'Veteran', minPosts: 500, color: '#F44336', icon: '💎' },
  { name: 'Legend', minPosts: 1000, color: '#FFD700', icon: '👑' }
];

// Cache for ranks
let ranksCache = null;
let ranksCacheExpiry = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Get ranks configuration from database or defaults
 */
export async function getRanks() {
  const now = Date.now();

  if (ranksCache && now < ranksCacheExpiry) {
    return ranksCache;
  }

  try {
    // Try to get ranks from database
    const dbRanks = await prisma.userRank.findMany({
      where: { isActive: true },
      orderBy: { minPosts: 'asc' }
    });

    if (dbRanks && dbRanks.length > 0) {
      ranksCache = dbRanks;
      ranksCacheExpiry = now + CACHE_DURATION;
      return dbRanks;
    }
  } catch (error) {
    // Database might not have the table yet
    console.log('UserRank table not found, using defaults');
  }

  // Return defaults
  ranksCache = DEFAULT_RANKS;
  ranksCacheExpiry = now + CACHE_DURATION;
  return DEFAULT_RANKS;
}

/**
 * Clear the ranks cache
 */
export function clearRanksCache() {
  ranksCache = null;
  ranksCacheExpiry = 0;
}

/**
 * Get user's rank based on post count
 */
export async function getUserRank(postCount) {
  const ranks = await getRanks();

  // Find the highest rank the user qualifies for
  let userRank = ranks[0];
  for (const rank of ranks) {
    if (postCount >= rank.minPosts) {
      userRank = rank;
    } else {
      break;
    }
  }

  return userRank;
}

/**
 * Get user's rank with progress to next rank
 */
export async function getUserRankWithProgress(postCount) {
  const ranks = await getRanks();

  let currentRank = ranks[0];
  let nextRank = null;
  let progress = 0;

  for (let i = 0; i < ranks.length; i++) {
    if (postCount >= ranks[i].minPosts) {
      currentRank = ranks[i];
      nextRank = ranks[i + 1] || null;
    } else {
      break;
    }
  }

  // Calculate progress to next rank
  if (nextRank) {
    const currentMin = currentRank.minPosts;
    const nextMin = nextRank.minPosts;
    const postsInRange = postCount - currentMin;
    const rangeSize = nextMin - currentMin;
    progress = Math.min(100, Math.round((postsInRange / rangeSize) * 100));
  } else {
    progress = 100; // At max rank
  }

  return {
    current: currentRank,
    next: nextRank,
    progress,
    postsToNextRank: nextRank ? nextRank.minPosts - postCount : 0
  };
}

/**
 * Get all ranks with user count for each
 */
export async function getRanksWithUserCounts() {
  const ranks = await getRanks();
  const ranksWithCounts = [];

  for (let i = 0; i < ranks.length; i++) {
    const rank = ranks[i];
    const nextRank = ranks[i + 1];

    const whereClause = {
      postCount: { gte: rank.minPosts },
      isActive: true
    };

    if (nextRank) {
      whereClause.postCount.lt = nextRank.minPosts;
    }

    try {
      const count = await prisma.user.count({ where: whereClause });
      ranksWithCounts.push({ ...rank, userCount: count });
    } catch (error) {
      ranksWithCounts.push({ ...rank, userCount: 0 });
    }
  }

  return ranksWithCounts;
}

/**
 * Format rank for display
 */
export function formatRank(rank) {
  if (!rank) return null;

  return {
    name: rank.name,
    color: rank.color,
    icon: rank.icon,
    minPosts: rank.minPosts,
    badge: `${rank.icon} ${rank.name}`
  };
}

export default {
  getRanks,
  getUserRank,
  getUserRankWithProgress,
  getRanksWithUserCounts,
  formatRank,
  clearRanksCache,
  DEFAULT_RANKS
};
