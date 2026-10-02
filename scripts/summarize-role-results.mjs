import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { roles, scenarioNames } from './role-browser-scenarios.mjs';

const path = process.argv[2];
if (!path) throw new Error('Usage: node scripts/summarize-role-results.mjs <role-results.json>');
const raw = readFileSync(path, 'utf8');
const results = JSON.parse(raw);
const latest = new Map();
for (const result of results) {
  assert(roles.includes(result.role), 'Unknown role');
  assert(Number.isInteger(result.iteration) && result.iteration >= 0 && result.iteration < 300);
  assert.equal(result.scenario, scenarioNames[result.role][result.iteration % 6]);
  latest.set(`${result.role}:${result.iteration}`, result);
}
const summary = roles.map((role) => {
  const records = Array.from({ length: 300 }, (_, i) => latest.get(`${role}:${i}`));
  assert(records.every(Boolean), `${role} does not have all 300 completed rounds`);
  assert(records.every((r) => r.passed && r.assertions.length >= 5), `${role} has failed or insufficiently checked rounds`);
  const scenarios = Object.fromEntries(scenarioNames[role].map((name) => [name, records.filter((r) => r.scenario === name).length]));
  assert(Object.values(scenarios).every((count) => count === 50));
  return {
    role, passed: records.length, scenarios,
    viewports: Object.fromEntries([1440, 768, 390, 320].map((width) => [width, records.filter((r) => r.viewport === width).length])),
    assertions: records.reduce((sum, r) => sum + r.assertions.length, 0),
  };
});
assert.equal(latest.size, 1500);
console.log(JSON.stringify({
  generatedAt: new Date().toISOString(), evidenceSha256: createHash('sha256').update(raw).digest('hex'),
  totalAttempts: results.length, failedAttempts: results.filter((r) => !r.passed).length,
  uniquePassingRounds: latest.size, roles: summary,
}, null, 2));
