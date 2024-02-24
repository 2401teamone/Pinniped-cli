const sieveOfEratosthenes = (n) => {
  // O(n log log n) time complexity
  let primes = Array(n + 1).fill(true); // Assume all numbers in array are prime
  primes[0] = false; // Except for 0 and 1
  primes[1] = false;

  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (primes[i]) {
      // Start from i^2, because all previous multiples of i will have already been marked as non-prime
      for (let j = i * i; j <= n; j += i) {
        primes[j] = false; // Mark factors non-prime
      }
    }
  }

  return primes.reduce((acc, isPrime, index) => {
    if (isPrime) acc.push(index);
    return acc;
  }, []);
};

const medianPrime = (n) => {
  if (n < 2 || n > 30000000) {
    return [];
  }

  const primeNumArray = sieveOfEratosthenes(n);
  const evenLength = primeNumArray.length % 2 === 0;
  const medianIndex = evenLength
    ? primeNumArray.length / 2
    : Math.floor(primeNumArray.length / 2);

  if (evenLength) {
    return primeNumArray.slice(medianIndex - 1, medianIndex + 1);
  } else {
    return primeNumArray.slice(medianIndex, medianIndex + 1);
  }
};

module.exports = { medianPrime };
