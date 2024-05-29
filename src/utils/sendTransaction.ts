import { MessageData } from "@ston-fi/sdk";
import { KeyPair } from "@ton/crypto";
import { createTonClient } from "./tonClient";
import { Address, Cell, internal, WalletContractV4 } from "@ton/ton";
import Big from "big.js";
import { TransactionReceipt } from "../types/Dex";

export async function sendTransactionStonfi(txParams: MessageData, key: KeyPair): Promise<TransactionReceipt> {
  const client = createTonClient("testnet");
  const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
  const contract = client.open(wallet);
  const seqno: number = await contract.getSeqno();
  const totalTonTransfer: string = Big(txParams.gasAmount.toString()).div(10 ** 9).toString();
  const payloadBoc = await txParams.payload.toBoc();
  const payloadBuffer = Buffer.from(payloadBoc);
  const bocCell = Cell.fromBoc(payloadBuffer)[0];
  await contract.sendTransfer({
    seqno,
    secretKey: key.secretKey,
    messages: [
      internal({
        to: txParams.to.toString(),
        value: totalTonTransfer,
        body: bocCell,
        bounce: false
      })
    ],
  });
  let newSeqno = await contract.getSeqno();
  // wait for the transaction to be processed
  while (newSeqno === seqno) {
    newSeqno = await contract.getSeqno();
  }
  const txHash = await client.getTransactions(wallet.address, {
    limit: 1,
  });
  const transactionReceipt: TransactionReceipt = {
    transactionHash: txHash[0].hash().toString("hex"),
  }
  return transactionReceipt;
}