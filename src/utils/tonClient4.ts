import { TonClient4 } from "@ton/ton";

export function createTonClient(net?: 'testnet' | 'mainnet') {
  return new TonClient4({
    endpoint: net === 'mainnet' ? 'https://mainnet.tonhubapi.com/jsonRPC/32df40f4ffc11053334bcdf09c7d3a9e6487ee0cb715edf8cf667c543edb10ca' : 'https://testnet.toncenter.com/api/v2/jsonRPC',
  });
}