import { Address, Cell, internal, JettonWallet, Transaction, WalletContractV4 } from "@ton/ton";
import { DexSelector, SwapFunction, SwapFunctionInternal, SwapTransaction, TransactionReceipt, UserAccountInfo } from "../types/Dex";
import { mnemonicToWalletKey } from "@ton/crypto";
import TonWeb from "tonweb";
import { DEX } from "@ston-fi/sdk";
import { createTonClient } from "../utils/tonClient";
import Big from "big.js";
import { sendTransactionStonfi } from "../utils/sendTransaction";

// change router and pTonAddress to mainnet for mainnet purposes
const swapStonfi: SwapFunctionInternal = async (userAccountInfo, swapTransaction) => {
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
  let params
  if (swapTransaction.fromToken === "0x0") {
    params = await router.buildSwapTonToJettonTxParams({
      userWalletAddress: userAccountInfo.walletAddress,
      proxyTonAddress: pTonAddress,
      offerAmount: new TonWeb.utils.BN(swapTransaction.amountIn),
      askJettonAddress: swapTransaction.toToken,
      minAskAmount: new TonWeb.utils.BN(swapTransaction.minAmountOut)
    });
  } else if (swapTransaction.toToken === "0x0") {
    params = await router.buildSwapJettonToTonTxParams({
      userWalletAddress: userAccountInfo.walletAddress,
      proxyTonAddress: pTonAddress,
      offerAmount: new TonWeb.utils.BN(swapTransaction.amountIn),
      minAskAmount: new TonWeb.utils.BN(swapTransaction.minAmountOut),
      offerJettonAddress: swapTransaction.fromToken
    });
  } else if (swapTransaction.fromToken !== "0x0" && swapTransaction.toToken !== "0x0") {
    const pool = await router.getPool({
      token0: swapTransaction.fromToken,
      token1: swapTransaction.toToken,
    });
    if (!pool) {
      throw Error(`Pool for ${swapTransaction.fromToken}/${swapTransaction.toToken} not found`);
    }
    try {
      await pool.getData();
    } catch (e) {
      throw Error(`Pool for ${swapTransaction.fromToken}/${swapTransaction.toToken} not found`);
    }
    params = await router.buildSwapJettonToJettonTxParams({
      userWalletAddress: userAccountInfo.walletAddress,
      offerJettonAddress: swapTransaction.fromToken,
      offerAmount: new TonWeb.utils.BN(swapTransaction.amountIn),
      askJettonAddress: swapTransaction.toToken,
      minAskAmount: new TonWeb.utils.BN(swapTransaction.minAmountOut),
    })
  }
  if (params === undefined) {
    throw new Error("Invalid swap transaction");
  }
  const key = await mnemonicToWalletKey(userAccountInfo.mnemonic!.split(" "));
  return await sendTransactionStonfi(params, key);
}

export const swap: SwapFunction = async (dexSelector, userAccountInfo, swapTransaction) => {
  // if (dexSelector.dexId === "stonfi") {
  return await swapStonfi(userAccountInfo, swapTransaction);
  // }
}

async function main() {
  const dexSelector: DexSelector = {
    chainId: "TON",
    dexId: "stonfi",
  };

  const userAccountInfo: UserAccountInfo = {
    walletAddress: "0QAEOqtH6YqGg_3gYWPytwil0dAPytjaoLnqIwU7JRbpGF-E",
    mnemonic: "critic struggle pig cloud focus toddler second ostrich bird turkey achieve burst common media rather stay cave mystery total suit beef club hand cheese"
  }

  // const swapTransaction: SwapTransaction = {
  //   fromToken: "0x0",
  //   toToken: "kQDVAG0dsq3O7eB1uO_g5nUuU1zqyES7Hkxj7-SHhoNdYFPF",
  //   amountIn: "1000000000",
  //   minAmountOut: "0",
  //   deadline: "0",
  // }

  // doge -> MIT
  const swapTransaction: SwapTransaction = {
    fromToken: "kQDVAG0dsq3O7eB1uO_g5nUuU1zqyES7Hkxj7-SHhoNdYFPF",
    toToken: "kQD9ajyJa_0Z6Crz4fxcVdilk5MaALPf43Kn24ZddZbXCkrJ",
    amountIn: "1000000000",
    minAmountOut: "0",
    deadline: "0",
  }

  // const swapTransaction: SwapTransaction = {
  //   fromToken: "kQDVAG0dsq3O7eB1uO_g5nUuU1zqyES7Hkxj7-SHhoNdYFPF",
  //   toToken: "0x0",
  //   amountIn: (1 * 10 ** 9).toString(),
  //   minAmountOut: "0",
  //   deadline: "0",
  // }

  await swap(dexSelector, userAccountInfo, swapTransaction);
}

main();

