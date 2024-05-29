import express, { Express, Request, Response } from "express";
import { Pair } from "../types/Pair";
// import { fetchPoolStonfi } from "../job/fetchPoolStonFi";

const router = express.Router();

router.get("/fetchPool", async (req: Request, res: Response) => {
  const { token0, token1 } = req.query;

  if (!token0 || !token1) {
    return res.status(400).send("Missing token0 or token1");
  }
  // const pair: Pair[] = [];
  // fetch pool data from stonfi
  // pair.push(await fetchPoolStonfi(token0 as string, token1 as string));
});

export default router;