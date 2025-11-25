import Link from 'next/link';
import Layout from '../components/Layout';

export default function Help() {
  return (
    <Layout title="Help">
      <div className="help-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo;
          <span> Help</span>
        </div>

        <div className="category-block">
          <div className="category-header">
            Forum Help & Guidelines
          </div>
          
          <div style={{ padding: '20px', backgroundColor: 'white' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
              
              {/* Getting Started */}
              <div>
                <h3 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>🚀 Getting Started</h3>
                <ul style={{ lineHeight: '1.8' }}>
                  <li><Link href="/register">Create an account</Link> to join our community</li>
                  <li>Complete your <Link href="/account/settings">profile</Link> with bio and avatar</li>
                  <li>Browse <Link href="/">forum categories</Link> to find topics of interest</li>
                  <li>Read existing threads before posting</li>
                  <li>Introduce yourself in the welcome section</li>
                </ul>
              </div>

              {/* Posting Guidelines */}
              <div>
                <h3 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>📝 Posting Guidelines</h3>
                <ul style={{ lineHeight: '1.8' }}>
                  <li>Use descriptive thread titles</li>
                  <li>Stay on topic within threads</li>
                  <li>Be respectful and courteous to all members</li>
                  <li>No spam, advertising, or duplicate posts</li>
                  <li>Use proper grammar and spelling</li>
                  <li>Search before posting to avoid duplicates</li>
                </ul>
              </div>

              {/* Forum Features */}
              <div>
                <h3 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>⚡ Forum Features</h3>
                <ul style={{ lineHeight: '1.8' }}>
                  <li><strong>Threads:</strong> Start new discussions in appropriate forums</li>
                  <li><strong>Replies:</strong> Respond to existing threads</li>
                  <li><strong>Private Messages:</strong> Send direct messages to other users</li>
                  <li><strong>Search:</strong> Find content across the entire forum</li>
                  <li><strong>Profiles:</strong> View member information and post history</li>
                </ul>
              </div>

              {/* User Ranks */}
              <div>
                <h3 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>🏆 User Ranks</h3>
                <ul style={{ lineHeight: '1.8' }}>
                  <li><span style={{ color: '#666' }}>👤 Member:</span> Regular forum users</li>
                  <li><span style={{ color: '#1976d2' }}>🛡️ Moderator:</span> Help maintain forum order</li>
                  <li><span style={{ color: '#d32f2f' }}>👑 Administrator:</span> Full forum management</li>
                </ul>
              </div>

              {/* Forum Rules */}
              <div>
                <h3 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>📋 Forum Rules</h3>
                <ul style={{ lineHeight: '1.8' }}>
                  <li>No harassment, bullying, or personal attacks</li>
                  <li>No illegal content or activities</li>
                  <li>No excessive profanity or inappropriate content</li>
                  <li>Respect intellectual property rights</li>
                  <li>One account per person</li>
                  <li>Follow moderator instructions</li>
                </ul>
              </div>

              {/* Technical Support */}
              <div>
                <h3 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>🔧 Technical Support</h3>
                <ul style={{ lineHeight: '1.8' }}>
                  <li>Having trouble logging in? Try resetting your password</li>
                  <li>Can't post? Check if the thread is locked</li>
                  <li>Images not showing? Verify the URL is correct</li>
                  <li>For technical issues, contact an administrator</li>
                  <li>Report bugs or suggestions to the admin team</li>
                </ul>
              </div>
            </div>

            {/* FAQ Section */}
            <div style={{ marginTop: '40px', borderTop: '1px solid var(--border-color)', paddingTop: '30px' }}>
              <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px' }}>❓ Frequently Asked Questions</h2>
              
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '8px' }}>How do I change my avatar?</h4>
                <p style={{ marginBottom: '0', color: '#666' }}>
                  Go to your <Link href="/account/settings">account settings</Link> and enter a URL to your avatar image.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '8px' }}>How do I send a private message?</h4>
                <p style={{ marginBottom: '0', color: '#666' }}>
                  Visit a user's profile and click "Send Message" or go to <Link href="/messages/new">compose new message</Link>.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '8px' }}>Can I edit my posts?</h4>
                <p style={{ marginBottom: '0', color: '#666' }}>
                  Yes! You can edit your own posts by clicking the "Edit" button in the post footer. Moderators and administrators can also edit any post. Note that edited posts will show when they were last edited.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '8px' }}>How do I search the forum?</h4>
                <p style={{ marginBottom: '0', color: '#666' }}>
                  Use the search box in the navigation bar or visit the <Link href="/search">search page</Link> for advanced options.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '8px' }}>What should I do if I see inappropriate content?</h4>
                <p style={{ marginBottom: '0', color: '#666' }}>
                  Report it to a moderator or administrator immediately. Do not engage with the content.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div style={{ 
              marginTop: '40px', 
              padding: '20px', 
              backgroundColor: 'var(--thread-alt-bg)', 
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              <h3 style={{ marginTop: '0', color: 'var(--primary-color)' }}>Need More Help?</h3>
              <p style={{ marginBottom: '15px' }}>
                If you can't find the answer to your question here, don't hesitate to reach out!
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <Link href="/messages/new" className="button">
                  📧 Contact Admin
                </Link>
                <Link href="/search" className="button">
                  🔍 Search Forum
                </Link>
                <Link href="/members" className="button">
                  👥 Browse Members
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
