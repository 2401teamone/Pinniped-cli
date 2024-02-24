const { medianPrime } = require("./calculateMedianPrime");

describe("medianPrime", () => {
  it("should return the median prime numbers up to the given limit", () => {
    // Test case 1
    let n = 10;
    let expectedOutput = [3, 5];
    expect(medianPrime(n)).toEqual(expectedOutput);

    // Test case 2
    n = 18;
    expectedOutput = [7];
    expect(medianPrime(n)).toEqual(expectedOutput);

    // Test case 3
    n = 30;
    expectedOutput = [11, 13];
    expect(medianPrime(n)).toEqual(expectedOutput);

    // Additional test cases can be added here
  });

  it("should return an empty array if the given limit is less than 0", () => {
    // Test case 1
    let n = -1;
    let expectedOutput = [];
    expect(medianPrime(n)).toEqual(expectedOutput);

    // Test case 2
    n = -10;
    expectedOutput = [];
    expect(medianPrime(n)).toEqual(expectedOutput);

    // Additional test cases can be added here
  });

  it("should return an empty array if the given limit is greater than 30,000,000", () => {
    // Test case 1
    let n = 30000001;
    let expectedOutput = [];
    expect(medianPrime(n)).toEqual(expectedOutput);
  });
});
