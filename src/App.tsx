import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { PotionBottle, type PotionTone } from "./PotionBottle";
import { AddToBag, BagButton, ShopProvider } from "./Shop";

type IngredientId = "moonwater" | "comet" | "void" | "starflame";
type BrewPhase = "idle" | "pour" | "swirl" | "done";

const potions: {
  name: string;
  note: string;
  price: string;
  number: string;
  tone: PotionTone;
  halo: string;
}[] = [
  {
    name: "Violet Static",
    note: "For when your brain has 37 tabs open.",
    price: "₹249",
    number: "01",
    tone: "violet",
    halo: "rgba(135, 60, 255, 0.3)",
  },
  {
    name: "Daydream Drift",
    note: "A little escape from the ordinary.",
    price: "₹279",
    number: "02",
    tone: "dream",
    halo: "rgba(242, 166, 208, 0.24)",
  },
  {
    name: "Main Character Elixir",
    note: "Make an ordinary day cinematic.",
    price: "₹299",
    number: "03",
    tone: "cinema",
    halo: "rgba(255, 63, 160, 0.26)",
  },
  {
    name: "Midnight Spark",
    note: "For unexpected bursts of imagination.",
    price: "₹269",
    number: "04",
    tone: "midnight",
    halo: "rgba(46, 91, 255, 0.3)",
  },
];

const ingredients: {
  id: IngredientId;
  name: string;
  detail: string;
  glyph: string;
  color: string;
}[] = [
  { id: "moonwater", name: "Moonwater", detail: "CALM + CLARITY", glyph: "○", color: "#75DDF2" },
  { id: "comet", name: "Comet Berry", detail: "FOCUS + FLIGHT", glyph: "✦", color: "#FF4FA3" },
  { id: "void", name: "Void Sugar", detail: "DEPTH + WONDER", glyph: "◇", color: "#6954C8" },
  { id: "starflame", name: "Starflame", detail: "SPARK + COURAGE", glyph: "△", color: "#FF9B45" },
];

const ingredientColor = Object.fromEntries(
  ingredients.map((item) => [item.id, item.color]),
) as Record<IngredientId, string>;

type BrewResult = {
  name: string;
  effect: string;
  /** Human-readable colour outcome. */
  palette: string;
  top: string;
  bottom: string;
  glow: string;
  particle: string;
};

// Keys are the two ingredient ids sorted alphabetically.
const results: Record<string, BrewResult> = {
  "comet-moonwater": {
    name: "Lucid Orbit",
    effect: "You remember the dream just before waking.",
    palette: "Rose-cyan",
    top: "#8FE9F7",
    bottom: "#FF6FAE",
    glow: "#FF8FC4",
    particle: "#A6F1FF",
  },
  "moonwater-void": {
    name: "Quiet Supernova",
    effect: "Makes five minutes feel beautifully infinite.",
    palette: "Glacier blue-indigo",
    top: "#A9E9F8",
    bottom: "#4A45C0",
    glow: "#7DB8F2",
    particle: "#D4F7FF",
  },
  "moonwater-starflame": {
    name: "Soft Rebellion",
    effect: "For brave ideas spoken in a gentle voice.",
    palette: "Aurora teal-gold",
    top: "#3FD9C4",
    bottom: "#FFBA4A",
    glow: "#5FE3C9",
    particle: "#FFDA85",
  },
  "comet-void": {
    name: "Dark Matter Fizz",
    effect: "Turns overthinking into excellent plot twists.",
    palette: "Magenta-plum",
    top: "#FF4FA3",
    bottom: "#5E1866",
    glow: "#E0439A",
    particle: "#FFA3CF",
  },
  "comet-starflame": {
    name: "Meteor Muse",
    effect: "One sip. Three excellent ideas. No guarantees.",
    palette: "Coral-orange",
    top: "#FF6E7C",
    bottom: "#FF9B45",
    glow: "#FF8160",
    particle: "#FFC78E",
  },
  "starflame-void": {
    name: "After-Hours Aurora",
    effect: "A second wind from a nearby dimension.",
    palette: "Violet-gold",
    top: "#8C5EE6",
    bottom: "#FFB547",
    glow: "#B184FF",
    particle: "#FFD772",
  },
};

const POUR_MS = 1100;
const SWIRL_MS = 1700;

function Mark() {
  return (
    <a className="mark" href="#home" aria-label="Wick and Wonder home">
      <span className="mark-icon" aria-hidden="true">
        <i />
      </span>
      <span>WICK &amp; WONDER</span>
    </a>
  );
}

export default function App() {
  return (
    <ShopProvider
      products={potions.map((potion) => ({
        id: potion.number,
        name: potion.name,
        price: Number(potion.price.replace("₹", "")),
        color: { violet: "#873CFF", dream: "#F2A6D0", cinema: "#FF3FA0", midnight: "#6B95FF" }[
          potion.tone
        ],
      }))}
    >
      <Storefront />
    </ShopProvider>
  );
}

function Storefront() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<IngredientId[]>([]);
  const [phase, setPhase] = useState<BrewPhase>("idle");
  const timers = useRef<number[]>([]);
  const brewing = phase === "pour" || phase === "swirl";
  const revealed = phase === "done";

  const result = useMemo(() => {
    if (selected.length !== 2) return null;
    return results[[...selected].sort().join("-")];
  }, [selected]);

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }

  useEffect(() => clearTimers, []);

  function toggleIngredient(id: IngredientId) {
    if (brewing) return;
    setPhase("idle");
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 2
          ? [...current, id]
          : current,
    );
  }

  function brew() {
    if (!result || brewing) return;
    clearTimers();
    setPhase("pour");
    timers.current = [
      window.setTimeout(() => setPhase("swirl"), POUR_MS),
      window.setTimeout(() => setPhase("done"), POUR_MS + SWIRL_MS),
    ];
  }

  function reset() {
    clearTimers();
    setSelected([]);
    setPhase("idle");
  }

  const stageStyle = {
    "--a": selected[0] ? ingredientColor[selected[0]] : "#d8b8ff",
    "--b": selected[1] ? ingredientColor[selected[1]] : "#873cff",
    "--top": result?.top ?? "#d8b8ff",
    "--bottom": result?.bottom ?? "#873cff",
    "--glow": result?.glow ?? "#873cff",
    "--particle": result?.particle ?? "#d8b8ff",
  } as CSSProperties;

  return (
    <main>
      <header className="site-header">
        <Mark />
        <button
          className="menu-toggle"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
        <nav className={menuOpen ? "nav-open" : ""} aria-label="Primary navigation">
          {[
            ["Home", "#home"],
            ["Potions", "#potions"],
            ["Mixing Lab", "#lab"],
            ["Our Story", "#story"],
          ].map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
          <a className="button button-small" href="#potions" onClick={() => setMenuOpen(false)}>
            Explore potions <span aria-hidden="true">↗</span>
          </a>
        </nav>
        <BagButton />
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow">
            <span />
            POTION CAFÉ · SOMEWHERE BETWEEN WORLDS
          </p>
          <h1>
            ESCAPE THE
            <br />
            <em>ORDINARY.</em>
          </h1>
          <div className="hero-support">
            <p>Drink the extraordinary.</p>
            <a className="text-link" href="#potions">
              VIEW THE COLLECTION <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <div className="hero-art" aria-label="Three illuminated glass potion bottles">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <img src="/assets/potion-hero.png" alt="" />
          <div className="art-note note-top">BOTTLED ELSEWHERE</div>
          <div className="art-note note-bottom">03 / ∞</div>
        </div>
        <div className="hero-index" aria-hidden="true">
          <span>01</span>
          <i />
          <span>04</span>
        </div>
      </section>

      <section className="collection section" id="potions">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE POTION COLLECTION</p>
            <h2>
              Find your <em>frequency.</em>
            </h2>
          </div>
          <p className="section-intro">
            Small-batch elixirs for curious minds, late-night ideas, and days that need a little
            more plot.
          </p>
        </div>
        <div className="product-grid">
          {potions.map((potion) => (
            <article
              className={`product-card tone-${potion.tone}`}
              key={potion.name}
              style={{ "--halo": potion.halo } as CSSProperties}
            >
              <div className="product-topline">
                <span>{potion.number}</span>
                <span>250 ML · CHILLED</span>
              </div>
              <div className="product-visual" aria-hidden="true">
                <span className="halo" />
                <PotionBottle tone={potion.tone} />
              </div>
              <div className="product-copy">
                <div>
                  <h3>{potion.name}</h3>
                  <p>{potion.note}</p>
                </div>
                <span className="price">{potion.price}</span>
              </div>
              <AddToBag id={potion.number} name={potion.name} />
            </article>
          ))}
        </div>
      </section>

      <section className="lab section" id="lab">
        <div className="lab-copy">
          <p className="eyebrow">POTION MIXING LAB · EXPERIMENT 001</p>
          <h2>
            Two ingredients.
            <br />
            One <em>impossible</em> result.
          </h2>
          <p className="lab-intro">
            Choose exactly two elements. We’ll handle the alchemy, mild cosmic instability, and
            glassware.
          </p>
          <div className="ingredient-grid">
            {ingredients.map((ingredient) => {
              const active = selected.includes(ingredient.id);
              const disabled = selected.length === 2 && !active;
              return (
                <button
                  className={active ? "ingredient active" : "ingredient"}
                  type="button"
                  key={ingredient.id}
                  disabled={disabled || brewing}
                  aria-pressed={active}
                  onClick={() => toggleIngredient(ingredient.id)}
                  style={{ "--ing": ingredient.color } as CSSProperties}
                >
                  <span className="ingredient-glyph" aria-hidden="true">
                    {ingredient.glyph}
                  </span>
                  <span>
                    <strong>{ingredient.name}</strong>
                    <small>{ingredient.detail}</small>
                  </span>
                  <i>{active ? "—" : "+"}</i>
                </button>
              );
            })}
          </div>
          <div className="lab-actions">
            <button
              className="button brew-button"
              type="button"
              disabled={!result || brewing}
              onClick={brew}
            >
              {phase === "pour" ? "POURING…" : phase === "swirl" ? "MIXING…" : "BREW MY POTION"}{" "}
              <span aria-hidden="true">↗</span>
            </button>
            <button
              className="reset-button"
              type="button"
              onClick={reset}
              disabled={!selected.length}
            >
              RESET
            </button>
            <span className="selection-count">{selected.length} / 2 SELECTED</span>
          </div>
        </div>

        <div
          className={`brew-stage phase-${phase} ${brewing ? "is-brewing" : ""} ${revealed ? "is-revealed" : ""}`}
          style={stageStyle}
        >
          <div className="stage-glow" aria-hidden="true" />
          <div className="stage-stars" aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
          <div className="lab-flask" aria-hidden="true">
            <span className="stream stream-a" />
            <span className="stream stream-b" />
            <div className="flask-neck" />
            <div className="flask-glass">
              <div className="brew-liquid">
                <span className="swirl swirl-a" />
                <span className="swirl swirl-b" />
                <span className="mix" />
                <span className="surface" />
              </div>
              <span className="bubble bubble-one" />
              <span className="bubble bubble-two" />
              <span className="bubble bubble-three" />
            </div>
          </div>
          <div className="result-card" aria-live="polite">
            {revealed && result ? (
              <>
                <p>YOUR POTION IS</p>
                <h3>{result.name}</h3>
                <span>{result.effect}</span>
                <div className="mix-formula">
                  <i style={{ background: ingredientColor[selected[0]] }} />
                  +
                  <i style={{ background: ingredientColor[selected[1]] }} />
                  =
                  <i className="mix-chip" />
                  <b>{result.palette}</b>
                </div>
              </>
            ) : (
              <>
                <p>{brewing ? "ALCHEMY IN PROGRESS" : "AWAITING ELEMENTS"}</p>
                <h3>
                  {phase === "pour"
                    ? "Pouring the elements…"
                    : phase === "swirl"
                      ? "The colours are merging…"
                      : "The vessel is listening."}
                </h3>
                <span>
                  {brewing
                    ? "Do not disturb the particles."
                    : result
                      ? "Ready when you are. Press Brew My Potion."
                      : "Select two ingredients to begin."}
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="story section" id="story">
        <div className="story-visual" aria-hidden="true">
          <div className="portal">
            <span />
            <i />
          </div>
          <p>REALITY, WITH A TWIST</p>
        </div>
        <div className="story-copy">
          <p className="eyebrow">OUR STORY · EST. BETWEEN THEN &amp; NOW</p>
          <h2>
            NOT EVERY ESCAPE
            <br />
            NEEDS A <em>PASSPORT.</em>
          </h2>
          <div className="story-columns">
            <p>
              Wick &amp; Wonder began with a simple question: what if your coffee break could take
              you somewhere else entirely?
            </p>
            <p>
              So we built a café in the thin space between reality and imagination—a place where
              flavours glow, ideas wander, and every glass holds a small, delicious impossibility.
            </p>
          </div>
          <a className="text-link" href="#lab">
            MAKE SOMETHING IMPOSSIBLE <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <footer>
        <div className="footer-top">
          <div>
            <Mark />
            <p>A little magic in every sip.</p>
          </div>
          <div className="footer-links">
            <div>
              <span>EXPLORE</span>
              <a href="#potions">Potions</a>
              <a href="#lab">Mixing Lab</a>
              <a href="#story">Our Story</a>
            </div>
            <div>
              <span>SOCIAL</span>
              <a href="#instagram">Instagram</a>
              <a href="#tiktok">TikTok</a>
              <a href="#pinterest">Pinterest</a>
            </div>
            <div>
              <span>FIND US</span>
              <p>
                17½ Nebula Lane
                <br />
                Between Here &amp; Elsewhere
                <br />
                Bengaluru, IN
              </p>
            </div>
          </div>
        </div>
        <div className="footer-wordmark">WICK &amp; WONDER</div>
        <div className="footer-bottom">
          <span>© 2026 WICK &amp; WONDER</span>
          <span>HANDCRAFTED IN ANOTHER DIMENSION</span>
          <a href="#home">BACK TO TOP ↑</a>
        </div>
      </footer>
    </main>
  );
}
