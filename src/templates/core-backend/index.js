import { pnpd } from "pinniped";

const app = pnpd();

// Extensibility Invocations

// add custom routes
app.addRoute("GET", "/custom", (req, res, next) => {
  res.json({ custom: "elephant seals" });
});

// add event-driven functionality
app.onGetOneRow("seals").add((event) => {
  console.log("Triggered event");
});

app.start(3000);
