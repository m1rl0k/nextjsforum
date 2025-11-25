import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;
  const pollId = parseInt(id, 10);

  if (isNaN(pollId)) {
    return res.status(400).json({ error: 'Invalid poll ID' });
  }

  // GET - Fetch poll with results
  if (req.method === 'GET') {
    try {
      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        include: {
          options: {
            include: {
              _count: {
                select: { votes: true }
              }
            },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: { votes: true }
          },
          thread: {
            select: { id: true, title: true }
          }
        }
      });

      if (!poll) {
        return res.status(404).json({ error: 'Poll not found' });
      }

      // Check if user has voted
      let userVotes = [];
      const token = req.cookies.token;
      if (token) {
        try {
          const decoded = verifyToken(token);
          const votes = await prisma.pollVote.findMany({
            where: {
              pollId: pollId,
              userId: decoded.userId
            },
            select: { optionId: true }
          });
          userVotes = votes.map(v => v.optionId);
        } catch (e) {
          // Not logged in or invalid token
        }
      }

      // Check if poll has ended
      const hasEnded = poll.endsAt && new Date() > new Date(poll.endsAt);

      // Format response
      const totalVotes = poll._count.votes;
      const options = poll.options.map(option => ({
        id: option.id,
        text: option.text,
        voteCount: option._count.votes,
        percentage: totalVotes > 0 ? Math.round((option._count.votes / totalVotes) * 100) : 0
      }));

      res.status(200).json({
        id: poll.id,
        question: poll.question,
        options,
        totalVotes,
        allowMultiple: poll.allowMultiple,
        showResults: poll.showResults,
        hasEnded,
        endsAt: poll.endsAt,
        userVotes,
        hasVoted: userVotes.length > 0,
        threadId: poll.thread.id
      });
    } catch (error) {
      console.error('Error fetching poll:', error);
      res.status(500).json({ error: 'Failed to fetch poll' });
    }
  }

  // POST - Vote on poll
  else if (req.method === 'POST') {
    try {
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({ error: 'Please log in to vote' });
      }

      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { optionIds } = req.body;

      if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
        return res.status(400).json({ error: 'Please select at least one option' });
      }

      // Get the poll
      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        include: {
          options: true
        }
      });

      if (!poll) {
        return res.status(404).json({ error: 'Poll not found' });
      }

      // Check if poll has ended
      if (poll.endsAt && new Date() > new Date(poll.endsAt)) {
        return res.status(400).json({ error: 'This poll has ended' });
      }

      // Check if multiple votes allowed
      if (!poll.allowMultiple && optionIds.length > 1) {
        return res.status(400).json({ error: 'This poll only allows one vote' });
      }

      // Validate option IDs
      const validOptionIds = poll.options.map(o => o.id);
      for (const optionId of optionIds) {
        if (!validOptionIds.includes(optionId)) {
          return res.status(400).json({ error: 'Invalid option selected' });
        }
      }

      // Check if user already voted
      const existingVotes = await prisma.pollVote.findMany({
        where: {
          pollId: pollId,
          userId: user.id
        }
      });

      if (existingVotes.length > 0) {
        return res.status(400).json({ error: 'You have already voted on this poll' });
      }

      // Create votes
      await prisma.pollVote.createMany({
        data: optionIds.map(optionId => ({
          pollId: pollId,
          optionId: optionId,
          userId: user.id
        }))
      });

      res.status(200).json({
        success: true,
        message: 'Vote recorded successfully'
      });
    } catch (error) {
      console.error('Error voting on poll:', error);
      res.status(500).json({ error: 'Failed to record vote' });
    }
  }

  // DELETE - Remove user's votes (change vote)
  else if (req.method === 'DELETE') {
    try {
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const decoded = verifyToken(token);

      // Get the poll to check if it allows changing votes
      const poll = await prisma.poll.findUnique({
        where: { id: pollId }
      });

      if (!poll) {
        return res.status(404).json({ error: 'Poll not found' });
      }

      // Check if poll has ended
      if (poll.endsAt && new Date() > new Date(poll.endsAt)) {
        return res.status(400).json({ error: 'Cannot change vote after poll has ended' });
      }

      // Delete user's votes
      await prisma.pollVote.deleteMany({
        where: {
          pollId: pollId,
          userId: decoded.userId
        }
      });

      res.status(200).json({
        success: true,
        message: 'Vote removed. You can now vote again.'
      });
    } catch (error) {
      console.error('Error removing vote:', error);
      res.status(500).json({ error: 'Failed to remove vote' });
    }
  }

  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
