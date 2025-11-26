import prisma from './prisma';

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

/**
 * All available permissions in the system.
 * Grouped by category for easier management.
 */
export const PERMISSIONS = {
  // Content permissions
  POST_CREATE: 'post.create',
  POST_EDIT_OWN: 'post.edit.own',
  POST_EDIT_ANY: 'post.edit.any',
  POST_DELETE_OWN: 'post.delete.own',
  POST_DELETE_ANY: 'post.delete.any',

  THREAD_CREATE: 'thread.create',
  THREAD_EDIT_OWN: 'thread.edit.own',
  THREAD_EDIT_ANY: 'thread.edit.any',
  THREAD_DELETE_OWN: 'thread.delete.own',
  THREAD_DELETE_ANY: 'thread.delete.any',
  THREAD_LOCK: 'thread.lock',
  THREAD_PIN: 'thread.pin',
  THREAD_MOVE: 'thread.move',

  // User interactions
  REACTION_ADD: 'reaction.add',
  MESSAGE_SEND: 'message.send',
  PROFILE_VIEW: 'profile.view',
  PROFILE_EDIT_OWN: 'profile.edit.own',

  // Moderation permissions
  MOD_WARN_USER: 'mod.warn',
  MOD_BAN_USER: 'mod.ban',
  MOD_APPROVE_POSTS: 'mod.approve',
  MOD_VIEW_REPORTS: 'mod.reports.view',
  MOD_RESOLVE_REPORTS: 'mod.reports.resolve',
  MOD_VIEW_LOGS: 'mod.logs.view',
  MOD_IP_VIEW: 'mod.ip.view',

  // Admin permissions
  ADMIN_USERS: 'admin.users',
  ADMIN_GROUPS: 'admin.groups',
  ADMIN_FORUMS: 'admin.forums',
  ADMIN_SETTINGS: 'admin.settings',
  ADMIN_BACKUP: 'admin.backup',
  ADMIN_FULL: 'admin.full'
};

/**
 * Permission categories for UI organization
 */
export const PERMISSION_CATEGORIES = {
  content: {
    label: 'Content',
    description: 'Permissions for creating and managing posts and threads',
    permissions: [
      { key: 'canPost', label: 'Create Posts', description: 'Can create new posts/replies' },
      { key: 'canReply', label: 'Reply to Threads', description: 'Can reply to existing threads' },
      { key: 'canEdit', label: 'Edit Own Content', description: 'Can edit their own posts and threads' },
      { key: 'canDelete', label: 'Delete Own Content', description: 'Can delete their own posts and threads' },
      { key: 'canAttach', label: 'Upload Attachments', description: 'Can upload files and images' }
    ]
  },
  moderation: {
    label: 'Moderation',
    description: 'Permissions for moderating content and users',
    permissions: [
      { key: 'canModerate', label: 'Moderate Content', description: 'Can edit/delete any content, lock/pin threads' },
      { key: 'canWarn', label: 'Warn Users', description: 'Can issue warnings to users' },
      { key: 'canBan', label: 'Ban Users', description: 'Can ban/suspend users' },
      { key: 'canApprove', label: 'Approve Content', description: 'Can approve pending posts and registrations' },
      { key: 'canViewReports', label: 'View Reports', description: 'Can view reported content' }
    ]
  },
  admin: {
    label: 'Administration',
    description: 'Administrative permissions',
    permissions: [
      { key: 'canAdmin', label: 'Admin Access', description: 'Can access admin panel' },
      { key: 'canManageUsers', label: 'Manage Users', description: 'Can create, edit, and delete users' },
      { key: 'canManageGroups', label: 'Manage Groups', description: 'Can create and manage user groups' },
      { key: 'canManageForums', label: 'Manage Forums', description: 'Can create and manage forum categories' },
      { key: 'canManageSettings', label: 'Manage Settings', description: 'Can modify site settings' }
    ]
  },
  social: {
    label: 'Social',
    description: 'Social and communication permissions',
    permissions: [
      { key: 'canViewProfiles', label: 'View Profiles', description: 'Can view other user profiles' },
      { key: 'canSendMessages', label: 'Send Messages', description: 'Can send private messages' },
      { key: 'canReact', label: 'Add Reactions', description: 'Can react to posts' },
      { key: 'canMention', label: 'Mention Users', description: 'Can @mention other users' }
    ]
  }
};

// ============================================================================
// ROLE DEFAULTS
// ============================================================================

/**
 * Default permissions for each role.
 * These are baseline permissions that groups can extend.
 */
export const ROLE_DEFAULTS = {
  ADMIN: {
    canPost: true,
    canReply: true,
    canEdit: true,
    canDelete: true,
    canAttach: true,
    canModerate: true,
    canWarn: true,
    canBan: true,
    canApprove: true,
    canViewReports: true,
    canAdmin: true,
    canManageUsers: true,
    canManageGroups: true,
    canManageForums: true,
    canManageSettings: true,
    canViewProfiles: true,
    canSendMessages: true,
    canReact: true,
    canMention: true
  },
  MODERATOR: {
    canPost: true,
    canReply: true,
    canEdit: true,
    canDelete: true,
    canAttach: true,
    canModerate: true,
    canWarn: true,
    canBan: false,
    canApprove: true,
    canViewReports: true,
    canAdmin: false,
    canManageUsers: false,
    canManageGroups: false,
    canManageForums: false,
    canManageSettings: false,
    canViewProfiles: true,
    canSendMessages: true,
    canReact: true,
    canMention: true
  },
  USER: {
    canPost: true,
    canReply: true,
    canEdit: true,
    canDelete: false,
    canAttach: true,
    canModerate: false,
    canWarn: false,
    canBan: false,
    canApprove: false,
    canViewReports: false,
    canAdmin: false,
    canManageUsers: false,
    canManageGroups: false,
    canManageForums: false,
    canManageSettings: false,
    canViewProfiles: true,
    canSendMessages: true,
    canReact: true,
    canMention: true
  },
  GUEST: {
    canPost: false,
    canReply: false,
    canEdit: false,
    canDelete: false,
    canAttach: false,
    canModerate: false,
    canWarn: false,
    canBan: false,
    canApprove: false,
    canViewReports: false,
    canAdmin: false,
    canManageUsers: false,
    canManageGroups: false,
    canManageForums: false,
    canManageSettings: false,
    canViewProfiles: true,
    canSendMessages: false,
    canReact: false,
    canMention: false
  }
};

// ============================================================================
// PERMISSION CACHE
// ============================================================================

const permissionCache = new Map();
const CACHE_TTL = 60000; // 1 minute cache

function getCacheKey(userId, subjectId = null) {
  return `${userId}:${subjectId || 'global'}`;
}

function getCachedPermissions(userId, subjectId = null) {
  const key = getCacheKey(userId, subjectId);
  const cached = permissionCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }
  return null;
}

function setCachedPermissions(userId, subjectId, permissions) {
  const key = getCacheKey(userId, subjectId);
  permissionCache.set(key, {
    permissions,
    timestamp: Date.now()
  });
}

/**
 * Clear permission cache for a user or all users
 */
export function clearPermissionCache(userId = null) {
  if (userId) {
    // Clear all entries for this user
    for (const key of permissionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        permissionCache.delete(key);
      }
    }
  } else {
    permissionCache.clear();
  }
}

// ============================================================================
// PERMISSION RESOLUTION
// ============================================================================

/**
 * Get all permissions for a user, optionally scoped to a subject.
 * Combines role defaults + group permissions + subject moderator status.
 *
 * @param {number} userId - The user ID
 * @param {number|null} subjectId - Optional subject ID for forum-specific permissions
 * @param {string} role - The user's role (USER, MODERATOR, ADMIN)
 * @returns {Promise<Object>} - Complete permissions object
 */
export async function getUserPermissions(userId, subjectId = null, role = 'USER') {
  // Check cache first
  const cached = getCachedPermissions(userId, subjectId);
  if (cached) {
    return cached;
  }

  // Start with role defaults
  const base = { ...(ROLE_DEFAULTS[role] || ROLE_DEFAULTS.USER) };
  const permissions = { ...base };

  try {
    // Get user's group memberships with group details
    const memberships = await prisma.userGroupMember.findMany({
      where: { userId },
      include: {
        group: true
      },
      orderBy: {
        group: { priority: 'desc' }
      }
    });

    // Merge group permissions (higher priority groups override)
    for (const membership of memberships) {
      const group = membership.group;
      // Groups can grant permissions (OR logic for grants)
      if (group.canPost) permissions.canPost = true;
      if (group.canReply) permissions.canReply = true;
      if (group.canEdit) permissions.canEdit = true;
      if (group.canDelete) permissions.canDelete = true;
      if (group.canModerate) permissions.canModerate = true;
      if (group.canAdmin) permissions.canAdmin = true;
      if (group.canViewProfiles) permissions.canViewProfiles = true;
      if (group.canSendMessages) permissions.canSendMessages = true;
    }

    // Check if user is a subject moderator for the given subject
    if (subjectId && userId) {
      const subjectMod = await prisma.subjectModerator.findFirst({
        where: { userId, subjectId }
      });

      if (subjectMod) {
        permissions.canModerate = true;
        permissions.canPost = true;
        permissions.canReply = true;
        permissions.canEdit = true;
        permissions.canDelete = true;
        permissions.canApprove = true;
        permissions.canViewReports = true;
        permissions.isSubjectModerator = true;
      }

      // Check forum-level group permissions (ACL)
      if (memberships.length > 0) {
        const groupIds = memberships.map(m => m.group.id);
        const forumPerms = await prisma.subjectGroupPermission.findMany({
          where: {
            subjectId,
            groupId: { in: groupIds }
          }
        });

        // If there are custom forum permissions, apply them
        if (forumPerms.length > 0) {
          // Start with most restrictive, then grant based on any group permission
          let forumCanView = false;
          let forumCanPost = false;
          let forumCanReply = false;

          for (const fp of forumPerms) {
            if (fp.canView) forumCanView = true;
            if (fp.canPost) forumCanPost = true;
            if (fp.canReply) forumCanReply = true;
          }

          // Apply forum-level restrictions (these can restrict but not grant beyond group perms)
          permissions.forumCanView = forumCanView;
          permissions.forumCanPost = forumCanPost && permissions.canPost;
          permissions.forumCanReply = forumCanReply && permissions.canReply;
          permissions.hasForumRestrictions = true;
        }
      }
    }

    // Add metadata
    permissions.userId = userId;
    permissions.role = role;
    permissions.groups = memberships.map(m => ({
      id: m.group.id,
      name: m.group.name,
      color: m.group.color,
      priority: m.group.priority
    }));

  } catch (err) {
    console.error('Permission resolution failed:', err);
  }

  // Cache the result
  setCachedPermissions(userId, subjectId, permissions);

  return permissions;
}

/**
 * Check if a user has a specific permission
 *
 * @param {number} userId - The user ID
 * @param {string} permission - The permission key (e.g., 'canPost', 'canModerate')
 * @param {number|null} subjectId - Optional subject ID for forum-specific checks
 * @param {string} role - The user's role
 * @returns {Promise<boolean>}
 */
export async function hasPermission(userId, permission, subjectId = null, role = 'USER') {
  const permissions = await getUserPermissions(userId, subjectId, role);
  return !!permissions[permission];
}

/**
 * Check multiple permissions at once
 *
 * @param {number} userId
 * @param {string[]} permissionKeys - Array of permission keys to check
 * @param {number|null} subjectId
 * @param {string} role
 * @returns {Promise<Object>} - Object with each permission key mapped to boolean
 */
export async function hasPermissions(userId, permissionKeys, subjectId = null, role = 'USER') {
  const permissions = await getUserPermissions(userId, subjectId, role);
  const result = {};
  for (const key of permissionKeys) {
    result[key] = !!permissions[key];
  }
  return result;
}

/**
 * Check if user can perform an action on a specific resource
 * Handles ownership checks for "own" vs "any" permissions
 *
 * @param {number} userId - The acting user
 * @param {string} action - Action type (e.g., 'edit', 'delete')
 * @param {string} resourceType - Resource type (e.g., 'post', 'thread')
 * @param {number} resourceOwnerId - The owner of the resource
 * @param {number|null} subjectId - Optional subject ID
 * @param {string} role - User's role
 * @returns {Promise<boolean>}
 */
export async function canPerformAction(userId, action, resourceType, resourceOwnerId, subjectId = null, role = 'USER') {
  const permissions = await getUserPermissions(userId, subjectId, role);

  const isOwner = userId === resourceOwnerId;

  // Map actions to permission keys
  const permissionMap = {
    edit: isOwner ? 'canEdit' : 'canModerate',
    delete: isOwner ? (permissions.canDelete ? 'canDelete' : 'canModerate') : 'canModerate',
    lock: 'canModerate',
    pin: 'canModerate',
    move: 'canModerate',
    approve: 'canApprove'
  };

  const requiredPermission = permissionMap[action];
  if (!requiredPermission) {
    console.warn(`Unknown action: ${action}`);
    return false;
  }

  return !!permissions[requiredPermission];
}

/**
 * Get user's highest priority group for display purposes
 */
export async function getPrimaryGroup(userId) {
  try {
    const membership = await prisma.userGroupMember.findFirst({
      where: { userId },
      include: { group: true },
      orderBy: { group: { priority: 'desc' } }
    });
    return membership?.group || null;
  } catch (err) {
    console.error('Error getting primary group:', err);
    return null;
  }
}

/**
 * Get all groups for a user
 */
export async function getUserGroups(userId) {
  try {
    const memberships = await prisma.userGroupMember.findMany({
      where: { userId },
      include: { group: true },
      orderBy: { group: { priority: 'desc' } }
    });
    return memberships.map(m => m.group);
  } catch (err) {
    console.error('Error getting user groups:', err);
    return [];
  }
}

// ============================================================================
// PERMISSION CHECKS FOR COMMON ACTIONS (Convenience functions)
// ============================================================================

export async function canCreateThread(userId, subjectId, role = 'USER') {
  return hasPermission(userId, 'canPost', subjectId, role);
}

export async function canReplyToThread(userId, subjectId, role = 'USER') {
  return hasPermission(userId, 'canReply', subjectId, role);
}

export async function canModerateSubject(userId, subjectId, role = 'USER') {
  return hasPermission(userId, 'canModerate', subjectId, role);
}

export async function canAccessAdmin(userId, role = 'USER') {
  return hasPermission(userId, 'canAdmin', null, role);
}

export async function canManageUsers(userId, role = 'USER') {
  const permissions = await getUserPermissions(userId, null, role);
  return permissions.canAdmin && permissions.canManageUsers;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  PERMISSIONS,
  PERMISSION_CATEGORIES,
  ROLE_DEFAULTS,
  getUserPermissions,
  hasPermission,
  hasPermissions,
  canPerformAction,
  clearPermissionCache,
  getPrimaryGroup,
  getUserGroups,
  canCreateThread,
  canReplyToThread,
  canModerateSubject,
  canAccessAdmin,
  canManageUsers
};
