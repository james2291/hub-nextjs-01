# Prompt to paste into Claude Code

Unzip this folder into the repo (for example at `design/oval-hub-handoff/`), then paste:

---

I'm implementing the Oval Hub redesign. The full design handoff is in `design/oval-hub-handoff/`.

- Start with `HANDOFF.md`. It covers the spec: design tokens, app shell, the 22 pages, data rules, links and acceptance checks.
- `screens/*.png` are the visual targets at 1440px. Look at the relevant one before building each page.
- `reference-html/*.html` hold the exact CSS values and copy for each page.
- `prototype/` shows the interactive behaviour. Run `python3 -m http.server` in that folder and open `Home-Hub.dc.html`.
- `data/` contains the real 2025/26 fixtures and standings feeds.

Please:

1. Explore this repo first: framework, routing, component library, styling approach, data and API layer, and tests. Then write a short plan that maps each handoff page and shared component onto existing files, saying what you'll create and what you'll change. Show me the plan before you write code.
2. Build in the order in section 8 of `HANDOFF.md`, using the repo's own components and conventions. Don't copy the prototype's inline styles or `support.js`. Put the colour tokens in the repo's theme/token system.
3. Use the real feeds for everything section 5 lists as real. Keep the DEMO DATA / ILLUSTRATIVE notes on the areas listed in section 6.
4. After each section (shell, Fixture Card, Home, Competition, Team, Referee, Player, Match, Next opponent):
   - Run the app.
   - Compare the result with the matching PNG and fix differences.
   - Check the "Check values" figures and the links in section 7.
   - Run the tests.
   - Commit on a feature branch with a clear message.
5. Finish with a summary of what you built, anything you couldn't match, and the feeds still needed for the demo areas.

Ask me if anything in the repo conflicts with the handoff, for example an existing route or component that does the same job differently.
