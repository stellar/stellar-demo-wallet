module.exports = {
  presets: [
    "@babel/preset-react",
    "@babel/preset-typescript",
    [
      "@babel/preset-env",
      {
        targets: {
          browsers: "last 2 versions",
        },
        modules: false,
        loose: false,
      },
    ],
  ],
  plugins: ["react-hot-loader/babel"],
  env: {
    test: {
      plugins: ["@babel/plugin-transform-modules-commonjs"],
    },
  },
};
