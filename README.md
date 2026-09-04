# Work Board

White-label on-chain community work platform — a DAO's "Dework". It reads a live
Bounty / Escrow / Reputation / Karma work-market directly over JSON-RPC (no
subgraph) and renders the full Dework surface: **Overview** (org header + time-to-
payment / total-paid stats + Bounties category grid), **Board** (To Do / In
Progress / In Review / Done kanban), **Open Tasks**, **Leaderboards** (Top
Contributors / Reviewers; Task Points = global Karma), **Community Suggestions**,
**Combined Board**, per-Space tabs, a **task detail** with the real on-chain
activity log + apply flow, and a cross-org **Explore**. The differentiator is
**portable reputation**: per-DAO Reputation + global soul-bound Karma travel with
the worker's address, not the platform. Mobile-first (390px up); every view also
renders from a fixture with no wallet/chain, so it is always screenshot-able.

One repo, one Dockerfile. A build-time brand (`VITE_BRAND`, default `zoo`)
selects the white-label profile — chain, addresses, owner label, header/title,
and the RPC host baked into the CSP — from `src/brands.ts`:

| Brand  | Chain    | Site                                          |
| ------ | -------- | --------------------------------------------- |
| `zoo`  | 200200   | https://work.zoo.network                      |
| `pars` | 494949   | https://work.pars.network                     |

## Run

    npm install
    npm run dev        # http://localhost:5173  (proxies /rpc -> 127.0.0.1:9631 port-forward)
    npm run build      # tsc --noEmit && vite build  ->  dist/
    npm test           # vitest run
    npm run preview     # serve the production build

Point the dev proxy at any node instead of the local port-forward, and select a
brand:

    RPC_TARGET=https://api.pars.network npm run dev
    VITE_BRAND=pars VITE_RPC_URL=https://api.pars.network/v1/chain/C/rpc npm run build

If the RPC is unreachable, the board renders a faithful fixture of that brand's
live bounty #0 (behind the same render path) so the UI stays verifiable; the
source badge shows FIXTURE.

## Config

Brand-varying values live in one map: `src/brands.ts`; `src/config.ts` selects
the active brand from `VITE_BRAND`. To add a board, add a brand profile — it's a
data change, not a code change.

## Deploy

CI (`.github/workflows/docker.yml`) builds on every push to `main` on luxfi's
in-cluster ARC pool (`lux-build-amd64`) and pushes to `ghcr.io/luxfi/work-board`
— never built locally. A brand matrix stamps one immutable tag per brand from
the same Dockerfile:

- `zoo`  → `:sha-<commit>`  → zoo-k8s, namespace `zoo-mainnet`  (manifests in `k8s/`)
- `pars` → `:pars-<commit>` → pars-k8s, namespace `pars`        (manifests in `k8s/pars/`)

Each `deployment.yaml` + `service.yaml` runs 2 replicas serving `dist` on :3000,
Service :80 → :3000; pin the Deployment to the CI tag then `kubectl apply`. Each
`route.yaml` is the Traefik dynamic-config router (host → Service, TLS via the
ingress's built-in ACME resolver); hanzoai/ingress routes every public host
through a `@file` ConfigMap (zoo: `zoo-system/zoo-dynamic`; pars:
`hanzo/pars-dynamic`), not Ingress objects — merge the fragment in (see the
header in each `route.yaml`).

## Data source

The live set, as recorded in `lps/LPs/lp-0020-work-market.md` and read by
`src/brands.ts`. The V1 addresses this table used to carry predate the split of
the reward asset from the stake asset and answer a different struct.

**Zoo 200200**

| Contract     | Address                                      |
| ------------ | -------------------------------------------- |
| Bounty     | `0x857c9fE5A644e048FEF7194Da10fFEb356a81fFD` |
| Escrow     | `0x5d9a3A8c1EeEfaC85178c5583425Ab25C0C208b3` |
| Reputation | `0xE6766AF6171F437D6d3952e73402b762718c1809` |
| Karma      | `0xA8898F8573a463C167584979dc7E2cD43c24BAdF` |
| owner        | `0x229599f227231d8C90fcF1a78589F5DC4b7A6962` (Zoo DAO Safe) |

**Pars 494949**

| Contract     | Address                                      |
| ------------ | -------------------------------------------- |
| Bounty     | `0x79254D4A9286FBd65E7177440Be20f00934c33c2` |
| Escrow     | `0x82323cf625C3a6DE0f5fB75A2e7bD41BB8200075` |
| Reputation | `0xD7fe65BCb3Efd85AC1E132E8b74365498E034f13` |
| Karma      | `0x81fBD8287571E83D2a834Ae5A8B859092C45b2EA` |
| owner        | `0x4CEA4ac1C874a340B06e0422E77a477463C3a542` (Pars DAO Safe) |

`bountyCount()` + `bounties(i)` give the current struct — eighteen fields, with
the reward asset (`rewardKind` / `rewardToken` / `rewardTokenId` / `reward`) and
the stake asset (`stakeToken` / `stake`) recorded apart, so a reward can be an
NFT while the worker's stake stays fungible. The twelve lifecycle events give the
activity log, `BountyProposed` / `WorkSubmitted` give `issueRef` /
`deliverableRef`, and `Reputation.completedOf` / `earnedOf` give the worker's
score. ABIs are copied into `src/abi.ts` from the Foundry artifact (no cross-repo
import) and `src/abi.test.ts` pins the tuple order against it.
