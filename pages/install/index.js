import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../../styles/Install.module.css';

const InstallWizard = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
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
    timezone: 'UTC',
    
    // Forum Structure
    createSampleData: true,
    defaultCategories: [
      { name: 'General Discussion', description: 'General topics and discussions' },
      { name: 'Support', description: 'Get help and support' },
      { name: 'Announcements', description: 'Important announcements' }
    ]
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [installationStatus, setInstallationStatus] = useState(null);

  useEffect(() => {
    checkInstallationStatus();
  }, []);

  const checkInstallationStatus = async () => {
    try {
      const res = await fetch('/api/install/status');
      const data = await res.json();
      
      if (data.isInstalled) {
        router.push('/');
        return;
      }
      
      setInstallationStatus(data);
      setCurrentStep(data.installationStep || 1);
    } catch (error) {
      console.error('Error checking installation status:', error);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1: // Database Configuration
        if (installationData.dbType !== 'sqlite') {
          if (!installationData.dbHost) newErrors.dbHost = 'Database host is required';
          if (!installationData.dbName) newErrors.dbName = 'Database name is required';
          if (!installationData.dbUser) newErrors.dbUser = 'Database user is required';
        }
        break;
        
      case 2: // Admin Account
        if (!installationData.adminUsername) newErrors.adminUsername = 'Admin username is required';
        if (!installationData.adminEmail) newErrors.adminEmail = 'Admin email is required';
        if (!installationData.adminPassword) newErrors.adminPassword = 'Admin password is required';
        if (installationData.adminPassword !== installationData.adminPasswordConfirm) {
          newErrors.adminPasswordConfirm = 'Passwords do not match';
        }
        if (installationData.adminPassword && installationData.adminPassword.length < 6) {
          newErrors.adminPassword = 'Password must be at least 6 characters';
        }
        break;
        
      case 3: // Site Configuration
        if (!installationData.siteName) newErrors.siteName = 'Site name is required';
        if (!installationData.adminEmailContact) newErrors.adminEmailContact = 'Contact email is required';
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
    if (!validateStep(currentStep)) {
      return;
    }
    
    setIsLoading(true);
    
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
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Installation step failed');
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
    }
  };

  const completeInstallation = async () => {
    try {
      const res = await fetch('/api/install/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(installationData)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Installation failed');
      }
      
      // Redirect to login page
      router.push('/login?message=Installation completed successfully! Please log in with your admin account.');
    } catch (error) {
      console.error('Installation completion error:', error);
      setErrors({ general: error.message });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    { number: 1, title: 'Database Setup', description: 'Configure your database connection' },
    { number: 2, title: 'Admin Account', description: 'Create your administrator account' },
    { number: 3, title: 'Site Configuration', description: 'Configure your forum settings' },
    { number: 4, title: 'Forum Structure', description: 'Set up categories and forums' },
    { number: 5, title: 'Complete', description: 'Finalize your installation' }
  ];

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
                <div className={styles.stepNumber}>{step.number}</div>
                <div className={styles.stepContent}>
                  <div className={styles.stepTitle}>{step.title}</div>
                  <div className={styles.stepDescription}>{step.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Error Display */}
          {errors.general && (
            <div className={styles.error}>
              {errors.general}
            </div>
          )}

          {/* Step Content */}
          <div className={styles.stepContent}>
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
                errors={errors}
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
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className={styles.prevButton}
                disabled={isLoading}
              >
                Previous
              </button>
            )}
            
            <button
              type="button"
              onClick={nextStep}
              className={styles.nextButton}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 
               currentStep === 5 ? 'Complete Installation' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

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

export default InstallWizard;
