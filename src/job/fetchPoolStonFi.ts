import TonWeb from 'tonweb';
import { DEX } from '@ston-fi/sdk';
import { Pair } from '../types/Pair';
import { getJettonInfo } from '../utils/getJettonMetadata';
import { createTonClient } from '../utils/tonClient';
import { Address } from '@ton/core';

export async function fetchPoolStonfi(JETTON_0_ADDRESS: string, JETTON_1_ADDRESS: string) {
  const router = new DEX.v1.Router({
    tonApiClient: new TonWeb.HttpProvider(
      'https://toncenter.com/api/v2/jsonRPC',
      {
        apiKey: '1d7236148b3997270c4350fe9b79e5ee7997618d7b552881d58c4c3531654315',
      }
    ),
  });

  const pair: Pair = {
    chainId: "TON",
    dexId: "stonfi",
    url: "https://ston.fi",
    pairAddress: "",
    tokenA: JETTON_0_ADDRESS,
    tokenB: JETTON_1_ADDRESS,
    liquidity: {
      tokenA: "0",
      tokenB: "0",
    },
    midPrice: {
      tokenAinB: "0",
      tokenBinA: "0",
    }
  };
  // create a pool instance
  const pool = await router.getPool({
    token0: JETTON_0_ADDRESS,
    token1: JETTON_1_ADDRESS,
  });

  if (!pool) {
    throw Error(`Not a valid jetton`);
  }
  const poolAddress = await pool.getAddress();
  let poolData;
  try {
    poolData = await pool.getData();
  } catch (e) {
    throw Error(`Pool for ${JETTON_0_ADDRESS}/${JETTON_1_ADDRESS} not exist`);
  }
  pair.liquidity = {
    tokenA:
      poolData.reserve0.toString(),
    tokenB:
      poolData.reserve1.toString(),
  }
  pair.pairAddress = poolAddress.toString();
  pair.token0WalletAddress = poolData.token0WalletAddress.toString();
  pair.token1WalletAddress = poolData.token1WalletAddress.toString();
  // const token0Info = await getJettonInfo(JETTON_0_ADDRESS);
  // const token1Info = await getJettonInfo(JETTON_1_ADDRESS);
  // console.log(token1Info);
  const client = createTonClient("mainnet");
  const jettonMasterContract = client.provider(Address.parse(JETTON_1_ADDRESS));
  const res = await jettonMasterContract.get("get_jetton_data", []);
  const totalSupply = res.stack.readNumber();
  const mintable = res.stack.readBooleanOpt();
  const adminAddress = res.stack.readAddressOpt();
  const content = res.stack.readCell();
  const walletCode = res.stack.readCellOpt();
  return pair;
}

//                    EQDQoc5M3Bh8eWFephi9bClhevelbZZvWhkqdo80XuY_0qXv
const pTON_ADDRESS = "EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez";
const USDT_ADDRESS = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs";

fetchPoolStonfi(pTON_ADDRESS, USDT_ADDRESS).catch(console.error);
