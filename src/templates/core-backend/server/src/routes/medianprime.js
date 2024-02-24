import { Router } from "express";
import { medianPrime } from "../utils/calculateMedianPrime";
("../utils/calculateMedianPrime");
import { isValidNumber } from "../utils/isValidNumber";

const router = Router();

router.get("/", (req, res) => {
  const n = req.query.n;

  if (!isValidNumber(n)) {
    res
      .status(400)
      .send(
        "Bad Request. Please provide a positive integer between 2 and 100,000,000."
      );
  }

  const result = medianPrime(parseInt(n));

  res.json(result);
});

export default router;
