-- Add missing User fields for commercial features
ALTER TABLE "User" ADD COLUMN "displayName" TEXT;
ALTER TABLE "User" ADD COLUMN "website" TEXT;
ALTER TABLE "User" ADD COLUMN "birthday" DATETIME;
ALTER TABLE "User" ADD COLUMN "isBanned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "banReason" TEXT;
ALTER TABLE "User" ADD COLUMN "banExpiresAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "threadCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "reputationPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "warningPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastActivity" DATETIME;
ALTER TABLE "User" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE "User" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "User" ADD COLUMN "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "showOnline" BOOLEAN NOT NULL DEFAULT true;

-- Add missing Subject fields
ALTER TABLE "Subject" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Subject" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Subject" ADD COLUMN "requiresApproval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subject" ADD COLUMN "canPost" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Subject" ADD COLUMN "canReply" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Subject" ADD COLUMN "guestPosting" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subject" ADD COLUMN "lastThreadId" INTEGER;
ALTER TABLE "Subject" ADD COLUMN "slug" TEXT;
ALTER TABLE "Subject" ADD COLUMN "metaDescription" TEXT;

-- Add missing Thread fields
ALTER TABLE "Thread" ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Thread" ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Thread" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Thread" ADD COLUMN "deletedBy" INTEGER;
ALTER TABLE "Thread" ADD COLUMN "postCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Thread" ADD COLUMN "replyCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Thread" ADD COLUMN "threadType" TEXT NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "Thread" ADD COLUMN "allowReplies" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Thread" ADD COLUMN "requireApproval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Thread" ADD COLUMN "slug" TEXT;
ALTER TABLE "Thread" ADD COLUMN "metaDescription" TEXT;
ALTER TABLE "Thread" ADD COLUMN "tags" TEXT;

-- Add missing Post fields
ALTER TABLE "Post" ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Post" ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Post" ADD COLUMN "deletedBy" INTEGER;
ALTER TABLE "Post" ADD COLUMN "editedAt" DATETIME;
ALTER TABLE "Post" ADD COLUMN "editedBy" INTEGER;
ALTER TABLE "Post" ADD COLUMN "editReason" TEXT;
ALTER TABLE "Post" ADD COLUMN "isFirstPost" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN "postNumber" INTEGER;
ALTER TABLE "Post" ADD COLUMN "contentRaw" TEXT;
ALTER TABLE "Post" ADD COLUMN "contentHtml" TEXT;
ALTER TABLE "Post" ADD COLUMN "attachments" TEXT;
ALTER TABLE "Post" ADD COLUMN "userPostCount" INTEGER;
ALTER TABLE "Post" ADD COLUMN "userJoinDate" DATETIME;
ALTER TABLE "Post" ADD COLUMN "userLocation" TEXT;
ALTER TABLE "Post" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "Post" ADD COLUMN "userAgent" TEXT;

-- CreateTable UserGroup
CREATE TABLE "UserGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "color" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "canPost" BOOLEAN NOT NULL DEFAULT true,
    "canReply" BOOLEAN NOT NULL DEFAULT true,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canModerate" BOOLEAN NOT NULL DEFAULT false,
    "canAdmin" BOOLEAN NOT NULL DEFAULT false,
    "canViewProfiles" BOOLEAN NOT NULL DEFAULT true,
    "canSendMessages" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable UserGroupMember
CREATE TABLE "UserGroupMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "UserGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable SubjectModerator
CREATE TABLE "SubjectModerator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" INTEGER NOT NULL,
    CONSTRAINT "SubjectModerator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SubjectModerator_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable ThreadSubscription
CREATE TABLE "ThreadSubscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "threadId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ThreadSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ThreadSubscription_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable PostReaction
CREATE TABLE "PostReaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable Report
CREATE TABLE "Report" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "threadId" INTEGER,
    "postId" INTEGER,
    "userId" INTEGER,
    "reportedById" INTEGER NOT NULL,
    "resolvedAt" DATETIME,
    "resolvedBy" INTEGER,
    "resolution" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Report_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGroupMember_userId_groupId_key" ON "UserGroupMember"("userId", "groupId");
CREATE UNIQUE INDEX "SubjectModerator_userId_subjectId_key" ON "SubjectModerator"("userId", "subjectId");
CREATE UNIQUE INDEX "ThreadSubscription_userId_threadId_key" ON "ThreadSubscription"("userId", "threadId");
CREATE UNIQUE INDEX "PostReaction_userId_postId_key" ON "PostReaction"("userId", "postId");

-- CreateIndex for performance
CREATE INDEX "Thread_subjectId_sticky_lastPostAt_idx" ON "Thread"("subjectId", "sticky", "lastPostAt");
CREATE INDEX "Thread_userId_idx" ON "Thread"("userId");
CREATE INDEX "Thread_slug_idx" ON "Thread"("slug");
CREATE INDEX "Post_threadId_postNumber_idx" ON "Post"("threadId", "postNumber");
CREATE INDEX "Post_userId_idx" ON "Post"("userId");
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX "Subject_categoryId_order_idx" ON "Subject"("categoryId", "order");
CREATE INDEX "Subject_slug_idx" ON "Subject"("slug");

-- Insert default user groups
INSERT INTO "UserGroup" ("name", "description", "color", "priority", "canPost", "canReply", "canEdit", "canDelete", "canModerate", "canAdmin", "isDefault") VALUES 
('Administrators', 'Full access to all forum features', '#dc3545', 100, true, true, true, true, true, true, false),
('Moderators', 'Can moderate posts and users', '#28a745', 50, true, true, true, true, true, false, false),
('Members', 'Regular forum members', '#007bff', 10, true, true, false, false, false, false, true);
