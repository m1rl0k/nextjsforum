import { getToken } from 'next-auth/jwt';

/**
 * Higher-order function to protect API routes with authentication
 * @param {Function} handler The API route handler
 * @param {Object} options Configuration options
 * @param {Array} options.roles Allowed roles (default: ['USER'])
 * @param {Boolean} options.redirect Whether to redirect unauthenticated users (default: false)
 * @returns {Function} Protected API route handler
 */
export const withAuth = (handler, options = {}) => {
  const { roles = ['USER'], redirect = false } = options;

  return async (req, res) => {
    try {
      // Get the token from the request
      const token = await getToken({ req, secret: process.env.JWT_SECRET });

      // If no token, return 401
      if (!token) {
        if (redirect) {
          return res.redirect(302, '/login');
        }
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Check if user has required role
      if (roles.length > 0 && !roles.includes(token.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      // Add user to request object
      req.user = {
        id: token.sub,
        username: token.username,
        email: token.email,
        role: token.role,
        isActive: token.isActive
      };

      // Continue to the API route handler
      return handler(req, res);
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ message: 'Authentication error' });
    }
  };
};

/**
 * Middleware to protect pages with authentication
 * @param {Object} context Next.js page context
 * @param {Array} roles Allowed roles (default: ['USER'])
 * @returns {Object} Props for the page or redirect object
 */
export const getServerSidePropsWithAuth = async (context, roles = ['USER']) => {
  const { req, res } = context;
  const token = await getToken({ req, secret: process.env.JWT_SECRET });

  // If no token, redirect to login
  if (!token) {
    return {
      redirect: {
        destination: `/login?redirect=${encodeURIComponent(req.url)}`,
        permanent: false,
      },
    };
  }

  // Check if user has required role
  if (roles.length > 0 && !roles.includes(token.role)) {
    // If user is not authorized, redirect to home or show 403
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  // Add user to props
  return {
    props: {
      user: {
        id: token.sub,
        username: token.username,
        email: token.email,
        role: token.role,
        isActive: token.isActive
      }
    },
  };
};

/**
 * Get user session on the client side
 * @param {Object} context Next.js page context
 * @returns {Object} User session or null
 */
export const getSession = async (context) => {
  const { req } = context;
  const token = await getToken({ req, secret: process.env.JWT_SECRET });
  
  if (!token) return null;
  
  return {
    user: {
      id: token.sub,
      username: token.username,
      email: token.email,
      role: token.role,
      isActive: token.isActive
    },
    expires: token.exp
  };
};
