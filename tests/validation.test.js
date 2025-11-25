const { validate, loginSchema, registerSchema, createThreadSchema, createPostSchema } = require('../lib/validation');

describe('Validation Library', () => {
  describe('Login Validation', () => {
    it('accepts valid login credentials', () => {
      const data = {
        email: 'user@example.com',
        password: 'Password123!'
      };
      
      const result = validate(loginSchema, data);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('rejects invalid email format', () => {
      const data = {
        email: 'not-an-email',
        password: 'Password123!'
      };
      
      const result = validate(loginSchema, data);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('rejects missing password', () => {
      const data = {
        email: 'user@example.com'
      };
      
      const result = validate(loginSchema, data);
      
      expect(result.success).toBe(false);
    });

    it('rejects empty email', () => {
      const data = {
        email: '',
        password: 'Password123!'
      };
      
      const result = validate(loginSchema, data);
      
      expect(result.success).toBe(false);
    });
  });

  describe('Registration Validation', () => {
    it('accepts valid registration data', () => {
      const data = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      };
      
      const result = validate(registerSchema, data);
      
      expect(result.success).toBe(true);
    });

    it('rejects short username', () => {
      const data = {
        email: 'user@example.com',
        username: 'ab',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };
      
      const result = validate(registerSchema, data);
      
      expect(result.success).toBe(false);
    });

    it('rejects weak password (no uppercase)', () => {
      const data = {
        email: 'user@example.com',
        username: 'testuser',
        password: 'password123!',
        confirmPassword: 'password123!'
      };
      
      const result = validate(registerSchema, data);
      
      expect(result.success).toBe(false);
    });

    it('rejects weak password (no number)', () => {
      const data = {
        email: 'user@example.com',
        username: 'testuser',
        password: 'PasswordOnly!',
        confirmPassword: 'PasswordOnly!'
      };
      
      const result = validate(registerSchema, data);
      
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const data = {
        email: 'user@example.com',
        username: 'testuser',
        password: 'Pass1!',
        confirmPassword: 'Pass1!'
      };
      
      const result = validate(registerSchema, data);
      
      expect(result.success).toBe(false);
    });

    // Note: Password confirmation is handled in the API layer, not in the schema

    it('rejects invalid username characters', () => {
      const data = {
        email: 'user@example.com',
        username: 'user@name!',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };
      
      const result = validate(registerSchema, data);
      
      expect(result.success).toBe(false);
    });

    it('rejects username that is too long', () => {
      const data = {
        email: 'user@example.com',
        username: 'a'.repeat(31),
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };
      
      const result = validate(registerSchema, data);
      
      expect(result.success).toBe(false);
    });
  });

  describe('Thread Validation', () => {
    it('accepts valid thread data', () => {
      const data = {
        title: 'Test Thread Title',
        content: 'This is the thread content with enough characters.',
        subjectId: 1
      };

      const result = validate(createThreadSchema, data);

      expect(result.success).toBe(true);
    });

    it('rejects short title', () => {
      const data = {
        title: 'ab',
        content: 'This is the thread content.',
        subjectId: 1
      };

      const result = validate(createThreadSchema, data);

      expect(result.success).toBe(false);
    });
  });

  describe('Post Validation', () => {
    it('accepts valid post data', () => {
      const data = {
        content: 'This is a valid post content.',
        threadId: 1
      };

      const result = validate(createPostSchema, data);

      expect(result.success).toBe(true);
    });

    it('rejects empty content', () => {
      const data = {
        content: '',
        threadId: 1
      };

      const result = validate(createPostSchema, data);

      expect(result.success).toBe(false);
    });
  });
});

