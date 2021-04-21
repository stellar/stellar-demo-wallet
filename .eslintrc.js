module.exports = {
  extends: ["@stellar/eslint-config"],
  rules: {
    "no-console": 0,
    "import/no-unresolved": "off",
    "react/jsx-filename-extension": [1, { extensions: [".tsx", ".jsx"] }],
    "react/prop-types": 0,
    // note you must disable the base rule as it can report incorrect errors
    "no-shadow": "off",
    "@typescript-eslint/no-shadow": ["error"],
    // note you must disable the base rule as it can report incorrect errors
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error"],
  },
};
