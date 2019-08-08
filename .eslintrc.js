module.exports = {
  extends: ['mainframe', 'mainframe/jest-puppeteer', 'mainframe/typescript'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': {
      allowExpressions: true,
    },
    '@typescript-eslint/no-unused-vars': {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    },
  },
}
