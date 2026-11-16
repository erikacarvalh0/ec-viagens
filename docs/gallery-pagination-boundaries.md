# Gallery pagination boundaries

The cursor helper now accepts immutable arrays and enforces an integer page size between 1 and 100. The default remains 24. This prevents invalid sizes from generating an undefined or misleading next-page cursor; it does not change the existing gallery query or database pagination strategy.
