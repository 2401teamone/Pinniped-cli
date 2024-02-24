import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes";
const app = express();

const PORT = process.env.PORT || 3000;

//serve static files from the cliet/dist directory
app.use(express.static("../client/dist"));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/medianprime", routes.medianprime);

// Catch all other requests and return 404
app.use((req, res) => res.status(404).send("404 Not Found"));

export default app.listen(PORT, () =>
  console.log(`Example app listening on port ${process.env.PORT}!`)
);
