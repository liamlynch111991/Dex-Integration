// import { Factory, MAINNET_FACTORY_ADDR, PoolType, Asset, Pool } from '@dedust/sdk';
// import { Address, TonClient4 } from "@ton/ton";
// import { Pair } from '../types/Pair';
// import TonWeb from 'tonweb';

// const tonClient = new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" });
// const factory = tonClient.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));

// const getPairData = async (poolType: PoolType, asset0: Asset, asset1: Asset): Promise<Pair> => {
//   const pair: Pair = {
//     chainId: "TON",
//     dexId: "stonfi",
//     url: "https://ston.fi",
//     pairAddress: "",
//     tokenA: asset0.address?.toString() || "0x0",
//     tokenB: asset1.address?.toString() || "0x0",
//     liquidity: {
//       base: "0",
//       quote: "0",
//     },
//     midPrice: {
//       tokenAinB: "0",
//       tokenBinA: "0",
//     }
//   };

//   try {
//     const pool = await factory.getPool(poolType, [asset0, asset1]);
//     const poolProvider = tonClient.provider(pool.address);
//     const reserve = await pool.getReserves(poolProvider);
//     pair.pairAddress = pool.address.toString();
//     pair.liquidity = {
//       base: {
//         amount: reserve[0].toString(),
//         symbol: "TON",
//         decimals: "9",
//         name: "The Open Network",
//       },
//       quote: {
//         amount: reserve[1].toString(),
//         symbol: "JETTON",
//         decimals: "9",
//         name: "Jetton",
//       },
//     }
//     return pair;
//   } catch (e) {
//     console.error(e);
//     return pair;
//   }
// }

// async function fetchPoolDedustTonAndJetton(JETTON_ADDRESS: string) {
//   const ton = Asset.native();
//   const jetton_0 = Asset.jetton(Address.parse(JETTON_ADDRESS));
//   const pair = await getPairData(PoolType.VOLATILE, ton, jetton_0);
//   return pair;
// }

// async function fetchPoolDedustJettonAndJetton(poolType: PoolType, JETTON_0_ADDRESS: string, JETTON_1_ADDRESS: string) {
//   const jetton_0 = Asset.jetton(Address.parse(JETTON_0_ADDRESS));
//   const jetton_1 = Asset.jetton(Address.parse(JETTON_1_ADDRESS));
//   return await getPairData(poolType, jetton_0, jetton_1);
// }

// const USDT_ADDRESS = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs";
// const USDC_ADDRESS = "EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA";

// fetchPoolDedustTonAndJetton(USDT_ADDRESS).catch(console.error);

// fetchPoolDedustJettonAndJetton(PoolType.STABLE, USDT_ADDRESS, USDC_ADDRESS).catch(console.error);