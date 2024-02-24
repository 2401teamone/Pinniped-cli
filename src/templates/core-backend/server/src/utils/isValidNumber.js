export const isValidNumber = (n) => {
  n = parseInt(n);

  if (isNaN(n) || n < 2 || n > 30000000) {
    return false;
  }
  return true;
};
