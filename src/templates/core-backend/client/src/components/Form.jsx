import { useState } from "react";

const Form = ({ clearState, handleSubmit }) => {
  const [input, setInput] = useState("");

  const handleCalculateClick = (e) => {
    e.preventDefault();
    handleSubmit(input);
  };

  const handleClearClick = () => {
    setInput("");
    clearState();
  };

  return (
    <form onSubmit={(e) => handleCalculateClick(e)}>
      <label htmlFor="input-number">Number</label>
      <input
        onChange={(e) => setInput(e.target.value)}
        id="input-number"
        aria-label="input-number"
        type="number"
        value={input}
        required
        min={2}
        max={30000000}
      />
      <button type="submit">Calculate</button>
      <button type="button" onClick={handleClearClick}>
        Clear
      </button>
    </form>
  );
};

export default Form;
