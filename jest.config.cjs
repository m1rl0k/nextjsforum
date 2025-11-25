module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '^isomorphic-dompurify$': '<rootDir>/__mocks__/isomorphic-dompurify.js'
  },
  moduleFileExtensions: ['js', 'json'],
  coverageProvider: 'v8'
};
