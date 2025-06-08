-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ThreadType" AS ENUM ('NORMAL', 'ANNOUNCEMENT', 'STICKY', 'POLL');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'DISLIKE', 'LOVE', 'LAUGH', 'ANGRY', 'SAD');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('THREAD_REPLY', 'POST_REPLY', 'POST_MENTION', 'POST_LIKE', 'THREAD_SUBSCRIBE', 'PRIVATE_MESSAGE', 'FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'MODERATION_ACTION', 'SYSTEM_ALERT', 'WARNING_RECEIVED', 'REPUTATION_CHANGE');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MessagePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MessageContentType" AS ENUM ('TEXT', 'HTML', 'MARKDOWN');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bio" TEXT,
    "avatar" TEXT,
    "location" TEXT,
    "signature" TEXT,
    "website" TEXT,
    "birthday" TIMESTAMP(3),
    "displayName" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "banExpiresAt" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "threadCount" INTEGER NOT NULL DEFAULT 0,
    "reputationPoints" INTEGER NOT NULL DEFAULT 0,
    "warningPoints" INTEGER NOT NULL DEFAULT 0,
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),
    "lastActivity" TIMESTAMP(3),
    "ipAddress" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "language" TEXT NOT NULL DEFAULT 'en',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "showOnline" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "canPost" BOOLEAN NOT NULL DEFAULT true,
    "canReply" BOOLEAN NOT NULL DEFAULT true,
    "guestPosting" BOOLEAN NOT NULL DEFAULT false,
    "threadCount" INTEGER NOT NULL DEFAULT 0,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "lastPost" TIMESTAMP(3),
    "lastPostUserId" INTEGER,
    "lastThreadId" INTEGER,
    "slug" TEXT,
    "metaDescription" TEXT,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thread" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "sticky" BOOLEAN NOT NULL DEFAULT false,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "lastPostAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPostUserId" INTEGER,
    "threadType" "ThreadType" NOT NULL DEFAULT 'NORMAL',
    "allowReplies" BOOLEAN NOT NULL DEFAULT true,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT,
    "metaDescription" TEXT,
    "tags" TEXT,
    "userId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "editedAt" TIMESTAMP(3),
    "editedBy" INTEGER,
    "editReason" TEXT,
    "isFirstPost" BOOLEAN NOT NULL DEFAULT false,
    "postNumber" INTEGER,
    "contentRaw" TEXT,
    "contentHtml" TEXT,
    "attachments" TEXT,
    "userPostCount" INTEGER,
    "userJoinDate" TIMESTAMP(3),
    "userLocation" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" INTEGER NOT NULL,
    "threadId" INTEGER NOT NULL,
    "replyToId" INTEGER,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "priority" "MessagePriority" NOT NULL DEFAULT 'NORMAL',
    "conversationId" TEXT,
    "replyToId" INTEGER,
    "attachments" TEXT,
    "contentType" "MessageContentType" NOT NULL DEFAULT 'TEXT',
    "senderId" INTEGER NOT NULL,
    "recipientId" INTEGER NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "actionUrl" TEXT,
    "actionData" TEXT,
    "relatedType" TEXT,
    "relatedId" INTEGER,
    "triggeredById" INTEGER,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "type" TEXT NOT NULL DEFAULT 'string',
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "isInstalled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeSettings" (
    "id" SERIAL NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT 'NextJS Forum',
    "logoUrl" TEXT,
    "faviconUrl" TEXT DEFAULT '/favicon.ico',
    "siteDescription" TEXT DEFAULT 'A modern forum built with Next.js',
    "footerText" TEXT DEFAULT 'Powered by NextJS Forum',
    "primaryColor" TEXT NOT NULL DEFAULT '#2B4F81',
    "secondaryColor" TEXT NOT NULL DEFAULT '#4C76B2',
    "backgroundColor" TEXT NOT NULL DEFAULT '#E0E8F5',
    "textColor" TEXT NOT NULL DEFAULT '#000000',
    "linkColor" TEXT NOT NULL DEFAULT '#006699',
    "linkHoverColor" TEXT NOT NULL DEFAULT '#0088CC',
    "headerBackground" TEXT NOT NULL DEFAULT '#2B4F81',
    "headerText" TEXT NOT NULL DEFAULT '#FFFFFF',
    "navbarBackground" TEXT NOT NULL DEFAULT '#4C76B2',
    "navbarText" TEXT NOT NULL DEFAULT '#FFFFFF',
    "categoryHeaderBackground" TEXT NOT NULL DEFAULT '#738FBF',
    "categoryHeaderText" TEXT NOT NULL DEFAULT '#FFFFFF',
    "subjectHeaderBackground" TEXT NOT NULL DEFAULT '#DEE4F2',
    "subjectHeaderText" TEXT NOT NULL DEFAULT '#000000',
    "threadBackground" TEXT NOT NULL DEFAULT '#FFFFFF',
    "threadAltBackground" TEXT NOT NULL DEFAULT '#F5F5FF',
    "threadHoverBackground" TEXT NOT NULL DEFAULT '#E8EFFD',
    "postHeaderBackground" TEXT NOT NULL DEFAULT '#DEE4F2',
    "postBodyBackground" TEXT NOT NULL DEFAULT '#FFFFFF',
    "postFooterBackground" TEXT NOT NULL DEFAULT '#F5F5FF',
    "sidebarBackground" TEXT NOT NULL DEFAULT '#E0E8F5',
    "borderColor" TEXT NOT NULL DEFAULT '#94A3C4',
    "buttonBackground" TEXT NOT NULL DEFAULT '#4C76B2',
    "buttonText" TEXT NOT NULL DEFAULT '#FFFFFF',
    "buttonHoverBackground" TEXT NOT NULL DEFAULT '#0088CC',
    "inputBackground" TEXT NOT NULL DEFAULT '#FFFFFF',
    "inputText" TEXT NOT NULL DEFAULT '#000000',
    "inputBorderColor" TEXT NOT NULL DEFAULT '#94A3C4',
    "buttonRadius" TEXT NOT NULL DEFAULT '0px',
    "cardRadius" TEXT NOT NULL DEFAULT '0px',
    "fontSize" TEXT NOT NULL DEFAULT '13px',
    "fontFamily" TEXT NOT NULL DEFAULT 'Verdana, Arial, sans-serif',
    "enableDarkMode" BOOLEAN NOT NULL DEFAULT false,
    "compactMode" BOOLEAN NOT NULL DEFAULT false,
    "showAvatars" BOOLEAN NOT NULL DEFAULT true,
    "showSignatures" BOOLEAN NOT NULL DEFAULT true,
    "threadsPerPage" INTEGER NOT NULL DEFAULT 20,
    "postsPerPage" INTEGER NOT NULL DEFAULT 10,
    "customCSS" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationStatus" (
    "id" SERIAL NOT NULL,
    "isInstalled" BOOLEAN NOT NULL DEFAULT false,
    "installationStep" INTEGER NOT NULL DEFAULT 0,
    "dbConfigured" BOOLEAN NOT NULL DEFAULT false,
    "adminCreated" BOOLEAN NOT NULL DEFAULT false,
    "siteConfigured" BOOLEAN NOT NULL DEFAULT false,
    "forumsCreated" BOOLEAN NOT NULL DEFAULT false,
    "installationDate" TIMESTAMP(3),
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallationStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGroupMember" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectModerator" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" INTEGER NOT NULL,

    CONSTRAINT "SubjectModerator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadSubscription" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "threadId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostReaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "threadId" INTEGER,
    "postId" INTEGER,
    "userId" INTEGER,
    "reportedById" INTEGER NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" INTEGER,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationLog" (
    "id" SERIAL NOT NULL,
    "moderatorId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_settings" (
    "id" SERIAL NOT NULL,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "newUserPostCount" INTEGER NOT NULL DEFAULT 5,
    "autoModeration" BOOLEAN NOT NULL DEFAULT false,
    "profanityFilter" BOOLEAN NOT NULL DEFAULT false,
    "spamDetection" BOOLEAN NOT NULL DEFAULT false,
    "linkModeration" BOOLEAN NOT NULL DEFAULT false,
    "imageModeration" BOOLEAN NOT NULL DEFAULT false,
    "reportThreshold" INTEGER NOT NULL DEFAULT 3,
    "autoLockReports" BOOLEAN NOT NULL DEFAULT false,
    "moderationQueue" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "bannedWords" TEXT,
    "allowedDomains" TEXT,
    "trustedUserPostCount" INTEGER NOT NULL DEFAULT 50,
    "autoApproveImages" BOOLEAN NOT NULL DEFAULT false,
    "maxLinksPerPost" INTEGER NOT NULL DEFAULT 3,
    "minPostLength" INTEGER NOT NULL DEFAULT 10,
    "maxPostLength" INTEGER NOT NULL DEFAULT 10000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "emailThreadReply" BOOLEAN NOT NULL DEFAULT true,
    "emailPostReply" BOOLEAN NOT NULL DEFAULT true,
    "emailMentions" BOOLEAN NOT NULL DEFAULT true,
    "emailMessages" BOOLEAN NOT NULL DEFAULT true,
    "emailModeration" BOOLEAN NOT NULL DEFAULT true,
    "emailSystem" BOOLEAN NOT NULL DEFAULT true,
    "browserThreadReply" BOOLEAN NOT NULL DEFAULT true,
    "browserPostReply" BOOLEAN NOT NULL DEFAULT true,
    "browserMentions" BOOLEAN NOT NULL DEFAULT true,
    "browserMessages" BOOLEAN NOT NULL DEFAULT true,
    "browserModeration" BOOLEAN NOT NULL DEFAULT true,
    "browserSystem" BOOLEAN NOT NULL DEFAULT true,
    "emailDigest" BOOLEAN NOT NULL DEFAULT false,
    "digestFrequency" TEXT NOT NULL DEFAULT 'daily',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" INTEGER NOT NULL,
    "isOrphaned" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostImage" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "imageId" INTEGER NOT NULL,

    CONSTRAINT "PostImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadImage" (
    "id" SERIAL NOT NULL,
    "threadId" INTEGER NOT NULL,
    "imageId" INTEGER NOT NULL,

    CONSTRAINT "ThreadImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Subject_categoryId_order_idx" ON "Subject"("categoryId", "order");

-- CreateIndex
CREATE INDEX "Subject_slug_idx" ON "Subject"("slug");

-- CreateIndex
CREATE INDEX "Thread_subjectId_sticky_lastPostAt_idx" ON "Thread"("subjectId", "sticky", "lastPostAt");

-- CreateIndex
CREATE INDEX "Thread_userId_idx" ON "Thread"("userId");

-- CreateIndex
CREATE INDEX "Thread_slug_idx" ON "Thread"("slug");

-- CreateIndex
CREATE INDEX "Post_threadId_postNumber_idx" ON "Post"("threadId", "postNumber");

-- CreateIndex
CREATE INDEX "Post_userId_idx" ON "Post"("userId");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_senderId_createdAt_idx" ON "messages"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_recipientId_createdAt_idx" ON "messages"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_type_createdAt_idx" ON "notifications"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSettings_key_key" ON "SiteSettings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "UserGroup_name_key" ON "UserGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserGroupMember_userId_groupId_key" ON "UserGroupMember"("userId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectModerator_userId_subjectId_key" ON "SubjectModerator"("userId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadSubscription_userId_threadId_key" ON "ThreadSubscription"("userId", "threadId");

-- CreateIndex
CREATE UNIQUE INDEX "PostReaction_userId_postId_key" ON "PostReaction"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Image_filename_key" ON "Image"("filename");

-- CreateIndex
CREATE INDEX "Image_uploadedBy_idx" ON "Image"("uploadedBy");

-- CreateIndex
CREATE INDEX "Image_isOrphaned_idx" ON "Image"("isOrphaned");

-- CreateIndex
CREATE INDEX "Image_uploadedAt_idx" ON "Image"("uploadedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PostImage_postId_imageId_key" ON "PostImage"("postId", "imageId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadImage_threadId_imageId_key" ON "ThreadImage"("threadId", "imageId");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroupMember" ADD CONSTRAINT "UserGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "UserGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroupMember" ADD CONSTRAINT "UserGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectModerator" ADD CONSTRAINT "SubjectModerator_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectModerator" ADD CONSTRAINT "SubjectModerator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadSubscription" ADD CONSTRAINT "ThreadSubscription_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadSubscription" ADD CONSTRAINT "ThreadSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostImage" ADD CONSTRAINT "PostImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostImage" ADD CONSTRAINT "PostImage_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadImage" ADD CONSTRAINT "ThreadImage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadImage" ADD CONSTRAINT "ThreadImage_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
