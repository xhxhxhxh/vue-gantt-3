/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  rootDir: 'src',
  testEnvironment: 'jsdom',
  "transform": {
    "^.+\\.js$": "babel-jest",
    "^.+\\.vue$": "@vue/vue3-jest", // Update to match your installed version
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.node.json'
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testEnvironmentOptions: {
    customExportConditions: [
      'node',
      'node-addons'
    ]
  }
};