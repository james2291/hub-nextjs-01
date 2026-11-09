# Upstream fixtures

Captured Oval Hub v2 payloads, one folder per `docs/openapi.yaml` operationId. `npm run check:contract`
runs each one through its reshaper (`src/server/contract/reshape.ts`) and validates the result against
that operation's 200 schema.

## Capture one

With `OVAL_API_GATEWAY_URL` (and a Cognito id token) set, call the pass-through route and save the
whole response body. It already carries `request.params` and `request.query`.

```sh
mkdir -p fixtures/upstream/get_competitions_competitionId_standings
curl -s -H "Authorization: $ID_TOKEN" \
  "http://localhost:3000/api/v1/competitions/1011/standings?season=2025-26" \
  > fixtures/upstream/get_competitions_competitionId_standings/prem-2025-26.json
```

`GET /api/v1/routing` lists each route's `operationId` and whether it is still `upstream-passthrough`.

## Map one

1. Capture at least one normal payload and one edge case (empty season, unknown id).
2. Add the reshaper to `reshapers` in `src/server/contract/reshape.ts`. Its return type is the
   contract body, so `npm run typecheck` checks field names and `npm run check:contract` checks values.
3. The route switches to the contract body for that endpoint. Nothing else changes.

Strip personal data (user names, emails, tokens) from payloads before committing them.
