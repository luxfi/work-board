# Zoo DAO — Work Board

On-chain bounty kanban for the Zoo DAO — the DAO's "dework". It reads the live
BountyV1 / EscrowV1 / ReputationV1 work-market on Zoo (chain 200200) directly over
JSON-RPC (no subgraph) and renders it as a kanban board. The differentiator is the
**portable on-chain reputation** surfaced on every card: it lives in ReputationV1 and
travels with the worker's address, not the platform.

## Run

    npm install
    npm run dev        # http://localhost:5173  (proxies /rpc -> 127.0.0.1:9631 port-forward)
    npm run build      # tsc --noEmit && vite build  ->  dist/
    npm run preview     # serve the production build

Point the dev proxy at any node instead of the local port-forward:

    RPC_TARGET=https://api.zoo.network npm run dev

If the RPC is unreachable, the board renders a faithful dev fixture of live bounty #0
(behind the same render path) so the UI stays verifiable; the source badge shows FIXTURE.

## Config

All chain / addresses / RPC live in one file: `src/config.ts`.
For production, build with the real RPC baked in:

    VITE_RPC_URL=https://api.zoo.network/v1/bc/C/rpc npm run build

## Deploy

CI (`.github/workflows/docker.yml`) builds the image on every push to `main` on
luxfi's in-cluster ARC pool and pushes it to
`ghcr.io/luxfi/work-board:sha-<commit>` — never built locally. It runs on
zoo-k8s (namespace `zoo-mainnet`) behind hanzoai/ingress (Traefik) at
**https://work.zoo.network**. Manifests live in `k8s/`:

- `deployment.yaml` + `service.yaml` — 2 replicas serving `dist` on :3000,
  Service :80 → :3000. Pin the Deployment to the CI tag, then
  `kubectl -n zoo-mainnet apply -f k8s/deployment.yaml -f k8s/service.yaml`.
- `route.yaml` — the Traefik dynamic-config router (host → Service, TLS via the
  ingress's built-in ACME / Cloudflare DNS-01 resolver). hanzoai/ingress routes
  every public zoo host through the `zoo-dynamic` ConfigMap (`@file` provider),
  not Ingress objects; merge this fragment in (see the header in `route.yaml`).

## Data source (Zoo 200200)

| Contract     | Address                                      |
| ------------ | -------------------------------------------- |
| BountyV1     | `0x3EDb4a0104614b4aC12D5babCE984291aE8BE8E7` |
| EscrowV1     | `0x095E68282aea751Cc70A2Be565270f1B6AB0229C` |
| ReputationV1 | `0xed976852e8c2b1283e4F475845046B679224460D` |
| owner        | `0x229599f227231d8C90fcF1a78589F5DC4b7A6962` (Zoo DAO Safe) |

`bountyCount()` + `bounties(i)` give the current struct; `BountyProposed` /
`WorkSubmitted` logs give `issueRef` / `deliverableRef`; `ReputationV1.completedOf` /
`earnedOf` give the worker's score. ABIs are copied into `src/abi.ts` (no cross-repo import).
