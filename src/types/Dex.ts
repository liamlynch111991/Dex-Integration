export interface DexSelector {
  chainId: string;
  dexId: string;
}

export interface UserAccountInfo {
  walletAddress: string;
  privateKey?: string;
  mnemonic?: string;
}

export interface SwapTransaction {
  fromToken: string;
  toToken: string;
  amountIn: string;
  minAmountOut: string;
  deadline?: string;
}

export interface AddLiquidityTransaction {
  tokenA: string;
  tokenB: string;
  amountADesired: string;
  amountBDesired: string;
  amountAMin: string;
  amountBMin: string;
  toAddress?: string;
  minLpOut?: string; // if dont have, calculate by formula
  deadline?: string;
  isStable?: string; // stable or volatile
}

export interface RemoveLiquidityTransaction {
  tokenA: string;
  tokenB: string;
  liquidityAmount: string
  amountAMin: string;
  amountBMin: string;
  toAddress?: string;
  deadline?: string;
}

export interface DexIntegrationV2 {
  dexSelector: DexSelector;
  userAccountInfo: UserAccountInfo;
  swapTransaction?: SwapTransaction;
  liquidityTransaction?: AddLiquidityTransaction | RemoveLiquidityTransaction;
}

export interface TransactionReceipt {
  transactionHash: string;
  status?: string;
  blockNumber?: number;
  gasUsed?: number;
  errorMessage?: string;
}

export interface SwapFunction {
  (dexSelector: DexSelector, userAccountInfo: UserAccountInfo, swapTransaction: SwapTransaction): Promise<TransactionReceipt>;
}

export interface SwapFunctionInternal {
  (userAccountInfo: UserAccountInfo, swapTransaction: SwapTransaction): Promise<TransactionReceipt>;
}

export interface AddLiquidityFunction {
  (dexSelector: DexSelector, userAccountInfo: UserAccountInfo, addLiquidityTransaction: AddLiquidityTransaction): Promise<TransactionReceipt[]>;
}

export interface AddLiquidityFunctionInternal {
  (userAccountInfo: UserAccountInfo, addLiquidityTransaction: AddLiquidityTransaction): Promise<TransactionReceipt[]>;
}

export interface RemoveLiquidityFunction {
  (dexSelector: DexSelector, userAccountInfo: UserAccountInfo, removeLiquidityTransaction: RemoveLiquidityTransaction): Promise<TransactionReceipt>;
}

export interface RemoveLiquidityFunctionInternal {
  (userAccountInfo: UserAccountInfo, removeLiquidityTransaction: RemoveLiquidityTransaction): Promise<TransactionReceipt>;
}