import { resolveBrand, resolveBrandKey } from './brands';

// The one place chain / addresses / RPC live. Brand-varying values come from the
// brand map (src/brands.ts), selected by the VITE_BRAND build-arg (default zoo).

const BRAND = resolveBrand(import.meta.env.VITE_BRAND);

export const BRAND_KEY = resolveBrandKey(import.meta.env.VITE_BRAND);

export const CHAIN_ID = BRAND.chainId;
export const CHAIN_NAME = BRAND.chainName;
export const NATIVE_SYMBOL = BRAND.nativeSymbol;

// Dev: '/rpc' is proxied by Vite to the port-forwarded node (see vite.config.ts).
// Prod: build bakes VITE_RPC_URL (docker.yml passes the brand's canonical RPC).
export const RPC_URL: string = import.meta.env.VITE_RPC_URL ?? '/rpc';

export const ADDRESSES = BRAND.addresses;

export const OWNER_LABEL = BRAND.ownerLabel;

// Organisation name for the header, e.g. 'Zoo DAO' / 'Pars DAO'.
export const ORG_NAME = BRAND.org;

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const REFRESH_MS = 15_000;
