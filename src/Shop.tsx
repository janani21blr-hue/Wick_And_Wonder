import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  calculateTotal,
  emptyDetails,
  formatINR,
  updateQuantity,
  validateDetails,
  type CustomerDetails,
} from "./shop-model";
import "./shop.css";

export type ShopProduct = { id: string; name: string; price: number; color: string };
type BagItem = ShopProduct & { quantity: number };
type Step = "bag" | "details" | "payment" | "confirmation";
type PaymentMethod = "UPI" | "Card" | "Cash at the counter";
type DemoOrder = { number: string; items: BagItem[]; method: PaymentMethod };

const ShopContext = createContext<{
  add: (id: string) => void;
  open: () => void;
  quantities: Record<string, number>;
} | null>(null);

function useShop() {
  const shop = useContext(ShopContext);
  if (!shop) throw new Error("Shopping controls require ShopProvider.");
  return shop;
}

function BagIcon() {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden="true">
      <path d="M3 7H17L18 20H2L3 7Z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 8V5A4 4 0 0 1 14 5V8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function BagButton() {
  const { quantities, open } = useShop();
  const count = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
  return (
    <button
      className="bag-trigger"
      type="button"
      onClick={open}
      aria-label={`Open shopping bag, ${count} items`}
    >
      <BagIcon />
      <span className="bag-count" aria-hidden="true">
        {count}
      </span>
    </button>
  );
}

export function AddToBag({ id, name }: { id: string; name: string }) {
  const { add, quantities } = useShop();
  const quantity = quantities[id] ?? 0;
  return (
    <button
      className="add-to-bag"
      type="button"
      disabled={quantity >= 99}
      onClick={() => add(id)}
      aria-label={`Add ${name} to bag`}
    >
      <span>{quantity >= 99 ? "BAG LIMIT REACHED" : "ADD TO BAG"}</span>
      <span aria-hidden="true">{quantity ? `${quantity} IN BAG · +` : "+"}</span>
    </button>
  );
}

export function ShopProvider({
  products,
  children,
}: {
  products: ShopProduct[];
  children: ReactNode;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    // Also clear a page restored from the browser's back/forward cache.
    const clearSession = () => {
      setQuantities({});
      setIsOpen(false);
      setAnnouncement("");
    };
    window.addEventListener("pagehide", clearSession);
    window.addEventListener("pageshow", clearSession);
    return () => {
      window.removeEventListener("pagehide", clearSession);
      window.removeEventListener("pageshow", clearSession);
    };
  }, []);

  const items = products
    .filter((product) => quantities[product.id] > 0)
    .map((product) => ({ ...product, quantity: quantities[product.id] }));

  function close(endSession = false) {
    setIsOpen(false);
    if (endSession) setQuantities({});
    setAnnouncement("");
  }

  return (
    <ShopContext.Provider
      value={{
        quantities,
        add: (id) => {
          setQuantities((current) => updateQuantity(current, id, (current[id] ?? 0) + 1));
          setAnnouncement(
            `${products.find((item) => item.id === id)?.name} added to your demo bag.`,
          );
        },
        open: () => setIsOpen(true),
      }}
    >
      {children}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
      {isOpen && (
        <DemoCheckout
          items={items}
          onQuantity={(id, quantity) =>
            setQuantities((current) => updateQuantity(current, id, quantity))
          }
          onClose={close}
          onPaid={() => setQuantities({})}
        />
      )}
    </ShopContext.Provider>
  );
}

function OrderSummary({ items, method }: { items: BagItem[]; method?: string }) {
  const total = calculateTotal(items);
  return (
    <aside className="order-summary" aria-label="Order summary">
      <p className="shop-kicker">YOUR LITTLE ESCAPE</p>
      <h2>Order summary</h2>
      <ul className="summary-items">
        {items.map((item) => (
          <li key={item.id}>
            <span className="potion-swatch" style={{ background: item.color }} aria-hidden="true" />
            <span>
              <strong>{item.name}</strong>
              <small>
                Qty {item.quantity} × {formatINR(item.price)}
              </small>
            </span>
            <span>{formatINR(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="order-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatINR(total)}</dd>
        </div>
        <div>
          <dt>Demo counter pickup</dt>
          <dd>Free</dd>
        </div>
        <div>
          <dt>Additional charges</dt>
          <dd>{formatINR(0)}</dd>
        </div>
        <div className="grand-total">
          <dt>
            Total <small>INR</small>
          </dt>
          <dd>{formatINR(total)}</dd>
        </div>
      </dl>
      {method && (
        <p className="summary-method">
          Demo method: <strong>{method}</strong>
        </p>
      )}
      <p className="summary-footnote">
        Imaginary potions. Real good taste.
        <br />
        No order will be prepared or fulfilled.
      </p>
    </aside>
  );
}

function DemoCheckout({
  items,
  onQuantity,
  onClose,
  onPaid,
}: {
  items: BagItem[];
  onQuantity: (id: string, quantity: number) => void;
  onClose: (endSession?: boolean) => void;
  onPaid: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const paymentTimer = useRef<number | undefined>(undefined);
  const [step, setStep] = useState<Step>("bag");
  const [details, setDetails] = useState<CustomerDetails>({ ...emptyDetails });
  const [errors, setErrors] = useState<ReturnType<typeof validateDetails>>({});
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [outcome, setOutcome] = useState<"success" | "failure">("success");
  const [processing, setProcessing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [order, setOrder] = useState<DemoOrder | null>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => {
      window.clearTimeout(paymentTimer.current);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    heading.current?.focus();
    dialog.current?.scrollTo({ top: 0 });
  }, [step]);

  function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validateDetails(details);
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setFailed(false);
    setStep("payment");
  }

  function simulate() {
    if (processing || !items.length) return;
    setProcessing(true);
    setFailed(false);
    paymentTimer.current = window.setTimeout(() => {
      setProcessing(false);
      if (outcome === "failure") {
        setFailed(true);
        return;
      }
      setOrder({
        number: `DEMO-WW-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        items: items.map((item) => ({ ...item })),
        method,
      });
      setDetails({ ...emptyDetails });
      setErrors({});
      setStep("confirmation");
      onPaid();
    }, 850);
  }

  const stepNumber = step === "bag" ? 1 : step === "details" ? 2 : step === "payment" ? 3 : 4;
  const title = {
    bag: "Your shopping bag.",
    details: "A few fictional details.",
    payment: "A little make-believe.",
    confirmation: "Wonder, on its way.",
  }[step];
  const summaryItems = order && step === "confirmation" ? order.items : items;
  const total = calculateTotal(items);

  return (
    <dialog
      className="demo-checkout"
      ref={dialog}
      aria-labelledby="checkout-title"
      aria-describedby="demo-disclaimer"
      onCancel={(event) => {
        event.preventDefault();
        onClose(step === "confirmation");
      }}
    >
      <header className="checkout-header">
        <span className="mark">
          <span className="mark-icon" aria-hidden="true">
            <i />
          </span>
          WICK &amp; WONDER
        </span>
        <button
          className="shop-text-button"
          type="button"
          onClick={() => onClose(step === "confirmation")}
        >
          {step === "confirmation" ? "END DEMO" : "CLOSE"} <span aria-hidden="true">×</span>
        </button>
      </header>
      <div className="checkout-content">
        <p className="demo-notice" id="demo-disclaimer">
          <strong>DEMO PAYMENT MODE</strong>
          No real orders or payments are processed. Use fictional details only. Nothing is sent or
          saved.
        </p>
        <ol className="checkout-progress" aria-label="Checkout progress">
          {["Shopping bag", "Your details", "Demo payment", "Confirmation"].map((label, index) => (
            <li
              className={index + 1 <= stepNumber ? "reached" : ""}
              key={label}
              aria-current={index + 1 === stepNumber ? "step" : undefined}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {label}
            </li>
          ))}
        </ol>
        <div className="checkout-heading">
          <p className="shop-kicker">
            {step === "confirmation"
              ? "THE MAGIC IS ENTIRELY FICTIONAL"
              : "AN EXTRAORDINARY LITTLE CHECKOUT"}
          </p>
          <h1 id="checkout-title" ref={heading} tabIndex={-1}>
            {title}
          </h1>
          <p>
            {step === "bag"
              ? "A collection of small, delicious impossibilities."
              : step === "details"
                ? "No real personal information, please. This is just a rehearsal."
                : step === "payment"
                  ? "Choose how your fictional self would like to pay."
                  : "Your demo journey is complete. No charge. No real order."}
          </p>
        </div>

        {step === "bag" && !items.length ? (
          <div className="empty-bag">
            <BagIcon />
            <h2>A little empty. Full of possibility.</h2>
            <p>Your next escape is waiting in the potion collection.</p>
            <button
              className="button shop-primary"
              type="button"
              onClick={() => {
                onClose();
                document.querySelector("#potions")?.scrollIntoView();
              }}
            >
              EXPLORE POTIONS <span aria-hidden="true">↗</span>
            </button>
          </div>
        ) : (
          <div className="checkout-grid">
            <div className="checkout-main">
              {step === "bag" && (
                <section aria-label="Shopping bag items">
                  <ul className="bag-items">
                    {items.map((item) => (
                      <li key={item.id} className="bag-item">
                        <span
                          className="bag-item-art"
                          style={{ "--potion-color": item.color } as React.CSSProperties}
                          aria-hidden="true"
                        >
                          <i />
                        </span>
                        <div className="bag-item-info">
                          <h2>{item.name}</h2>
                          <p>250 ML · CHILLED · {formatINR(item.price)} EACH</p>
                          <div className="quantity-row">
                            <div
                              className="quantity-control"
                              role="group"
                              aria-label={`${item.name} quantity`}
                            >
                              <button
                                type="button"
                                aria-label={`Decrease ${item.name} quantity`}
                                onClick={() => onQuantity(item.id, item.quantity - 1)}
                              >
                                −
                              </button>
                              <output aria-label={`${item.name} quantity`} aria-live="polite">
                                {item.quantity}
                              </output>
                              <button
                                type="button"
                                aria-label={`Increase ${item.name} quantity`}
                                disabled={item.quantity >= 99}
                                onClick={() => onQuantity(item.id, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                            <button
                              className="shop-text-button remove-item"
                              type="button"
                              onClick={() => onQuantity(item.id, 0)}
                              aria-label={`Remove ${item.name}`}
                            >
                              REMOVE
                            </button>
                          </div>
                        </div>
                        <span className="bag-line-total">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="button shop-primary"
                    type="button"
                    onClick={() => setStep("details")}
                  >
                    CONTINUE TO DETAILS <span aria-hidden="true">↗</span>
                  </button>
                  <button className="shop-back" type="button" onClick={() => onClose()}>
                    ← Continue exploring
                  </button>
                </section>
              )}

              {step === "details" && (
                <form onSubmit={submitDetails} noValidate autoComplete="off">
                  <div className="fictional-details">
                    <span>Just here to explore?</span>
                    <button
                      className="shop-text-button"
                      type="button"
                      onClick={() => {
                        setDetails({
                          name: "Nova Daydream",
                          email: "nova@example.com",
                          phone: "0000000000",
                          notes: "An entirely fictional potion break.",
                        });
                        setErrors({});
                      }}
                    >
                      USE SAMPLE DETAILS ↗
                    </button>
                  </div>
                  {(["name", "email", "phone", "notes"] as const).map((key) => {
                    const labels = {
                      name: "Full name",
                      email: "Email",
                      phone: "Phone number",
                      notes: "Order notes",
                    };
                    const inputProps = {
                      id: `customer-${key}`,
                      name: key,
                      value: details[key],
                      onChange: (
                        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
                      ) => {
                        setDetails((current) => ({ ...current, [key]: event.target.value }));
                        setErrors((current) => ({ ...current, [key]: undefined }));
                      },
                      required: key !== "notes",
                      "aria-invalid": !!errors[key],
                      "aria-describedby": errors[key] ? `${key}-error` : undefined,
                      maxLength:
                        key === "notes" ? 500 : key === "name" ? 100 : key === "phone" ? 30 : 254,
                    };
                    return (
                      <div className="shop-field" key={key}>
                        <label htmlFor={`customer-${key}`}>
                          {labels[key]} <span>{key === "notes" ? "(optional)" : "(required)"}</span>
                        </label>
                        {key === "notes" ? (
                          <textarea
                            {...inputProps}
                            rows={3}
                            placeholder="Anything your imaginary barista should know?"
                          />
                        ) : (
                          <input
                            {...inputProps}
                            type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
                            placeholder={
                              key === "name"
                                ? "Nova Daydream"
                                : key === "email"
                                  ? "nova@example.com"
                                  : "0000000000"
                            }
                          />
                        )}
                        {errors[key] && (
                          <p className="field-error" id={`${key}-error`} role="alert">
                            {errors[key]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  <p className="privacy-note">
                    Kept only in temporary page memory. Details are cleared when you close checkout,
                    finish payment, end the demo, or leave/reload this page.
                  </p>
                  <button className="button shop-primary" type="submit">
                    CONTINUE TO PAYMENT <span aria-hidden="true">↗</span>
                  </button>
                  <button className="shop-back" type="button" onClick={() => setStep("bag")}>
                    ← Return to shopping bag
                  </button>
                </form>
              )}

              {step === "payment" && (
                <section aria-label="Demo payment controls">
                  <fieldset className="payment-methods" disabled={processing}>
                    <legend>Choose a demo payment method</legend>
                    {(["UPI", "Card", "Cash at the counter"] as const).map((option, index) => (
                      <label
                        className={`payment-option ${method === option ? "selected" : ""}`}
                        key={option}
                      >
                        <input
                          type="radio"
                          name="payment-method"
                          value={option}
                          checked={method === option}
                          onChange={() => {
                            setMethod(option);
                            setFailed(false);
                          }}
                        />
                        <span className="payment-symbol" aria-hidden="true">
                          {["↗", "▭", "⌑"][index]}
                        </span>
                        <span>
                          <strong>{option}</strong>
                          <small>
                            {
                              [
                                "No UPI address or PIN needed",
                                "No card details or CVV needed",
                                "Fictional counter pickup only",
                              ][index]
                            }
                          </small>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <fieldset className="demo-outcome" disabled={processing}>
                    <legend>Choose the simulated outcome</legend>
                    <p>Test both paths. No payment provider is contacted.</p>
                    {(["success", "failure"] as const).map((value) => (
                      <label key={value}>
                        <input
                          type="radio"
                          name="demo-outcome"
                          value={value}
                          checked={outcome === value}
                          onChange={() => {
                            setOutcome(value);
                            setFailed(false);
                          }}
                        />
                        {value === "success" ? "Successful payment" : "Failed payment"}
                      </label>
                    ))}
                  </fieldset>
                  {failed && (
                    <div className="payment-failure" role="alert">
                      <strong>Demo payment failed.</strong>
                      <p>
                        No money was charged. Your bag is unchanged. Choose “Successful payment” and
                        try again, or return to your bag.
                      </p>
                    </div>
                  )}
                  <div className="payment-amount">
                    <span>Demo amount · INR</span>
                    <strong>{formatINR(total)}</strong>
                  </div>
                  <button
                    className="button shop-primary"
                    type="button"
                    disabled={processing}
                    onClick={simulate}
                  >
                    {processing ? "SIMULATING PAYMENT…" : "SIMULATE PAYMENT"}{" "}
                    <span aria-hidden="true">↗</span>
                  </button>
                  <p className="sr-only" role="status">
                    {processing ? "Simulating demo payment. Please wait." : ""}
                  </p>
                  <div className="payment-back-links">
                    <button
                      className="shop-back"
                      type="button"
                      disabled={processing}
                      onClick={() => setStep("bag")}
                    >
                      ← Return to shopping bag
                    </button>
                    <button
                      className="shop-back"
                      type="button"
                      disabled={processing}
                      onClick={() => setStep("details")}
                    >
                      Edit demo details
                    </button>
                  </div>
                </section>
              )}

              {step === "confirmation" && order && (
                <section className="demo-confirmation" aria-label="Demo order confirmation">
                  <div className="confirmation-symbol" aria-hidden="true">
                    ✓
                  </div>
                  <p className="demo-success-status">SUCCESSFUL DEMO ORDER</p>
                  <h2>
                    A little magic.
                    <br />
                    Absolutely no charge.
                  </h2>
                  <p>Your fictional order number</p>
                  <strong className="order-number">{order.number}</strong>
                  <p>
                    This was a demonstration only. No real payment, order, reservation, or pickup
                    has been created. Your demo customer details have been cleared.
                  </p>
                  <button
                    className="button shop-primary"
                    type="button"
                    onClick={() => {
                      onClose(true);
                      document.querySelector("#home")?.scrollIntoView();
                    }}
                  >
                    BACK TO HOME <span aria-hidden="true">↗</span>
                  </button>
                </section>
              )}
            </div>
            <OrderSummary
              items={summaryItems}
              method={
                step === "confirmation" ? order?.method : step === "payment" ? method : undefined
              }
            />
          </div>
        )}
        <div className="checkout-end">
          <span>HANDCRAFTED IN ANOTHER DIMENSION · DEMO ONLY</span>
          <button className="shop-text-button" type="button" onClick={() => onClose(true)}>
            END DEMO &amp; CLEAR BAG
          </button>
        </div>
      </div>
    </dialog>
  );
}
