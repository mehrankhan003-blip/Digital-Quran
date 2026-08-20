import next from "eslint-config-next";

const eslintConfig = [
  ...next,
  {
    ignores: ["data/quran/*.json", "public/sw.js"],
  },
];

export default eslintConfig;