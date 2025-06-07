import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('username');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchMembers();
  }, [currentPage, sortBy, sortOrder]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        sortBy,
        sortOrder,
        search: searchTerm
      });
      
      const res = await fetch(`/api/users/members?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
        setTotalPages(data.totalPages);
      } else {
        setError('Failed to load members');
      }
    } catch (err) {
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMembers();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return '#d32f2f';
      case 'MODERATOR': return '#1976d2';
      default: return '#666';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN': return '👑';
      case 'MODERATOR': return '🛡️';
      default: return '👤';
    }
  };

  return (
    <Layout title="Members">
      <div className="members-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo;
          <span> Members</span>
        </div>

        <div className="category-block">
          <div className="category-header">
            Forum Members
          </div>
          
          <div style={{ padding: '15px', backgroundColor: 'var(--subject-header-bg)', borderBottom: '1px solid var(--border-color)' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  padding: '5px 10px', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '3px',
                  minWidth: '200px'
                }}
              />
              <button type="submit" className="button">Search</button>
              
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '5px', border: '1px solid var(--border-color)', borderRadius: '3px' }}
              >
                <option value="username">Username</option>
                <option value="createdAt">Join Date</option>
                <option value="postCount">Post Count</option>
              </select>
              
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                style={{ padding: '5px', border: '1px solid var(--border-color)', borderRadius: '3px' }}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </form>
          </div>

          {error && (
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#ffebee', 
              color: '#c62828',
              border: '1px solid #ef5350'
            }}>
              {error}
            </div>
          )}

          <div className="forum-table">
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 120px 120px 150px', 
              backgroundColor: 'var(--subject-header-bg)', 
              padding: '10px', 
              fontWeight: 'bold',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div>Member</div>
              <div style={{ textAlign: 'center' }}>Posts</div>
              <div style={{ textAlign: 'center' }}>Role</div>
              <div style={{ textAlign: 'center' }}>Joined</div>
            </div>
            
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading members...</div>
            ) : members.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>No members found.</div>
            ) : (
              members.map(member => (
                <div key={member.id} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 120px 120px 150px', 
                  padding: '10px',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'white',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {member.avatar ? (
                      <img 
                        src={member.avatar} 
                        alt={`${member.username}'s avatar`}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-color)' }}
                      />
                    ) : (
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--primary-color)', 
                        color: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '14px'
                      }}>
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div>
                        <Link href={`/profile/${member.username}`} style={{ fontWeight: 'bold' }}>
                          {member.username}
                        </Link>
                      </div>
                      {member.location && (
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          📍 {member.location}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center', fontSize: '14px' }}>
                    {member.postCount || 0}
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ 
                      color: getRoleColor(member.role), 
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px'
                    }}>
                      {getRoleIcon(member.role)} {member.role}
                    </span>
                  </div>
                  
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
                    {formatDate(member.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            {currentPage > 1 && (
              <button 
                onClick={() => setCurrentPage(currentPage - 1)}
                className="pagination-link"
              >
                Previous
              </button>
            )}
            
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              const page = i + 1;
              if (totalPages <= 10) {
                return page;
              }
              // Show first 3, last 3, and current page with neighbors
              if (page <= 3 || page > totalPages - 3 || Math.abs(page - currentPage) <= 1) {
                return page;
              }
              return null;
            }).filter(Boolean).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`pagination-link ${page === currentPage ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
            
            {currentPage < totalPages && (
              <button 
                onClick={() => setCurrentPage(currentPage + 1)}
                className="pagination-link"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
