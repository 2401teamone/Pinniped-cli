const Results = ({ lastSubmitted, medianPrime }) => {
  const singlePrime = medianPrime.length === 1;

  return (
    <>
      <h2>Median Prime Results</h2>
      {medianPrime.length > 0 && (
        <p>
          The median prime number{singlePrime ? "" : "s"} between 0 and{" "}
          {lastSubmitted} {singlePrime ? "is" : "are"}{" "}
          <strong>{medianPrime.join(", ")}</strong>
        </p>
      )}
    </>
  );
};

export default Results;
