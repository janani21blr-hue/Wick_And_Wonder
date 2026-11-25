import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateTotal,
  emptyDetails,
  formatINR,
  updateQuantity,
  validateDetails,
} from "../src/shop-model.ts";

test("empty bag has zero subtotal and no quantities", () => {
  assert.equal(calculateTotal([]), 0);
  assert.deepEqual(updateQuantity({}, "01", 0), {});
});

test("add, increase, decrease and remove are immutable and bounded", () => {
  const original = {};
  let bag = updateQuantity(original, "01", 1);
  assert.deepEqual(original, {});
  bag = updateQuantity(bag, "01", 3);
  assert.equal(bag["01"], 3);
  bag = updateQuantity(bag, "01", 2);
  assert.equal(bag["01"], 2);
  bag = updateQuantity(bag, "01", 0);
  assert.deepEqual(bag, {});
  assert.deepEqual(updateQuantity({}, "02", -1), {});
  assert.deepEqual(updateQuantity({}, "02", 100), { "02": 99 });
});

test("four real potion prices calculate exact INR totals", () => {
  const items = [249, 279, 299, 269].map((price) => ({ price, quantity: 1 }));
  assert.equal(calculateTotal(items), 1096);
  items[0].quantity = 2;
  assert.equal(calculateTotal(items), 1345);
  assert.equal(formatINR(1345), "₹1,345");
});

test("required customer fields reject an empty checkout; notes remain optional", () => {
  assert.deepEqual(Object.keys(validateDetails(emptyDetails)).sort(), ["email", "name", "phone"]);
});

test("invalid email and phone formats are rejected", () => {
  const base = { name: "Nova Daydream", email: "nova@example.com", phone: "0000000000", notes: "" };
  for (const email of ["nova", "a@", "a b@example.com", "a@b"]) {
    assert.ok(validateDetails({ ...base, email }).email);
  }
  for (const phone of ["123", "call me", "1234567890123456", "12+3456789"]) {
    assert.ok(validateDetails({ ...base, phone }).phone);
  }
  assert.ok(validateDetails({ ...base, notes: "x".repeat(501) }).notes);
});

test("fictional valid details pass without notes, including formatted phone", () => {
  assert.deepEqual(
    validateDetails({
      name: "Nova Daydream",
      email: "nova@example.com",
      phone: "+91 (000) 000-0000",
      notes: "",
    }),
    {},
  );
});
