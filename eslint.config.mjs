import next from "eslint-config-next";

const config = [
  ...next,
  { ignores: [".next/**", "node_modules/**"] },
  {
    // React Compiler rules added in eslint-config-next 16. These flag patterns carried over
    // unchanged from the Lovable prototype (setState in effects, Math.random in the shadcn
    // sidebar). Kept visible as warnings so they get fixed as each component is wired to the API.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "@next/next/no-img-element": "warn",
    },
  },
];

export default config;
