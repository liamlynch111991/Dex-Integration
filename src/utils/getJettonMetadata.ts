import { Address, Cell, Slice } from "@ton/core";
import { bitsToPaddedBuffer, JettonMetaDataKeys, OFFCHAIN_CONTENT_PREFIX, ONCHAIN_CONTENT_PREFIX, parseDict, SNAKE_PREFIX, toKey } from '../wrappers/helper';
import axios from 'axios';
import { TonClient } from "@ton/ton";
import { JettonMinter } from "../wrappers/JettonMinter";
import { createTonClient } from "./tonClient";
import { stringify } from "querystring";

const jettonOnChainMetadataSpec: {
  [key in JettonMetaDataKeys]: 'utf8' | 'ascii' | undefined;
} = {
  name: 'utf8',
  description: 'utf8',
  image: 'ascii',
  decimals: 'utf8',
  symbol: 'utf8',
  image_data: undefined,
};

function parseJettonOnchainMetadata(contentSlice: Slice): {
  metadata: { [s in JettonMetaDataKeys]?: string };
  isJettonDeployerFaultyOnChainData: boolean;
} {
  const KEYLEN = 256;

  let isJettonDeployerFaultyOnChainData = false;

  const dict = parseDict(contentSlice.loadRef().beginParse(), KEYLEN, (s) => {
    const buffer = Buffer.from('');

    const sliceToVal = (s: Slice, v: Buffer, isFirst: boolean) => {
      s.asCell().beginParse();
      if (isFirst && s.loadUint(8) !== SNAKE_PREFIX)
        throw new Error('Only snake format is supported');

      const bits = s.remainingBits;
      const bytes = bitsToPaddedBuffer(s.loadBits(bits));
      v = Buffer.concat([v, bytes]);
      if (s.remainingRefs === 1) {
        v = sliceToVal(s.loadRef().beginParse(), v, false);
      }

      return v;
    };

    if (s.remainingRefs === 0) {
      isJettonDeployerFaultyOnChainData = true;
      return sliceToVal(s, buffer, true);
    }

    return sliceToVal(s.loadRef().beginParse(), buffer, true);
  });

  const res: { [s in JettonMetaDataKeys]?: string } = {};

  Object.keys(jettonOnChainMetadataSpec).forEach((k) => {
    const val = dict.get(toKey(k))?.toString(jettonOnChainMetadataSpec[k as JettonMetaDataKeys]);
    if (val) res[k as JettonMetaDataKeys] = val;
  });
  return {
    metadata: res,
    isJettonDeployerFaultyOnChainData,
  };
}

async function parseJettonOffchainMetadata(contentSlice: Slice): Promise<{
  metadata: { [s in JettonMetaDataKeys]?: string };
  isIpfs: boolean;
}> {
  const bits = contentSlice.remainingBits;
  const bytes = bitsToPaddedBuffer(contentSlice.loadBits(bits));
  const jsonURI = bytes.toString('ascii').replace('ipfs://', 'https://ipfs.io/ipfs/');

  return {
    metadata: (await axios.get(jsonURI)).data,
    isIpfs: /(^|\/)ipfs[.:]/.test(jsonURI),
  };
}

export async function readJettonContent(contentCell: Cell) {
  const contentSlice = contentCell.beginParse();

  switch (contentSlice.loadUint(8)) {
    case ONCHAIN_CONTENT_PREFIX:
      return {
        persistenceType: 'onchain',
        ...parseJettonOnchainMetadata(contentSlice),
      };
    case OFFCHAIN_CONTENT_PREFIX: {
      const { metadata, isIpfs } = await parseJettonOffchainMetadata(contentSlice);
      return {
        persistenceType: isIpfs ? 'offchain_ipfs' : 'offchain_private_domain',
        metadata,
      };
    }
    default:
      throw new Error('Unexpected jetton metadata content prefix');
  }
}

export const getJettonInfo = async (address: string) => {
  const client = createTonClient('mainnet');
  const jettonMinterAddress = Address.parse(address);
  const contract = client.open(JettonMinter.createFromAddress(jettonMinterAddress));
  const res = await contract.getJettonData();
  const content = await readJettonContent(res.content);
  const jettonInfo = {
    address,
    adminAddress: res.adminAddress,
    symbol: content.metadata.symbol || '',
    name: content.metadata.name || '',
    description: content.metadata.description || '',
    image: content.metadata.image || '',
    decimals: content.metadata.decimals || '',
    totalSupply: res.totalSupply.toString(),
    jettonWalletCode: res.walletCode,
  };

  return jettonInfo;
};
