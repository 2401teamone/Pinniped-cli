import { pnpd } from "pinniped";
import "dotenv/config";

let serverConfig = {
  port: process.env.SERVER_PORT,
  domain: process.env.SERVER_DOMAIN,
  altNames: process.env.SERVER_ALTNAMES,
  directory: process.env.SERVER_DIRECTORY,
};

const app = pnpd(serverConfig);

// Extensibility Invocations

// add custom routes
app.addRoute("GET", "/seals", (req, res, next) => {
  res.json({ custom: "elephant seals" });
});

// add event-driven functionality
app.onGetOneRow("seals").add((event) => {
  console.log("Triggered event: onGetAllRows");
});

app.start();
