import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function assertNbAnomalies (report, length) {
  assert.deepEqual(report.length, length,
                   `Expected ${length} anomalies but got ${report.length}. Full report received:\n` +
                   JSON.stringify(report, null, 2));
}

function assertAnomaly (report, idx, value) {
  const msg = `Mismatch for anomaly at index ${idx}. Full anomaly received:\n` +
        JSON.stringify(report[idx], null, 2);
  function assertMatch (actual, expected) {
    if (Array.isArray(expected)) {
      assert(Array.isArray(actual), msg);
      assert.deepEqual(actual.length, expected.length, msg);
      for (let i = 0; i < expected.length; i++) {
        assertMatch(actual[i], expected[i]);
      }
    } else if (typeof expected === 'object') {
      for (const prop in expected) {
        assertMatch(actual[prop], expected[prop]);
      }
    } else {
      assert.deepEqual(actual, expected, msg);
    }
  }
  assertMatch(report[idx], value);
}

/**************************************************
Export methods for use as module
**************************************************/
export { assertNbAnomalies, assertAnomaly };
