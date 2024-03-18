import pinniped from "pinniped";

const app = pinniped.createApp();

// Extensibility Invocations
app.addRoute("GET", "/custom", (req, res, next) => {
  res.json({ custom: "elephant seals" });
});

// API Path is Reserved
// app.addRoute("GET", "/api/custom", (req, res, next) => {
//   res.json({ custom: "elephant seals" });
// });

// Handler is Invoked on "GET_ALL_ROWS" Event
// app.onGetAllRows("random-table", "todos").add((event) => {
//   console.log("RUNNING EVENT 1");
//   if (event.table === "random-test") event.res.status(200).send();
// });

// app.onGetAllRows("todos").add((event) => {
//   console.log("RUNNING EVENT 2");
// });

// app.onGetOneRow().add();

app.start(3000);
