import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const responseTime = new Trend("response_time");
const requestCount = new Counter("requests_total");

// Load test configuration
export const options = {
  scenarios: {
    // Smoke test - minimal load
    smoke: {
      executor: "constant-vus",
      vus: 1,
      duration: "30s",
      tags: { test_type: "smoke" },
    },
    // Load test - normal expected load
    load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 10 }, // Ramp up to 10 users
        { duration: "1m", target: 10 }, // Stay at 10 users
        { duration: "30s", target: 0 }, // Ramp down
      ],
      tags: { test_type: "load" },
    },
    // Stress test - beyond normal capacity
    stress: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 25 }, // Ramp up to 25 users
        { duration: "1m", target: 25 }, // Stay at 25 users
        { duration: "30s", target: 50 }, // Spike to 50 users
        { duration: "30s", target: 0 }, // Ramp down
      ],
      tags: { test_type: "stress" },
    },
    // Spike test - sudden burst
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 50 }, // Sudden spike
        { duration: "30s", target: 50 }, // Maintain spike
        { duration: "10s", target: 0 }, // Drop
      ],
      tags: { test_type: "spike" },
    },
  },

  // Thresholds - pass/fail criteria
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95th percentile < 2s
    http_req_failed: ["rate<0.01"], // Error rate < 1%
    http_reqs: ["rate>10"], // At least 10 req/s
    errors: ["rate<0.01"], // Custom error rate < 1%
    response_time: ["p(95)<2000"], // Custom response time < 2s
  },

  // Export results
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

// Base URL - configurable via environment
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Main test function
export default function () {
  // Test 1: Home page load (public)
  let res = http.get(`${BASE_URL}/fr`, {
    tags: { name: "HomePage" },
  });
  check(res, {
    "Home page status 200": (r) => r.status === 200,
    "Home page loads fast": (r) => r.timings.duration < 2000,
  });
  errorRate.add(res.status !== 200);
  responseTime.add(res.timings.duration);
  requestCount.add(1);
  sleep(1);

  // Test 2: Blog page (public)
  res = http.get(`${BASE_URL}/fr/blog`, {
    tags: { name: "BlogPage" },
  });
  check(res, {
    "Blog page status 200": (r) => r.status === 200,
    "Blog page loads fast": (r) => r.timings.duration < 2000,
  });
  errorRate.add(res.status !== 200);
  responseTime.add(res.timings.duration);
  requestCount.add(1);
  sleep(1);

  // Test 3: Login page (public)
  res = http.get(`${BASE_URL}/fr/connexion`, {
    tags: { name: "LoginPage" },
  });
  check(res, {
    "Login page status 200": (r) => r.status === 200,
  });
  errorRate.add(res.status !== 200);
  responseTime.add(res.timings.duration);
  requestCount.add(1);
  sleep(1);

  // Test 4: Search API (public)
  res = http.get(`${BASE_URL}/api/search?q=test`, {
    tags: { name: "SearchAPI" },
  });
  check(res, {
    "Search API responds": (r) => r.status === 200 || r.status === 404,
    "Search API fast": (r) => r.timings.duration < 1000,
  });
  errorRate.add(res.status !== 200 && res.status !== 404);
  responseTime.add(res.timings.duration);
  requestCount.add(1);
  sleep(1);

  // Test 5: Protected route - Dashboard (requires auth)
  // This will likely 302 redirect to login if not authenticated
  res = http.get(`${BASE_URL}/fr/tableau-de-bord`, {
    tags: { name: "DashboardPage" },
    redirects: 0,
  });
  check(res, {
    "Dashboard responds (200 or 302)": (r) =>
      r.status === 200 || r.status === 302,
  });
  errorRate.add(res.status !== 200 && res.status !== 302);
  responseTime.add(res.timings.duration);
  requestCount.add(1);
  sleep(1);

  // Test 6: Pricing page (public)
  res = http.get(`${BASE_URL}/fr/tarifs`, {
    tags: { name: "PricingPage" },
  });
  check(res, {
    "Pricing page status 200": (r) => r.status === 200,
  });
  errorRate.add(res.status !== 200);
  responseTime.add(res.timings.duration);
  requestCount.add(1);
  sleep(1);
}

// Setup function - runs once before all VUs
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  console.log(`Test scenarios: smoke, load, stress, spike`);
  return { baseUrl: BASE_URL };
}

// Teardown function - runs once after all VUs
export function teardown(data: { baseUrl: string }) {
  console.log(`Load test completed against ${data.baseUrl}`);
}
