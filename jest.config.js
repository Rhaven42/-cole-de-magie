/** Tests du moteur (pur TypeScript, sans React Native). */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          strict: true,
          esModuleInterop: true,
          isolatedModules: true,
          rootDir: '.',
          module: 'commonjs',
          types: ['jest', 'node'],
        },
        diagnostics: false,
      },
    ],
  },
  collectCoverageFrom: ['src/engine/**/*.ts', '!src/engine/**/__tests__/**'],
  coverageThreshold: { global: { lines: 80, branches: 70, functions: 80, statements: 80 } },
};
