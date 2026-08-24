import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import authRoutes from "../routes/authRoutes.js";
import messageRoutes from "../routes/messageRoutes.js";
import callRoutes from "../routes/callRoutes.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/calls", callRoutes);

app.get("/", (_, res) => {
  res.json({
    success: true,
    message: "Welcome to SynDesk API 🚀",
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}`);
  console.error("Error Details:", err);
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

export default app;