// Charge test k6 — vérifier que le SaaS tient la charge avant mise en prod.
// Usage: k6 run tests/load/scenario.js
// Interprétation : voir .claude/skills/ns-load-test/SKILL.md (faux positifs, p95/p99, pic instantané).
import http from "k6/http";
import { check } from "k6";

// Remplacer par l'URL de préview/prod avant le tir.
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  stages: [
    { duration: "30s", target: 50 }, // montée
    { duration: "1m", target: 200 }, // pic
    { duration: "20s", target: 0 }, // descente
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // <1% d'erreurs
    http_req_duration: ["p(95)<800"], // p95 < 800ms
  },
};

export default function () {
  // Pages à tester : landmarks + espace authentifié (le plus lourd).
  const pages = [
    `${BASE_URL}/`,
    `${BASE_URL}/tarifs`,
    `${BASE_URL}/etudes-de-cas`, // (ou route de ton choix)
  ];
  const res = http.get(pages[Math.floor(Math.random() * pages.length)]);
  check(res, { "status 2xx": (r) => r.status >= 200 && r.status < 300 });
}
