import { DEX } from "@ston-fi/sdk";
import { AddLiquidityFunction, AddLiquidityFunctionInternal, AddLiquidityTransaction, DexSelector, TransactionReceipt, UserAccountInfo } from "../types/Dex";
import TonWeb from "tonweb";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Address, Cell, internal, openContract, OpenedContract, Sender, WalletContractV4 } from "@ton/ton";
import { createTonClient } from "../utils/tonClient";
import Big from "big.js";
import { sendTransactionStonfi } from "../utils/sendTransaction";
import { Asset, Factory, MAINNET_FACTORY_ADDR, Pool, PoolType, ReadinessStatus, Vault, VaultJetton, VaultNative } from "@dedust/sdk";

const addLiquidityStonfi: AddLiquidityFunctionInternal = async (userAccountInfo, addLiquidityTransaction) => {
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
    token0: addLiquidityTransaction.tokenA === "0x0" ? pTonAddress : addLiquidityTransaction.tokenA,
    token1: addLiquidityTransaction.tokenB === "0x0" ? pTonAddress : addLiquidityTransaction.tokenB,
  });
  if (!pool) {
    throw Error(`not a valid jetton`);
  }
  let minLpOut;
  try {
    // check if pool exists
    await pool.getData();
    // providing liquidity
    const expectedLp = await pool.getExpectedTokens({
      amount0: new TonWeb.utils.BN(addLiquidityTransaction.amountADesired),
      amount1: new TonWeb.utils.BN(addLiquidityTransaction.amountBDesired),
    })
    minLpOut = expectedLp;
    if (addLiquidityTransaction.minLpOut) {
      minLpOut = new TonWeb.utils.BN(addLiquidityTransaction.minLpOut);
    }
  } catch (e) {
    // create pool
    minLpOut = new TonWeb.utils.BN(1);
  }
  let txsParams;
  if (addLiquidityTransaction.tokenA === "0x0" && addLiquidityTransaction.tokenB !== "0x0") {
    txsParams = await Promise.all([
      router.buildProvideLiquidityTonTxParams({
        userWalletAddress: userAccountInfo.walletAddress,
        sendAmount: new TonWeb.utils.BN(addLiquidityTransaction.amountADesired),
        otherTokenAddress: addLiquidityTransaction.tokenB,
        minLpOut,
        proxyTonAddress: pTonAddress
      }),
      router.buildProvideLiquidityJettonTxParams({
        userWalletAddress: userAccountInfo.walletAddress,
        sendTokenAddress: addLiquidityTransaction.tokenB,
        sendAmount: new TonWeb.utils.BN(addLiquidityTransaction.amountBDesired),
        otherTokenAddress: pTonAddress,
        minLpOut
      }),
    ]);
  } else if (addLiquidityTransaction.tokenA !== "0x0" && addLiquidityTransaction.tokenB === "0x0") {
    txsParams = await Promise.all([
      router.buildProvideLiquidityTonTxParams({
        userWalletAddress: userAccountInfo.walletAddress,
        sendAmount: new TonWeb.utils.BN(addLiquidityTransaction.amountBDesired),
        otherTokenAddress: addLiquidityTransaction.tokenA,
        minLpOut,
        proxyTonAddress: pTonAddress
      }),
      router.buildProvideLiquidityJettonTxParams({
        userWalletAddress: userAccountInfo.walletAddress,
        sendTokenAddress: addLiquidityTransaction.tokenA,
        sendAmount: new TonWeb.utils.BN(addLiquidityTransaction.amountADesired),
        otherTokenAddress: pTonAddress,
        minLpOut
      }),
    ]);
  } else if (addLiquidityTransaction.tokenA !== "0x0" && addLiquidityTransaction.tokenB !== "0x0") {
    txsParams = await Promise.all([
      router.buildProvideLiquidityJettonTxParams({
        userWalletAddress: userAccountInfo.walletAddress,
        sendTokenAddress: addLiquidityTransaction.tokenA,
        sendAmount: new TonWeb.utils.BN(addLiquidityTransaction.amountADesired),
        otherTokenAddress: addLiquidityTransaction.tokenB,
        minLpOut
      }),
      router.buildProvideLiquidityJettonTxParams({
        userWalletAddress: userAccountInfo.walletAddress,
        sendTokenAddress: addLiquidityTransaction.tokenB,
        sendAmount: new TonWeb.utils.BN(addLiquidityTransaction.amountBDesired),
        otherTokenAddress: addLiquidityTransaction.tokenA,
        minLpOut
      }),
    ]);
  }
  if (txsParams === undefined) {
    throw new Error("Invalid add liquidity transaction");
  }
  // send transactions
  const key = await mnemonicToWalletKey(userAccountInfo.mnemonic!.split(" "));
  const transactionResult: TransactionReceipt[] = [];
  for (const [index, txParams] of txsParams.entries()) {
    transactionResult.push(await sendTransactionStonfi(txParams, key));
  }
  return transactionResult;
}

// const addLiquidityDedust: AddLiquidityFunctionInternal = async (userAccountInfo, addLiquidityTransaction) => {
//   const tonClient = createTonClient("mainnet");
//   const factory = tonClient.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));
//   let assetA: Asset, assetB: Asset;
//   let vaultA: OpenedContract<Vault>, vaultB: OpenedContract<Vault>;
//   if (addLiquidityTransaction.tokenA === "0x0") {
//     assetA = Asset.native();
//     vaultA = tonClient.open(await factory.getNativeVault());
//   } else {
//     const tokenAAddress = Address.parse(addLiquidityTransaction.tokenA);
//     assetA = Asset.jetton(tokenAAddress);
//     vaultA = tonClient.open(await factory.getJettonVault(tokenAAddress));
//   }
//   if (addLiquidityTransaction.tokenB === "0x0") {
//     assetB = Asset.native();
//     vaultB = tonClient.open(await factory.getNativeVault());
//   } else {
//     const tokenBAddress = Address.parse(addLiquidityTransaction.tokenB);
//     assetB = Asset.jetton(tokenBAddress);
//     vaultB = tonClient.open(await factory.getJettonVault(tokenBAddress));
//   }
//   const assets: [Asset, Asset] = [assetA, assetB];
//   const pool = tonClient.open(await factory.getPool(addLiquidityTransaction?.isStable ? PoolType.STABLE : PoolType.VOLATILE, assets));
//   const key = await mnemonicToWalletKey(userAccountInfo.mnemonic!.split(" "));
//   const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
//   const walletContract = tonClient.open(wallet);
//   const sender = walletContract.sender(key.secretKey);
//   if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
//     await factory.sendCreateVolatilePool(walletContract.sender(key.secretKey), {
//       assets,
//     });
//     throw new Error(`Pool ${addLiquidityTransaction.tokenA}/${addLiquidityTransaction.tokenB} does not exist.`);
//   }
//   if ((await vaultA.getReadinessStatus()) !== ReadinessStatus.READY) {
//     await factory.sendCreateVault(sender, {
//       asset: assetA,
//     });
//     throw new Error(`Vault ${addLiquidityTransaction.tokenA} does not exist.`);
//   }
//   if ((await vaultB.getReadinessStatus()) !== ReadinessStatus.READY) {
//     await factory.sendCreateVault(sender, {
//       asset: assetB,
//     });
//     throw new Error(`Vault ${addLiquidityTransaction.tokenB} does not exist.`);
//   }
//   const targetBalances: [bigint, bigint] = [BigInt(addLiquidityTransaction.amountADesired), BigInt(addLiquidityTransaction.amountBDesired)];
//   if (addLiquidityTransaction.tokenA === "0x0") {
//     (vaultA as OpenedContract<VaultNative>).sendDepositLiquidity(sender, {
//       poolType: addLiquidityTransaction?.isStable ? PoolType.STABLE : PoolType.VOLATILE,
//       assets,
//       targetBalances,
//       amount: BigInt(addLiquidityTransaction.amountADesired),
//     });
//   } else {
//     const seqno = await walletContract.getSeqno();
//     const payload = VaultJetton.createDepositLiquidityPayload({
//       poolType: addLiquidityTransaction?.isStable ? PoolType.STABLE : PoolType.VOLATILE,
//       assets,
//       targetBalances
//     });
//     walletContract.sendTransfer({
//       seqno,
//       secretKey: key.secretKey,
//       messages: [
//         internal({
//           to: vaultA.address.toString(),
//           value: BigInt(addLiquidityTransaction.amountADesired).toString(),
//           body: payload,
//         }),
//       ],
//     });
//   }
// }

export const addLiquidity: AddLiquidityFunction = async (dexSelector: DexSelector, userAccountInfo: UserAccountInfo, addLiquidityTransaction: AddLiquidityTransaction) => {
  // if (dexSelector.dexId === "stonfi") {
  return addLiquidityStonfi(userAccountInfo, addLiquidityTransaction);
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
  const addLiquidityTransaction: AddLiquidityTransaction = {
    tokenA: "kQDVAG0dsq3O7eB1uO_g5nUuU1zqyES7Hkxj7-SHhoNdYFPF",
    tokenB: "kQD9ajyJa_0Z6Crz4fxcVdilk5MaALPf43Kn24ZddZbXCkrJ",
    amountADesired: "1000000000",
    amountBDesired: "1000000000000000000",
    amountAMin: "0",
    amountBMin: "0",
  }
  await addLiquidity(dexSelector, userAccountInfo, addLiquidityTransaction);
}

main();