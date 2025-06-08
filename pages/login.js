import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Login.module.css';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const { registered } = router.query;

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = router.query.redirect || '/';
      router.push(redirectTo);
    }
  }, [isAuthenticated, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Redirect to the page they were trying to access or home
        const redirectTo = router.query.redirect || '/';
        router.push(redirectTo);
      } else {
        setSubmitError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setSubmitError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return null; // or a loading spinner
  }

  return (
    <div className={`${styles.container} loginContainer`}>
      <div className={`${styles.card} loginForm`}>
        <h1 className={styles.title}>Welcome Back</h1>
        
        {registered && (
          <div className={styles.successMessage}>
            Registration successful! Please log in to continue.
          </div>
        )}
        
        {submitError && (
          <div className={styles.error}>
            {submitError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ''} form-input`}
              autoComplete="username"
            />
            {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <Link href="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${errors.password ? styles.inputError : ''} form-input`}
              autoComplete="current-password"
            />
            {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className={styles.footer}>
          <span className={styles.footerText}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className={styles.link}>
              Register
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
