import { getRanks, getUserRankWithProgress, getRanksWithUserCounts } from '../../lib/userRanks';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, postCount, withCounts } = req.query;

    // If postCount is provided, return the rank for that post count
    if (postCount !== undefined) {
      const rankInfo = await getUserRankWithProgress(parseInt(postCount, 10));
      return res.status(200).json(rankInfo);
    }

    // If withCounts is true, return ranks with user counts
    if (withCounts === 'true') {
      const ranksWithCounts = await getRanksWithUserCounts();
      return res.status(200).json({ ranks: ranksWithCounts });
    }

    // Otherwise, return all ranks
    const ranks = await getRanks();
    res.status(200).json({ ranks });
  } catch (error) {
    console.error('Error fetching user ranks:', error);
    res.status(500).json({ error: 'Failed to fetch user ranks' });
  }
}
