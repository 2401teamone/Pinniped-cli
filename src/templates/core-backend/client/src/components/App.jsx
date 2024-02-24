import "./App.css";
import React, { useState } from "react";
import getMedianPrime from "../services/medianPrime";
import ErrorPage from "./ErrorPage";
import Results from "./Results";
import Form from "./Form";
import Header from "./Header";

function App() {
  const [lastSubmitted, setLastSubmitted] = useState("");
  const [medianPrime, setMedianPrime] = useState([]);
  const [error, setError] = useState("");

  const handleSubmit = async (input) => {
    try {
      const response = await getMedianPrime(parseInt(input));
      setLastSubmitted(input);
      setMedianPrime(response);
    } catch (error) {
      setError(error.message);
      console.error(error);
    }
  };

  const clearState = () => {
    setLastSubmitted("");
    setMedianPrime([]);
  };

  if (error) {
    return <ErrorPage error={error} />;
  }

  return (
    <div>
      <Header />
      <Form clearState={clearState} handleSubmit={handleSubmit} />
      <Results lastSubmitted={lastSubmitted} medianPrime={medianPrime} />
    </div>
  );
}

export default App;
