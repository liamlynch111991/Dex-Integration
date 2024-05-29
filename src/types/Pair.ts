export interface Pair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  tokenA: string;
  tokenB: string;
  midPrice: {
    tokenAinB: string,
    tokenBinA: string,
  };
  liquidity: {
    totalInUsd?: number;
    tokenA: string;
    tokenB: string;
  };
  fdv?: number;
  pairCreatedAt?: number;
  token0WalletAddress?: string; // non EVM
  token1WalletAddress?: string; // non EVM
}