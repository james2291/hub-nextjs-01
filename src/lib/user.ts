// TEMPORARY HOLD: replace with the Cognito session (GET /api/v1/user). See proxy.ts.
// The signed-in user. Fixed until GET /api/v1/user is built (sign-in is planned as AWS Cognito).
// Every "my club" default reads clubSlug from here rather than hard-coding a club.
export const CURRENT_USER = {
  name: "James Molyneux",
  clubSlug: "harlequins",
  clubName: "Harlequins",
  roleLabel: "Analysis",
  role: "analyst" as const,
};
