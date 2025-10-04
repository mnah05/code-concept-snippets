
// Base function that fetches from a public API
async function fetchData() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts");
  if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
  return res.json();
}

// Retry decorator (with exponential backoff)
function retryRequest(fn, maxRetries = 3, baseDelay = 300) {
  return async (...args) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (err) {
        if (attempt === maxRetries - 1)
          throw new Error(`Failed after ${maxRetries} attempts: ${err.message}`);
        const delay = baseDelay * 2 ** attempt;
        console.warn(`Retry #${attempt + 1} in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  };
}

// Cache decorator (5 second cache window)
function cacheRequest(fn, ttl = 5000) {
  let cache = null;
  let timestamp = 0;

  return async (...args) => {
    const now = Date.now();
    if (cache && now - timestamp < ttl) {
      console.log("⚡ Serving from cache...");
      return cache;
    }
    const result = await fn(...args);
    cache = result;
    timestamp = now;
    return result;
  };
}

// Compose both decorators
const enhanced = cacheRequest(retryRequest(fetchData));

// Main function
async function main() {
  try {
    console.log("First call:");
    const data1 = await enhanced();
    console.log("✅ Success:", data1[0]);

    console.log("\nSecond call (within 5s, should use cache):");
    const data2 = await enhanced();
    console.log("✅ Success:", data2[0]);

    console.log("\nWaiting 6 seconds...");
    await new Promise((r) => setTimeout(r, 6000));

    console.log("\nThird call (after 5s, should fetch again):");
    const data3 = await enhanced();
    console.log("✅ Success:", data3[0]);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// Run
main();
