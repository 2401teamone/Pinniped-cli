import { pnpd } from "pinniped";
import "dotenv/config";

let serverConfig = {
  port: process.env.SERVER_PORT,
  domain: process.env.SERVER_DOMAIN,
  altNames: process.env.SERVER_ALTNAMES,
  directory: process.env.SERVER_DIRECTORY,
};

const app = pnpd(serverConfig);

/*
Extensibility Invocations

Add Event-Driven Functionality
app.onGetOneRow.addListener(
  async (event) => {
    // `event` argument contains the Express request and response
    //  along with the event specific data from the database
    const { req, res, data } = event;

    // Use an external API data to enrich the response
    const latestSealSightings = await sealSightingsApi(data.row.species);

    // Conditionally return responses based on application specific logic
    if (latestSealSightings.length === 0) {
      res.status(404).json({ message: "No sightings found for seal." });
      return;
    } else {
      data.row.latestSightings = latestSealSightings;
      res.status(200).json(row);
    }
  },
  ["seals"] // Only listen for getOneRow events for the "seals" table
);

Add Custom Routes
app.addRoute("GET", "/seal-sightings", async (req, res) => {
  // Implement route specific authorization logic
  if (!req.session.user) {
    res.status(401).json({ message: "Unauthenticated" });
    return;
  }

  // Interact with an external API to get all seal sightings
  const sightings = await sealSightingsApi();

  // Return the response to the client
  res.status(200).json(sightings);
});
*/

app.start();
