import assert from "node:assert/strict";
import test from "node:test";
import { calculateBonusProfit, calculateYtdBonusProfit } from "../lib/reportBonusProfit.ts";

test("EPCC report bonus profit is monthly profit above the £155,000 target", () => {
  assert.equal(calculateBonusProfit(168_000), 13_000);
  assert.equal(calculateBonusProfit(155_000), 0);
  assert.equal(calculateBonusProfit(140_000), 0);
});

test("EPCC report YTD bonus compares total profit to the cumulative target", () => {
  assert.equal(calculateYtdBonusProfit(1_310_000, 8), 70_000);
  assert.equal(calculateYtdBonusProfit(1_240_000, 8), 0);
  assert.equal(calculateYtdBonusProfit(1_100_000, 8), 0);
});
