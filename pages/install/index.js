import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../../styles/Install.module.css';

const InstallWizard = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0); // 0 = requirements check
  const [installationData, setInstallationData] = useState({
    // Database Configuration
    dbType: 'sqlite',
    dbHost: 'localhost',
    dbPort: '5432',
    dbName: 'nextjs_forum',
    dbUser: '',
    dbPassword: '',

    // Admin Account
    adminUsername: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',

    // Site Configuration
    siteName: 'NextJS Forum',
    siteDescription: 'A modern forum built with Next.js',
    adminEmailContact: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',

    // Forum Structure
    createSampleData: true,
    defaultCategories: [
      { name: 'General Discussion', description: 'General topics and discussions' },
      { name: 'Support', description: 'Get help and support' },
      { name: 'Announcements', description: 'Important announcements' }
    ]
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [stepProgress, setStepProgress] = useState('');
  const [installationStatus, setInstallationStatus] = useState(null);
  const [systemRequirements, setSystemRequirements] = useState(null);

  const checkInstallationStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/install/status');
      const data = await res.json();

      if (data.isInstalled) {
        router.push('/');
        return;
      }

      setInstallationStatus(data);
      setSystemRequirements(data.requirements);

      // If database is connected and steps were started, resume from last step
      if (data.dbConnected && data.installationStep > 1) {
        setCurrentStep(data.installationStep);
      } else {
        setCurrentStep(0); // Start with requirements check
      }
    } catch (error) {
      console.error('Error checking installation status:', error);
      setErrors({ general: 'Unable to connect to the server. Please check if the application is running correctly.' });
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkInstallationStatus();
  }, [checkInstallationStatus]);

  const validateStep = (step) => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;

    switch (step) {
      case 0: // Requirements check - always valid
        break;

      case 1: // Database Configuration
        if (installationData.dbType !== 'sqlite') {
          if (!installationData.dbHost?.trim()) newErrors.dbHost = 'Database host is required';
          if (!installationData.dbName?.trim()) newErrors.dbName = 'Database name is required';
          if (!installationData.dbUser?.trim()) newErrors.dbUser = 'Database user is required';
          if (installationData.dbPort && !/^\d+$/.test(installationData.dbPort)) {
            newErrors.dbPort = 'Port must be a number';
          }
        }
        break;

      case 2: // Admin Account - Strict validation
        if (!installationData.adminUsername?.trim()) {
          newErrors.adminUsername = 'Admin username is required';
        } else if (installationData.adminUsername.length < 3) {
          newErrors.adminUsername = 'Username must be at least 3 characters';
        } else if (installationData.adminUsername.length > 30) {
          newErrors.adminUsername = 'Username must be at most 30 characters';
        } else if (!usernameRegex.test(installationData.adminUsername)) {
          newErrors.adminUsername = 'Username can only contain letters, numbers, underscores, and hyphens';
        }

        if (!installationData.adminEmail?.trim()) {
          newErrors.adminEmail = 'Admin email is required';
        } else if (!emailRegex.test(installationData.adminEmail)) {
          newErrors.adminEmail = 'Please enter a valid email address';
        }

        if (!installationData.adminPassword) {
          newErrors.adminPassword = 'Admin password is required';
        } else {
          if (installationData.adminPassword.length < 8) {
            newErrors.adminPassword = 'Password must be at least 8 characters';
          } else if (!/[A-Z]/.test(installationData.adminPassword)) {
            newErrors.adminPassword = 'Password must contain at least one uppercase letter';
          } else if (!/[a-z]/.test(installationData.adminPassword)) {
            newErrors.adminPassword = 'Password must contain at least one lowercase letter';
          } else if (!/[0-9]/.test(installationData.adminPassword)) {
            newErrors.adminPassword = 'Password must contain at least one number';
          } else if (!/[^A-Za-z0-9]/.test(installationData.adminPassword)) {
            newErrors.adminPassword = 'Password must contain at least one special character';
          }
        }

        if (installationData.adminPassword !== installationData.adminPasswordConfirm) {
          newErrors.adminPasswordConfirm = 'Passwords do not match';
        }
        break;

      case 3: // Site Configuration
        if (!installationData.siteName?.trim()) {
          newErrors.siteName = 'Site name is required';
        } else if (installationData.siteName.length < 2) {
          newErrors.siteName = 'Site name must be at least 2 characters';
        } else if (/<|>/.test(installationData.siteName)) {
          newErrors.siteName = 'Site name cannot contain < or >';
        }

        if (!installationData.adminEmailContact?.trim()) {
          newErrors.adminEmailContact = 'Contact email is required';
        } else if (!emailRegex.test(installationData.adminEmailContact)) {
          newErrors.adminEmailContact = 'Please enter a valid email address';
        }
        break;

      case 4: // Forum Structure - no required fields
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setInstallationData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const nextStep = async () => {
    // Clear previous errors
    setErrors({});

    // Step 0 is requirements check, just proceed
    if (currentStep === 0) {
      setCurrentStep(1);
      return;
    }

    if (!validateStep(currentStep)) {
      return;
    }

    setIsLoading(true);
    setStepProgress('Processing...');

    try {
      // Save current step data
      const res = await fetch('/api/install/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: currentStep,
          data: installationData
        })
      });

      const result = await res.json();

      if (!res.ok) {
        // Handle specific error codes
        if (result.code === 'ALREADY_INSTALLED') {
          router.push('/');
          return;
        }

        // Handle validation errors
        if (result.errors && Array.isArray(result.errors)) {
          const fieldErrors = {};
          result.errors.forEach(err => {
            fieldErrors[err.field] = err.message;
          });
          setErrors(fieldErrors);
          return;
        }

        throw new Error(result.message || 'Installation step failed');
      }

      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        // Final step - complete installation
        await completeInstallation();
      }
    } catch (error) {
      console.error('Installation step error:', error);
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
      setStepProgress('');
    }
  };

  const completeInstallation = async () => {
    setIsLoading(true);
    setStepProgress('Completing installation...');

    try {
      const res = await fetch('/api/install/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(installationData)
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.code === 'ALREADY_INSTALLED') {
          router.push('/');
          return;
        }
        throw new Error(result.message || 'Installation failed');
      }

      // Redirect to login page
      router.push('/login?message=Installation completed successfully! Please log in with your admin account.');
    } catch (error) {
      console.error('Installation completion error:', error);
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
      setStepProgress('');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const steps = [
    { number: 0, title: 'Requirements', description: 'System requirements check' },
    { number: 1, title: 'Database', description: 'Configure database' },
    { number: 2, title: 'Admin Account', description: 'Create admin user' },
    { number: 3, title: 'Site Config', description: 'Forum settings' },
    { number: 4, title: 'Structure', description: 'Categories & forums' },
    { number: 5, title: 'Complete', description: 'Finalize' }
  ];

  // Show loading screen while checking status
  if (isLoading && currentStep === 0 && !systemRequirements) {
    return (
      <>
        <Head>
          <title>NextJS Forum Installation</title>
          <meta name="description" content="Install NextJS Forum" />
        </Head>
        <div className={styles.container}>
          <div className={styles.wizard}>
            <div className={styles.header}>
              <h1>NextJS Forum Installation</h1>
              <p>Checking system requirements...</p>
            </div>
            <div className={styles.stepForm}>
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner}></div>
                <p>Please wait...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>NextJS Forum Installation - Step {currentStep + 1}</title>
        <meta name="description" content="Install NextJS Forum" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className={styles.container}>
        <div className={styles.wizard}>
          <div className={styles.header}>
            <h1>NextJS Forum Installation</h1>
            <p>Welcome! Let's set up your new forum in just a few steps.</p>
          </div>

          {/* Progress Steps */}
          <div className={styles.steps}>
            {steps.map((step) => (
              <div
                key={step.number}
                className={`${styles.step} ${
                  step.number === currentStep ? styles.active :
                  step.number < currentStep ? styles.completed : ''
                }`}
              >
                <div className={styles.stepNumber}>
                  {step.number < currentStep ? '✓' : step.number + 1}
                </div>
                <div className={styles.stepInfo}>
                  <div className={styles.stepTitle}>{step.title}</div>
                  <div className={styles.stepDescription}>{step.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Error Display */}
          {errors.general && (
            <div className={styles.error}>
              <strong>Error:</strong> {errors.general}
            </div>
          )}

          {/* Loading Progress */}
          {isLoading && stepProgress && (
            <div className={styles.progressBar}>
              <div className={styles.progressText}>{stepProgress}</div>
              <div className={styles.progressIndicator}></div>
            </div>
          )}

          {/* Step Content */}
          <div className={styles.stepContent}>
            {currentStep === 0 && (
              <RequirementsStep
                requirements={systemRequirements}
                installationStatus={installationStatus}
              />
            )}

            {currentStep === 1 && (
              <DatabaseStep
                data={installationData}
                errors={errors}
                onChange={handleInputChange}
              />
            )}
            
            {currentStep === 2 && (
              <AdminStep 
                data={installationData}
                errors={errors}
                onChange={handleInputChange}
              />
            )}
            
            {currentStep === 3 && (
              <SiteConfigStep 
                data={installationData}
                errors={errors}
                onChange={handleInputChange}
              />
            )}
            
            {currentStep === 4 && (
              <ForumStructureStep
                data={installationData}
                onChange={handleInputChange}
              />
            )}
            
            {currentStep === 5 && (
              <CompleteStep 
                data={installationData}
              />
            )}
          </div>

          {/* Navigation */}
          <div className={styles.navigation}>
            {currentStep > 0 && currentStep < 5 && (
              <button
                type="button"
                onClick={prevStep}
                className={styles.prevButton}
                disabled={isLoading}
              >
                ← Previous
              </button>
            )}

            {currentStep === 0 && <div></div>}

            <button
              type="button"
              onClick={nextStep}
              className={styles.nextButton}
              disabled={isLoading}
            >
              {isLoading && (
                <span className={styles.buttonSpinner}></span>
              )}
              {isLoading && 'Processing...'}
              {!isLoading && currentStep === 0 && 'Begin Installation →'}
              {!isLoading && currentStep === 5 && 'Complete Installation ✓'}
              {!isLoading && currentStep > 0 && currentStep < 5 && 'Next Step →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Requirements Check Step
const RequirementsStep = ({ requirements, installationStatus }) => (
  <div className={styles.stepForm}>
    <h2>System Requirements Check</h2>
    <p>Before we begin, let's verify your system meets the requirements.</p>

    <div className={styles.requirementsList}>
      <div className={styles.requirementItem}>
        <span className={styles.requirementIcon}>✓</span>
        <div className={styles.requirementInfo}>
          <strong>Node.js</strong>
          <span>{requirements?.nodeVersion || 'Checking...'}</span>
        </div>
      </div>

      <div className={styles.requirementItem}>
        <span className={styles.requirementIcon}>
          {installationStatus?.dbConnected ? '✓' : '⚠'}
        </span>
        <div className={styles.requirementInfo}>
          <strong>Database Connection</strong>
          <span>{installationStatus?.dbConnected ? 'Connected' : 'Not connected - will test in next step'}</span>
        </div>
      </div>

      <div className={styles.requirementItem}>
        <span className={styles.requirementIcon}>✓</span>
        <div className={styles.requirementInfo}>
          <strong>Memory Available</strong>
          <span>{requirements?.memoryAvailable || 'Checking...'}</span>
        </div>
      </div>

      <div className={styles.requirementItem}>
        <span className={styles.requirementIcon}>✓</span>
        <div className={styles.requirementInfo}>
          <strong>Platform</strong>
          <span>{requirements?.platform || 'Checking...'}</span>
        </div>
      </div>
    </div>

    <div className={styles.info}>
      <p><strong>Ready to install!</strong> Click "Begin Installation" to start setting up your forum.</p>
    </div>
  </div>
);

// Step Components
const DatabaseStep = ({ data, errors, onChange }) => (
  <div className={styles.stepForm}>
    <h2>Database Configuration</h2>
    <p>Configure your database connection. SQLite is recommended for most installations.</p>

    <div className={styles.formGroup}>
      <label>Database Type</label>
      <select
        value={data.dbType}
        onChange={(e) => onChange('dbType', e.target.value)}
        className={styles.select}
      >
        <option value="sqlite">SQLite (Recommended)</option>
        <option value="postgresql">PostgreSQL</option>
        <option value="mysql">MySQL</option>
      </select>
    </div>

    {data.dbType !== 'sqlite' && (
      <>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Host</label>
            <input
              type="text"
              value={data.dbHost}
              onChange={(e) => onChange('dbHost', e.target.value)}
              className={`${styles.input} ${errors.dbHost ? styles.error : ''}`}
              placeholder="localhost"
            />
            {errors.dbHost && <span className={styles.errorText}>{errors.dbHost}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Port</label>
            <input
              type="text"
              value={data.dbPort}
              onChange={(e) => onChange('dbPort', e.target.value)}
              className={styles.input}
              placeholder={data.dbType === 'postgresql' ? '5432' : '3306'}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Database Name</label>
          <input
            type="text"
            value={data.dbName}
            onChange={(e) => onChange('dbName', e.target.value)}
            className={`${styles.input} ${errors.dbName ? styles.error : ''}`}
            placeholder="nextjs_forum"
          />
          {errors.dbName && <span className={styles.errorText}>{errors.dbName}</span>}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Username</label>
            <input
              type="text"
              value={data.dbUser}
              onChange={(e) => onChange('dbUser', e.target.value)}
              className={`${styles.input} ${errors.dbUser ? styles.error : ''}`}
            />
            {errors.dbUser && <span className={styles.errorText}>{errors.dbUser}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Password</label>
            <input
              type="password"
              value={data.dbPassword}
              onChange={(e) => onChange('dbPassword', e.target.value)}
              className={styles.input}
            />
          </div>
        </div>
      </>
    )}

    {data.dbType === 'sqlite' && (
      <div className={styles.info}>
        <p>✓ SQLite will be used with a local database file. No additional configuration needed.</p>
      </div>
    )}
  </div>
);

const AdminStep = ({ data, errors, onChange }) => (
  <div className={styles.stepForm}>
    <h2>Administrator Account</h2>
    <p>Create your administrator account. This will be the main admin user for your forum.</p>

    <div className={styles.formGroup}>
      <label>Username</label>
      <input
        type="text"
        value={data.adminUsername}
        onChange={(e) => onChange('adminUsername', e.target.value)}
        className={`${styles.input} ${errors.adminUsername ? styles.error : ''}`}
        placeholder="admin"
      />
      {errors.adminUsername && <span className={styles.errorText}>{errors.adminUsername}</span>}
    </div>

    <div className={styles.formGroup}>
      <label>Email Address</label>
      <input
        type="email"
        value={data.adminEmail}
        onChange={(e) => onChange('adminEmail', e.target.value)}
        className={`${styles.input} ${errors.adminEmail ? styles.error : ''}`}
        placeholder="admin@example.com"
      />
      {errors.adminEmail && <span className={styles.errorText}>{errors.adminEmail}</span>}
    </div>

    <div className={styles.formRow}>
      <div className={styles.formGroup}>
        <label>Password</label>
        <input
          type="password"
          value={data.adminPassword}
          onChange={(e) => onChange('adminPassword', e.target.value)}
          className={`${styles.input} ${errors.adminPassword ? styles.error : ''}`}
          placeholder="Minimum 6 characters"
        />
        {errors.adminPassword && <span className={styles.errorText}>{errors.adminPassword}</span>}
      </div>

      <div className={styles.formGroup}>
        <label>Confirm Password</label>
        <input
          type="password"
          value={data.adminPasswordConfirm}
          onChange={(e) => onChange('adminPasswordConfirm', e.target.value)}
          className={`${styles.input} ${errors.adminPasswordConfirm ? styles.error : ''}`}
        />
        {errors.adminPasswordConfirm && <span className={styles.errorText}>{errors.adminPasswordConfirm}</span>}
      </div>
    </div>
  </div>
);

const SiteConfigStep = ({ data, errors, onChange }) => (
  <div className={styles.stepForm}>
    <h2>Site Configuration</h2>
    <p>Configure your forum's basic settings and branding.</p>

    <div className={styles.formGroup}>
      <label>Site Name</label>
      <input
        type="text"
        value={data.siteName}
        onChange={(e) => onChange('siteName', e.target.value)}
        className={`${styles.input} ${errors.siteName ? styles.error : ''}`}
        placeholder="NextJS Forum"
      />
      {errors.siteName && <span className={styles.errorText}>{errors.siteName}</span>}
    </div>

    <div className={styles.formGroup}>
      <label>Site Description</label>
      <textarea
        value={data.siteDescription}
        onChange={(e) => onChange('siteDescription', e.target.value)}
        className={styles.textarea}
        placeholder="A modern forum built with Next.js"
        rows="3"
      />
    </div>

    <div className={styles.formGroup}>
      <label>Contact Email</label>
      <input
        type="email"
        value={data.adminEmailContact}
        onChange={(e) => onChange('adminEmailContact', e.target.value)}
        className={`${styles.input} ${errors.adminEmailContact ? styles.error : ''}`}
        placeholder="contact@example.com"
      />
      {errors.adminEmailContact && <span className={styles.errorText}>{errors.adminEmailContact}</span>}
    </div>

    <div className={styles.formGroup}>
      <label>Timezone</label>
      <select
        value={data.timezone}
        onChange={(e) => onChange('timezone', e.target.value)}
        className={styles.select}
      >
        <option value="UTC">UTC</option>
        <option value="America/New_York">Eastern Time</option>
        <option value="America/Chicago">Central Time</option>
        <option value="America/Denver">Mountain Time</option>
        <option value="America/Los_Angeles">Pacific Time</option>
        <option value="Europe/London">London</option>
        <option value="Europe/Paris">Paris</option>
        <option value="Asia/Tokyo">Tokyo</option>
      </select>
    </div>
  </div>
);

const ForumStructureStep = ({ data, onChange }) => (
  <div className={styles.stepForm}>
    <h2>Forum Structure</h2>
    <p>Set up your initial forum categories and structure.</p>

    <div className={styles.formGroup}>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={data.createSampleData}
          onChange={(e) => onChange('createSampleData', e.target.checked)}
        />
        Create sample categories and forums
      </label>
      <small>This will create default categories to get you started quickly.</small>
    </div>

    {data.createSampleData && (
      <div className={styles.categoryList}>
        <h3>Default Categories</h3>
        {data.defaultCategories.map((category, index) => (
          <div key={index} className={styles.categoryItem}>
            <strong>{category.name}</strong>
            <p>{category.description}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

const CompleteStep = ({ data }) => (
  <div className={styles.stepForm}>
    <h2>Ready to Complete Installation</h2>
    <p>Review your settings and complete the installation.</p>

    <div className={styles.summary}>
      <h3>Installation Summary</h3>

      <div className={styles.summarySection}>
        <h4>Database</h4>
        <p>Type: {data.dbType.toUpperCase()}</p>
        {data.dbType !== 'sqlite' && (
          <>
            <p>Host: {data.dbHost}:{data.dbPort}</p>
            <p>Database: {data.dbName}</p>
          </>
        )}
      </div>

      <div className={styles.summarySection}>
        <h4>Administrator</h4>
        <p>Username: {data.adminUsername}</p>
        <p>Email: {data.adminEmail}</p>
      </div>

      <div className={styles.summarySection}>
        <h4>Site Configuration</h4>
        <p>Name: {data.siteName}</p>
        <p>Description: {data.siteDescription}</p>
        <p>Contact: {data.adminEmailContact}</p>
        <p>Timezone: {data.timezone}</p>
      </div>

      <div className={styles.summarySection}>
        <h4>Forum Structure</h4>
        <p>Sample Data: {data.createSampleData ? 'Yes' : 'No'}</p>
      </div>
    </div>

    <div className={styles.warning}>
      <p><strong>Important:</strong> Once you complete the installation, these settings will be saved and the installation wizard will be disabled.</p>
    </div>
  </div>
);

export default InstallWizard;
