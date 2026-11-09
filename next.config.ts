import type { NextConfig } from "next";

// Fixed legacy URLs from the TanStack Start prototype. Data-dependent redirects
// (next opponent, home pin, legacy entity tabs) live in the route files.
const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/competitions/:competitionId/match/:matchId",
        destination: "/matches/:matchId",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
