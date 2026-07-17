# Work Board

White-label on-chain bounty kanban — a DAO's "dework". It reads a live
BountyV1 / EscrowV1 / ReputationV1 work-market directly over JSON-RPC (no
subgraph) and renders it as a kanban board. The differentiator is the
**portable on-chain reputation** surfaced on every card: it lives in
ReputationV1 and travels with the worker's address, not the platform.

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
    npm run preview     # serve the production build

Point the dev proxy at any node instead of the local port-forward, and select a
brand:

    RPC_TARGET=https://api.pars.network npm run dev
    VITE_BRAND=pars VITE_RPC_URL=https://api.pars.network/v1/bc/C/rpc npm run build

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

**Zoo 200200**

| Contract     | Address                                      |
| ------------ | -------------------------------------------- |
| BountyV1     | `0x3EDb4a0104614b4aC12D5babCE984291aE8BE8E7` |
| EscrowV1     | `0x095E68282aea751Cc70A2Be565270f1B6AB0229C` |
| ReputationV1 | `0xed976852e8c2b1283e4F475845046B679224460D` |
| owner        | `0x229599f227231d8C90fcF1a78589F5DC4b7A6962` (Zoo DAO Safe) |

**Pars 494949**

| Contract     | Address                                      |
| ------------ | -------------------------------------------- |
| BountyV1     | `0x316B41c886c7D4B4e38cBB08a243776Ed977cf1F` |
| EscrowV1     | `0xD5890D32d603a04E35ec7dBAbDCD0CA400f07E92` |
| ReputationV1 | `0x155d1363c23467929FB709FCFa0afC51F3497aB6` |
| owner        | `0x4CEA4ac1C874a340B06e0422E77a477463C3a542` (Pars DAO Safe) |

`bountyCount()` + `bounties(i)` give the current struct; `BountyProposed` /
`WorkSubmitted` logs give `issueRef` / `deliverableRef`; `ReputationV1.completedOf` /
`earnedOf` give the worker's score. ABIs are copied into `src/abi.ts` (no cross-repo import).
