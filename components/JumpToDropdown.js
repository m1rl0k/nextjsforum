import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/JumpToDropdown.module.css';

export default function JumpToDropdown() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedValue, setSelectedValue] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setSelectedValue(value);
    
    if (value) {
      router.push(value);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>🚀</span>
        <span className={styles.title}>Quick Navigation</span>
      </div>
      <div className={styles.content}>
        <select 
          className={styles.select}
          value={selectedValue}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="">-- Jump to Forum --</option>
          <option value="/">Forum Home</option>
          <option disabled>──────────</option>
          
          {categories.map(category => (
            <optgroup key={category.id} label={category.name}>
              {category.subjects?.map(subject => (
                <option key={subject.id} value={`/subjects/${subject.id}`}>
                  {subject.name}
                </option>
              ))}
            </optgroup>
          ))}
          
          <option disabled>──────────</option>
          <option value="/members">Members List</option>
          <option value="/search">Search</option>
          <option value="/help">Help</option>
        </select>
        <button 
          className={styles.goButton}
          onClick={() => selectedValue && router.push(selectedValue)}
          disabled={!selectedValue || loading}
        >
          Go
        </button>
      </div>
    </div>
  );
}

