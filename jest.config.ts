import type { Config } from 'jest';

const config: Config = {
  roots: [
    '<rootDir>/tests'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};

export default config;
