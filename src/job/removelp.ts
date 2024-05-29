import { DEX } from "@ston-fi/sdk";
import { AddLiquidityFunction, AddLiquidityFunctionInternal, AddLiquidityTransaction, DexSelector, RemoveLiquidityFunction, RemoveLiquidityFunctionInternal, RemoveLiquidityTransaction, TransactionReceipt, UserAccountInfo } from "../types/Dex";
import TonWeb from "tonweb";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Address, Cell, internal, WalletContractV4 } from "@ton/ton";
import { createTonClient } from "../utils/tonClient";
import Big from "big.js";
import { sendTransactionStonfi } from "../utils/sendTransaction";

const removeLiquidityStonfi: RemoveLiquidityFunctionInternal = async (userAccountInfo, removeLiquidityTransaction) => {
  // testnet
  const router = new DEX.v1.Router({
    tonApiClient: new TonWeb.HttpProvider(
      "https://testnet.toncenter.com/api/v2/jsonRPC",
      {
        apiKey: "c100b9866a13182a4cdd5fb21e8932790c1982185b64fcbf33dde0f24ee18c81"
      }
    ),
    address: "kQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33a1n"
  });
  // testnet
  const pTonAddress = "kQAcOvXSnnOhCdLYc6up2ECYwtNNTzlmOlidBeCs5cFPV7AM";
  const pool = await router.getPool({
    token0: removeLiquidityTransaction.tokenA === "0x0" ? pTonAddress : removeLiquidityTransaction.tokenA,
    token1: removeLiquidityTransaction.tokenB === "0x0" ? pTonAddress : removeLiquidityTransaction.tokenB,
  });
  if (!pool) {
    throw Error(`not a valid jetton`);
  }
  try {
    // check if pool exists
    await pool.getData();
  } catch (e) {
    // create pool
    throw Error(`Pool for ${removeLiquidityTransaction.tokenA}/${removeLiquidityTransaction.tokenB} not found`);
  }
  const lpTokenWallet = await pool.getJettonWallet({
    ownerAddress: userAccountInfo.walletAddress,
  });
  const lpTokenWalletData = await lpTokenWallet.getData();
  const lpRemoveAmount = new TonWeb.utils.BN(removeLiquidityTransaction.liquidityAmount);
  if (lpRemoveAmount.gt(lpTokenWalletData.balance)) {
    throw Error(`Insufficient liquidity`);
  }
  const txParams = await pool.buildBurnTxParams({
    amount: lpRemoveAmount,
    responseAddress: userAccountInfo.walletAddress,
  });
  const key = await mnemonicToWalletKey(userAccountInfo.mnemonic!.split(" "));
  return await sendTransactionStonfi(txParams, key);
}

export const removeLiquidity: RemoveLiquidityFunction = async (dexSelector: DexSelector, userAccountInfo: UserAccountInfo, removeLiquidityTransaction: RemoveLiquidityTransaction) => {
  // if (dexSelector.dexId === "stonfi") {
  return await removeLiquidityStonfi(userAccountInfo, removeLiquidityTransaction);
  // }
}

async function main() {
  const dexSelector: DexSelector = {
    dexId: "stonfi",
    chainId: "TON",
  };
  const userAccountInfo: UserAccountInfo = {
    walletAddress: "0QAEOqtH6YqGg_3gYWPytwil0dAPytjaoLnqIwU7JRbpGF-E",
    mnemonic: "critic struggle pig cloud focus toddler second ostrich bird turkey achieve burst common media rather stay cave mystery total suit beef club hand cheese"
  }
  const removeLiquidityTransaction: RemoveLiquidityTransaction = {
    tokenA: "kQDVAG0dsq3O7eB1uO_g5nUuU1zqyES7Hkxj7-SHhoNdYFPF",
    tokenB: "kQD9ajyJa_0Z6Crz4fxcVdilk5MaALPf43Kn24ZddZbXCkrJ",
    liquidityAmount: "1000000000",
    amountAMin: "1000000000",
    amountBMin: "1000000000000000000",
  }
  const result = await removeLiquidity(dexSelector, userAccountInfo, removeLiquidityTransaction);
  console.log(result);
}

main();