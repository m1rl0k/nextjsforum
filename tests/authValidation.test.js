import { validate } from '../lib/validation';
import { loginSchema, registerSchema } from '../lib/validation';

describe('Auth Validation edge cases', () => {
  it('rejects missing fields on login', () => {
    const result = validate(loginSchema, {});
    expect(result.success).toBe(false);
  });

  it('rejects extremely long email on login', () => {
    const email = 'a'.repeat(300) + '@example.com';
    const result = validate(loginSchema, { email, password: 'Password123!' });
    expect(result.success).toBe(false);
  });

  it('rejects registration when password and confirm differ', () => {
    const data = {
      email: 'user@example.com',
      username: 'user123',
      password: 'Password123!',
      confirmPassword: 'Password123!!'
    };
    const result = validate(registerSchema, data);
    expect(result.success).toBe(false);
  });

  it('rejects short username on register edge case', () => {
    const result = validate(registerSchema, {
      email: 'u@e.com',
      username: 'a',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    expect(result.success).toBe(false);
  });
});
