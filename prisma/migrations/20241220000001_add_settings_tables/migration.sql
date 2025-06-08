-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL UNIQUE,
    "value" TEXT,
    "type" TEXT NOT NULL DEFAULT 'string',
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "isInstalled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ThemeSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "siteName" TEXT NOT NULL DEFAULT 'NextJS Forum',
    "logoUrl" TEXT,
    "faviconUrl" TEXT DEFAULT '/favicon.ico',
    "siteDescription" TEXT DEFAULT 'A modern forum built with Next.js',
    "footerText" TEXT DEFAULT 'Powered by NextJS Forum',
    
    -- Colors
    "primaryColor" TEXT NOT NULL DEFAULT '#2B4F81',
    "secondaryColor" TEXT NOT NULL DEFAULT '#4C76B2',
    "backgroundColor" TEXT NOT NULL DEFAULT '#E0E8F5',
    "textColor" TEXT NOT NULL DEFAULT '#000000',
    "linkColor" TEXT NOT NULL DEFAULT '#006699',
    "linkHoverColor" TEXT NOT NULL DEFAULT '#0088CC',
    
    -- Header & Navigation
    "headerBackground" TEXT NOT NULL DEFAULT '#2B4F81',
    "headerText" TEXT NOT NULL DEFAULT '#FFFFFF',
    "navbarBackground" TEXT NOT NULL DEFAULT '#4C76B2',
    "navbarText" TEXT NOT NULL DEFAULT '#FFFFFF',
    
    -- Forum Elements
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
    
    -- Buttons & Forms
    "buttonBackground" TEXT NOT NULL DEFAULT '#4C76B2',
    "buttonText" TEXT NOT NULL DEFAULT '#FFFFFF',
    "buttonHoverBackground" TEXT NOT NULL DEFAULT '#0088CC',
    "inputBackground" TEXT NOT NULL DEFAULT '#FFFFFF',
    "inputText" TEXT NOT NULL DEFAULT '#000000',
    "inputBorderColor" TEXT NOT NULL DEFAULT '#94A3C4',
    
    -- Layout
    "buttonRadius" TEXT NOT NULL DEFAULT '0px',
    "cardRadius" TEXT NOT NULL DEFAULT '0px',
    "fontSize" TEXT NOT NULL DEFAULT '13px',
    "fontFamily" TEXT NOT NULL DEFAULT 'Verdana, Arial, sans-serif',
    
    -- Features
    "enableDarkMode" BOOLEAN NOT NULL DEFAULT false,
    "compactMode" BOOLEAN NOT NULL DEFAULT false,
    "showAvatars" BOOLEAN NOT NULL DEFAULT true,
    "showSignatures" BOOLEAN NOT NULL DEFAULT true,
    "threadsPerPage" INTEGER NOT NULL DEFAULT 20,
    "postsPerPage" INTEGER NOT NULL DEFAULT 10,
    
    -- Custom
    "customCSS" TEXT,
    
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InstallationStatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "isInstalled" BOOLEAN NOT NULL DEFAULT false,
    "installationStep" INTEGER NOT NULL DEFAULT 0,
    "dbConfigured" BOOLEAN NOT NULL DEFAULT false,
    "adminCreated" BOOLEAN NOT NULL DEFAULT false,
    "siteConfigured" BOOLEAN NOT NULL DEFAULT false,
    "forumsCreated" BOOLEAN NOT NULL DEFAULT false,
    "installationDate" DATETIME,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Insert default installation status
INSERT INTO "InstallationStatus" ("isInstalled", "installationStep") VALUES (false, 0);

-- Insert default theme settings
INSERT INTO "ThemeSettings" ("siteName") VALUES ('NextJS Forum');

-- Insert default site settings
INSERT INTO "SiteSettings" ("key", "value", "type", "category", "description") VALUES 
('site_name', 'NextJS Forum', 'string', 'general', 'The name of your forum'),
('site_description', 'A modern forum built with Next.js', 'string', 'general', 'Description of your forum'),
('admin_email', '', 'string', 'general', 'Administrator email address'),
('registration_enabled', 'true', 'boolean', 'users', 'Allow new user registrations'),
('email_verification', 'false', 'boolean', 'users', 'Require email verification for new users'),
('guest_posting', 'false', 'boolean', 'permissions', 'Allow guests to post'),
('maintenance_mode', 'false', 'boolean', 'general', 'Enable maintenance mode'),
('maintenance_message', 'The forum is currently under maintenance. Please check back later.', 'string', 'general', 'Message shown during maintenance'),
('max_upload_size', '5', 'number', 'uploads', 'Maximum file upload size in MB'),
('allowed_file_types', 'jpg,jpeg,png,gif,pdf,doc,docx', 'string', 'uploads', 'Allowed file extensions'),
('timezone', 'UTC', 'string', 'general', 'Default timezone'),
('date_format', 'YYYY-MM-DD', 'string', 'general', 'Date format'),
('time_format', '24', 'string', 'general', '12 or 24 hour time format');
