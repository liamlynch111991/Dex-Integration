import express, { Express, Request, Response } from "express";
import fetchPoolRouter from "./route/fetchPool";
import swapRouter from "./route/swapRoute";

const app = express();
app.use(express.json());
// app.use("/apiV1", fetchPoolRouter);
app.use("/apiV1", swapRouter);


app.get("/", (req: Request, res: Response) => {
  res.send("Dex Integration Server");
});

app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});