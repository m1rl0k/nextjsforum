import styles from '../../styles/AdminComponents.module.css';

// Page Header Component
export const AdminPageHeader = ({ title, description, actions, breadcrumbs }) => (
  <div className={styles.pageHeader}>
    {breadcrumbs && (
      <nav className={styles.breadcrumbs}>
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className={styles.breadcrumb}>
            {crumb.href ? (
              <a href={crumb.href}>{crumb.label}</a>
            ) : (
              <span>{crumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 && <span className={styles.separator}>›</span>}
          </span>
        ))}
      </nav>
    )}
    <div className={styles.headerContent}>
      <div className={styles.headerText}>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && (
        <div className={styles.headerActions}>
          {actions}
        </div>
      )}
    </div>
  </div>
);

// Card Component
export const AdminCard = ({ title, children, className = '', actions }) => (
  <div className={`${styles.card} ${className}`}>
    {(title || actions) && (
      <div className={styles.cardHeader}>
        {title && <h2 className={styles.cardTitle}>{title}</h2>}
        {actions && <div className={styles.cardActions}>{actions}</div>}
      </div>
    )}
    <div className={styles.cardContent}>
      {children}
    </div>
  </div>
);

// Form Section Component
export const AdminFormSection = ({ title, children, description }) => (
  <div className={styles.formSection}>
    <div className={styles.sectionHeader}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {description && <p className={styles.sectionDescription}>{description}</p>}
    </div>
    <div className={styles.sectionContent}>
      {children}
    </div>
  </div>
);

// Form Group Component
export const AdminFormGroup = ({ label, children, error, help, required }) => (
  <div className={styles.formGroup}>
    {label && (
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
    )}
    <div className={styles.inputWrapper}>
      {children}
    </div>
    {error && <div className={styles.error}>{error}</div>}
    {help && <div className={styles.help}>{help}</div>}
  </div>
);

// Button Components
export const AdminButton = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  loading = false,
  icon,
  ...props 
}) => (
  <button 
    className={`${styles.button} ${styles[variant]} ${styles[size]} ${disabled ? styles.disabled : ''} ${loading ? styles.loading : ''}`}
    disabled={disabled || loading}
    {...props}
  >
    {icon && <span className={styles.buttonIcon}>{icon}</span>}
    {loading ? 'Loading...' : children}
  </button>
);

// Alert Components
export const AdminAlert = ({ type = 'info', children, onClose }) => (
  <div className={`${styles.alert} ${styles[type]}`}>
    <div className={styles.alertContent}>
      {children}
    </div>
    {onClose && (
      <button className={styles.alertClose} onClick={onClose}>
        ×
      </button>
    )}
  </div>
);

// Stats Grid Component
export const AdminStatsGrid = ({ children }) => (
  <div className={styles.statsGrid}>
    {children}
  </div>
);

// Stat Card Component
export const AdminStatCard = ({ title, value, change, icon, color = 'blue' }) => (
  <div className={`${styles.statCard} ${styles[color]}`}>
    <div className={styles.statHeader}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statTitle}>{title}</div>
    </div>
    <div className={styles.statValue}>{value}</div>
    {change && (
      <div className={`${styles.statChange} ${change.type === 'increase' ? styles.positive : styles.negative}`}>
        {change.type === 'increase' ? '↗' : '↘'} {change.value}
      </div>
    )}
  </div>
);

// Table Component
export const AdminTable = ({ columns, data, actions, loading = false }) => (
  <div className={styles.tableWrapper}>
    {loading && <div className={styles.tableLoading}>Loading...</div>}
    <table className={styles.table}>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th key={index} className={styles.tableHeader}>
              {column.label}
            </th>
          ))}
          {actions && <th className={styles.tableHeader}>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex} className={styles.tableRow}>
            {columns.map((column, colIndex) => (
              <td key={colIndex} className={styles.tableCell}>
                {column.render ? column.render(row[column.key], row) : row[column.key]}
              </td>
            ))}
            {actions && (
              <td className={styles.tableCell}>
                <div className={styles.tableActions}>
                  {actions(row)}
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Pagination Component
export const AdminPagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className={styles.pagination}>
    <button 
      className={styles.paginationButton}
      disabled={currentPage <= 1}
      onClick={() => onPageChange(currentPage - 1)}
    >
      ← Previous
    </button>
    
    <span className={styles.paginationInfo}>
      Page {currentPage} of {totalPages}
    </span>
    
    <button 
      className={styles.paginationButton}
      disabled={currentPage >= totalPages}
      onClick={() => onPageChange(currentPage + 1)}
    >
      Next →
    </button>
  </div>
);

// Tabs Component
export const AdminTabs = ({ tabs, activeTab, onTabChange }) => (
  <div className={styles.tabs}>
    <div className={styles.tabList}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);

// Loading Spinner
export const AdminLoading = ({ size = 'medium', text = 'Loading...' }) => (
  <div className={`${styles.loading} ${styles[size]}`}>
    <div className={styles.spinner}></div>
    <span className={styles.loadingText}>{text}</span>
  </div>
);

// Empty State
export const AdminEmptyState = ({ icon, title, description, action }) => (
  <div className={styles.emptyState}>
    {icon && <div className={styles.emptyIcon}>{icon}</div>}
    <h3 className={styles.emptyTitle}>{title}</h3>
    {description && <p className={styles.emptyDescription}>{description}</p>}
    {action && <div className={styles.emptyAction}>{action}</div>}
  </div>
);
