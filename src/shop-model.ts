export type CustomerDetails = {
  name: string;
  email: string;
  phone: string;
  notes: string;
};

export const emptyDetails: CustomerDetails = { name: "", email: "", phone: "", notes: "" };

export function validateDetails(details: CustomerDetails) {
  const errors: Partial<Record<keyof CustomerDetails, string>> = {};
  if (details.name.trim().length < 2)
    errors.name = "Enter a fictional full name (at least 2 characters).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim()))
    errors.email = "Enter a valid demo email, such as explorer@example.com.";
  const phone = details.phone.trim();
  const digits = phone.replace(/\D/g, "");
  if (!/^\+?[\d\s()-]+$/.test(phone) || digits.length < 7 || digits.length > 15)
    errors.phone = "Use a fictional phone number with 7–15 digits.";
  if (details.notes.length > 500) errors.notes = "Keep notes to 500 characters or fewer.";
  return errors;
}

export function updateQuantity(bag: Record<string, number>, id: string, quantity: number) {
  const next = { ...bag };
  const safeQuantity = Math.max(0, Math.min(99, Math.trunc(quantity)));
  if (safeQuantity > 0) next[id] = safeQuantity;
  else delete next[id];
  return next;
}

export function calculateTotal(items: { price: number; quantity: number }[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
