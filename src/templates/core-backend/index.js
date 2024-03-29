import { pnpd } from "pinniped";

let serverConfig = {
  port: 3000,
  // domain:
  // cors:
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
