import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ENV } from "./utils/env.js"
import path from "path";
import userRouter from "./routes/user.router.js";
import fileRouter from "./routes/file.router.js";
import analysisRouter from "./routes/analysis.router.js";
import jobMatchRouter from "./routes/jobMatch.router.js";
import connectDb from "./config/db.js";

const app = express();

const __dirname = path.resolve();

app.use(express.json());
app.use(cors({
  origin: ENV.NODE_ENV === "production" ? ENV.CLIENT_URL : true,
  credentials: true,
}));
app.use(cookieParser());
app.set("trust proxy", 1);

app.get("/v1/api/message", (_, res) => {
  res.status(200).json({ message: "Hello From the Server" })
});

app.use('/v1/api', userRouter);
app.use("/v1/api", fileRouter);
app.use("/v1/api", analysisRouter);
app.use("/v1/api", jobMatchRouter);

//make our app ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/{*any}", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

const startServer = async () => {
  try {
    await connectDb();
    app.listen(ENV.PORT, `${ENV.IP_CONFIG}`, () => {
      console.log("Server is running on port: ", ENV.PORT);
    });
  } catch (err) {
    console.log("Error in Server Running");
  }
};

startServer();

