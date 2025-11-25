import { jest } from '@jest/globals';

const mockPrefs = {
  browserThreadReply: true,
  browserPostReply: true,
  browserMentions: false, // disable mentions to test skip
  browserMessages: true,
  browserModeration: true,
  browserSystem: true
};

jest.unstable_mockModule('../lib/prisma', () => ({
  default: {
    notificationPreferences: {
      findUnique: jest.fn().mockResolvedValue(mockPrefs)
    },
    notification: {
      create: jest.fn().mockResolvedValue({ id: 1 })
    }
  },
  __esModule: true
}));

const prisma = (await import('../lib/prisma')).default;
const { createNotification, extractMentions } = await import('../lib/notifications.js');

describe('notifications', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('skips creation when prefs disable type', async () => {
    const result = await createNotification({
      userId: 10,
      type: 'POST_MENTION', // disabled above
      title: 'Mention',
      content: 'You were mentioned'
    });
    expect(result).toBeNull();
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('creates notification when allowed', async () => {
    const result = await createNotification({
      userId: 10,
      type: 'THREAD_REPLY',
      title: 'Reply',
      content: 'New reply'
    });
    expect(prisma.notification.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 1 });
  });

  it('extracts unique mentions', () => {
    const mentions = extractMentions('Hello @alice and @bob and @alice');
    expect(mentions).toEqual(['alice', 'bob']);
  });

  it('allows creation when preferences are missing (fallback)', async () => {
    prisma.notificationPreferences.findUnique.mockResolvedValue(null);
    const result = await createNotification({
      userId: 11,
      type: 'SYSTEM_ALERT',
      title: 'Alert',
      content: 'Test'
    });
    expect(prisma.notification.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 1 });
  });
});
