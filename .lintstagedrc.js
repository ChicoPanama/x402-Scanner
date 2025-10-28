module.exports = {
  // TypeScript/JavaScript files
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],

  // JSON, YAML files
  '*.{json,yml,yaml}': ['prettier --write'],

  // TypeScript type checking (run on all TS files)
  '*.{ts,tsx}': () => 'tsc --noEmit',
}
