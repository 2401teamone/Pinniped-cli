import axios from "axios";

const getMedianPrime = async (n) => {
  const response = await axios.get(`http://localhost:3000/medianprime?n=${n}`);
  return response.data;
};

export default getMedianPrime;
