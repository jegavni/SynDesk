import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/db.js";
import { server } from "./config/socket.js";


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  connectDB();
});