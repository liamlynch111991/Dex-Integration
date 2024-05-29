import express, { Express, Request, Response } from "express";
import { DexSelector, SwapFunction, SwapTransaction, UserAccountInfo } from "../types/Dex";
import { swap } from "../job/swap";
import { stringify } from "querystring";

const router = express.Router();

router.post("/swap", async (req: Request, res: Response) => {
  const {
    dexSelector,
    userAccountInfo,
    swapTransaction,
  } = req.body as {
    dexSelector: DexSelector;
    userAccountInfo: UserAccountInfo;
    swapTransaction: SwapTransaction;
  };
  console.log(dexSelector);
  console.log(userAccountInfo);
  console.log(swapTransaction);
  try {
    const result = await swap(dexSelector, userAccountInfo, swapTransaction);
    console.log(result);
    return res.send(JSON.stringify(result));
  } catch (e) {
    return res.status(400).send(e);
  }
});

export default router;