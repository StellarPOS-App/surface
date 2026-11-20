# Contributing to StellarPOS Surface

## Setup

```bash
git clone https://github.com/<you>/surface.git
cd surface
npm install
npm run dev
```

Run the [backend](https://github.com/StellarPOS-App/backend) alongside
(`npm run db:seed && npm run dev`). Vite proxies the API, so no configuration
is needed.

## Already have a fork?

Every fork of this repository is listed in [CONTRIBUTORS.md](CONTRIBUTORS.md#forks).
Most were created before the current code landed and are many commits behind
`main`. Sync yours before you start, or you will be working on code that no
longer exists:

```bash
# GitHub CLI
gh repo sync <you>/<your-fork> --source StellarPOS-App/surface --branch main

# or plain git, from your clone
git remote add upstream https://github.com/StellarPOS-App/surface.git
git fetch upstream
git checkout main && git merge --ff-only upstream/main && git push
```

You can also click **Sync fork** on your fork's GitHub page. Once your first
pull request is merged, you move from the Forks list to the contributors table.

## Workflow

1. Open or claim an issue for anything beyond a typo.
2. Branch from `main`: `feat/...`, `fix/...`, `docs/...`.
3. Commit with [Conventional Commits](https://www.conventionalcommits.org/),
   for example `feat(pos): ...` or `fix(reports): ...`.
4. Run `npm run check` (lint, type-check, tests). CI also checks Prettier,
   builds, and builds the Docker image.
5. Open a pull request using the template. For UI changes, include before
   and after screenshots in light and night-shift themes.

## Conventions

- **Server state goes through `src/hooks/queries.ts`.** Do not call `fetch`
  from components. Add a hook, and make its mutation invalidate whatever
  the change affects.
- **Use the design tokens.** Colors come from the Tailwind theme (`paper`,
  `ink`, `cash`, `card`, `lumen`, `signal`, `amber`), never raw hex in
  components. Payment-method colors mean that method everywhere.
- **Money is integer cents.** Use `<Money cents={...} />` or
  `useFormatMoney()` to display, and `parseCents()` to read input.
- **Accessibility.** Every control needs an accessible name. Dialogs use
  `Modal`, which manages focus and Escape. Do not make anything usable by
  mouse only.
- **Tests.** Use Vitest + Testing Library and query by role or label, as a
  user would. Mock the network with `mockFetch` from `src/test/utils.tsx`.

## Code of conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
