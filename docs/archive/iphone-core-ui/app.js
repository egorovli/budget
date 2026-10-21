// PROTOTYPE: one low-fidelity walkthrough of the complete POC screen map.

const groups = [
  {
    name: "Getting started",
    screens: [
      screen("welcome", "Welcome", "Enter through iCloud without inventing app authentication.", "Do we need anything before creating or opening a Book?", welcomeScreen),
      screen("book-setup", "Create Book", "Name the financial dataset and choose its base currency.", "Is Book understandable during first-run setup?", bookSetupScreen),
    ],
  },
  {
    name: "Daily use",
    screens: [
      screen("home", "Home", "Answer what is free, reserved, available, and owned.", "Does the first screen answer the pre-purchase question?", homeScreen),
      screen("activity", "Activity", "Browse and filter all Book operations.", "Are the filters sufficient without turning this into accounting software?", activityScreen),
      screen("transaction-create", "Record transaction", "Capture expense or income amount-first.", "Which optional controls belong in the first view versus More details?", transactionCreateScreen),
      screen("transaction-detail", "Transaction detail", "Understand, edit, duplicate, or remove one operation.", "Is all multi-currency and Reserve provenance understandable here?", transactionDetailScreen),
    ],
  },
  {
    name: "Accounts and movement",
    screens: [
      screen("accounts", "Accounts", "See Transactional and Valuation accounts without conflating them.", "Do we want groups beyond Transactional and Valuation?", accountsScreen),
      screen("account-detail", "Account detail", "Inspect one Account balance and history.", "Which account-level actions must be immediately available?", accountDetailScreen),
      screen("account-form", "Create or edit Account", "Capture tracking mode, currency, and financial scope.", "The Available-money eligibility control is intentionally marked unresolved.", accountFormScreen),
      screen("balance-adjustment", "Balance adjustment", "Set an opening balance or record an explicit correction.", "Are opening balance and correction one screen with different reasons?", balanceAdjustmentScreen),
      screen("valuation-update", "Update valuation", "Add a dated total value without fake income or expenses.", "Is a current total enough for the POC?", valuationUpdateScreen),
      screen("transfer", "Transfer / exchange", "Move money between own Accounts while preserving both actual amounts.", "Can the same screen handle same-currency transfers and FX clearly?", transferScreen),
    ],
  },
  {
    name: "Reserves",
    screens: [
      screen("reserves", "Reserves", "See Book-wide commitments and the remaining Free amount.", "Does Reserve management feel distinct from Accounts?", reservesScreen),
      screen("reserve-detail", "Reserve detail", "Explain one Reserve balance through its history.", "Which history actions need direct correction?", reserveDetailScreen),
      screen("reserve-form", "Create or edit Reserve", "Name a commitment and optionally allocate money immediately.", "Do we need notes, target amount, or target date in the POC?", reserveFormScreen),
      screen("reserve-adjust", "Reserve adjustment", "Allocate, release, or use an explicit amount.", "Are these three verbs clear enough?", reserveAdjustScreen),
    ],
  },
  {
    name: "Organization",
    screens: [
      screen("categories", "Categories", "Browse an arbitrary-depth Category tree and archived nodes.", "Can users understand direct assignment to parent Categories?", categoriesScreen),
      screen("category-form", "Create or edit Category", "Name, reparent, and archive a Category safely.", "Is parent selection enough to represent arbitrary nesting?", categoryFormScreen),
      screen("counterparties", "Counterparties", "Manage one shared payer/payee vocabulary.", "Do counterparties need anything beyond name and note?", counterpartiesScreen),
      screen("counterparty-form", "Create or edit Counterparty", "Create the person or organization on the other side.", "Should aliases or matching rules wait for imports?", counterpartyFormScreen),
    ],
  },
  {
    name: "Review and data",
    screens: [
      screen("reports", "Reports", "Review spending, income, net worth, and Category rollups.", "Which reports are essential to prove usefulness?", reportsScreen),
      screen("books", "Books", "Switch between independent financial datasets.", "How visible should multiple Books be in a single-user POC?", booksScreen),
      screen("book-settings", "Book settings", "Manage the Book boundary and its immutable base currency.", "Is anything here missing before family sharing exists?", bookSettingsScreen),
      screen("data-sync", "Sync, export, and backup", "Expose iCloud health and data portability in one place.", "Should sync and backup live together or under separate settings later?", dataSyncScreen),
    ],
  },
];

function screen(id, label, purpose, review, render) {
  return { id, label, purpose, review, render };
}

const screens = groups.flatMap((group) => group.screens.map((item) => ({ ...item, group: group.name })));

const transactions = [
  ["Biedronka", "Groceries · Today, 18:42", "−84.70 PLN"],
  ["Revolut", "Internal transfer · Today, 09:18", "1,000 PLN → 232 EUR"],
  ["Figma", "Software · Yesterday", "−62.15 PLN"],
  ["Acme Studio", "Income · 3 Aug", "+8,200 PLN"],
];

function currentScreenId() {
  const requested = new URLSearchParams(window.location.search).get("screen");
  return screens.some((item) => item.id === requested) ? requested : "home";
}

function currentScreen() {
  return screens.find((item) => item.id === currentScreenId());
}

function goTo(id) {
  if (!screens.some((item) => item.id === id)) return;
  const params = new URLSearchParams();
  params.set("screen", id);
  history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
  closeMap();
  render();
}

function cycleScreen(direction) {
  const index = screens.findIndex((item) => item.id === currentScreenId());
  goTo(screens[(index + direction + screens.length) % screens.length].id);
}

function render() {
  const active = currentScreen();
  document.title = `${active.label} — Budgetly wireframe`;
  document.getElementById("app").innerHTML = `
    <section class="prototype-stage">
      <div class="phone-shell">
        <div class="screen-content">${active.render()}</div>
      </div>
      <aside class="review-panel">
        <small>Prototype notes · ${active.group}</small>
        <h1>${active.label}</h1>
        <h2>Purpose</h2>
        <p>${active.purpose}</p>
        <h2>Review question</h2>
        <p>${active.review}</p>
        <button class="secondary" data-map>Open all screens</button>
      </aside>
    </section>`;
  renderNavigator();
  bindInteractions();
}

function renderNavigator() {
  const active = currentScreen();
  const index = screens.findIndex((item) => item.id === active.id);
  document.getElementById("prototype-navigator").innerHTML = `
    <button data-cycle="-1" aria-label="Previous screen">←</button>
    <button class="navigator-label" data-map>
      <small>${index + 1} / ${screens.length} · ${active.group}</small>
      <strong>${active.label}</strong>
    </button>
    <button data-cycle="1" aria-label="Next screen">→</button>`;
}

function bindInteractions() {
  document.querySelectorAll("[data-screen]").forEach((element) => {
    element.addEventListener("click", () => goTo(element.dataset.screen));
  });
  document.querySelectorAll("[data-map]").forEach((element) => element.addEventListener("click", openMap));
  document.querySelectorAll("[data-cycle]").forEach((element) => {
    element.addEventListener("click", () => cycleScreen(Number(element.dataset.cycle)));
  });
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      showToast("Prototype only — no data was saved");
    });
  });
  document.querySelectorAll("[data-toast]").forEach((element) => {
    element.addEventListener("click", () => showToast(element.dataset.toast));
  });
  document.querySelectorAll("[data-segment]").forEach((element) => {
    element.addEventListener("click", () => {
      element.parentElement.querySelectorAll("[data-segment]").forEach((sibling) => sibling.classList.remove("active"));
      element.classList.add("active");
    });
  });
}

function openMap() {
  document.getElementById("screen-map").innerHTML = `
    <div class="map-backdrop" data-close-map>
      <section class="map-sheet" aria-label="All prototype screens">
        <header><div><small>PROTOTYPE MAP</small><h2>All screens</h2></div><button data-close-map>Close</button></header>
        ${groups
          .map(
            (group) => `<div class="map-group"><h3>${group.name}</h3>${group.screens
              .map(
                (item) => `<button data-map-screen="${item.id}" class="${item.id === currentScreenId() ? "active" : ""}"><span>${screens.findIndex((screenItem) => screenItem.id === item.id) + 1}</span>${item.label}</button>`,
              )
              .join("")}</div>`,
          )
          .join("")}
      </section>
    </div>`;
  document.getElementById("screen-map").classList.add("open");
  document.querySelectorAll("[data-map-screen]").forEach((element) => {
    element.addEventListener("click", () => goTo(element.dataset.mapScreen));
  });
  document.querySelectorAll("[data-close-map]").forEach((element) => {
    element.addEventListener("click", (event) => {
      if (event.target === element) closeMap();
    });
  });
}

function closeMap() {
  const map = document.getElementById("screen-map");
  map.classList.remove("open");
  map.innerHTML = "";
}

function showToast(message) {
  document.querySelector(".prototype-toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "prototype-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1800);
}

function appHeader(title, options = {}) {
  return `<header class="app-header">
    ${options.back ? `<button class="icon-button" data-screen="${options.back}" aria-label="Back">←</button>` : `<button class="text-button" data-screen="books">Family⌄</button>`}
    <h1>${title}</h1>
    ${options.action ? `<button class="text-button" data-screen="${options.action.screen}">${options.action.label}</button>` : `<span class="header-spacer"></span>`}
  </header>`;
}

function bottomNav(active) {
  return `<nav class="bottom-nav">
    ${navButton("home", "□", "Home", active)}
    ${navButton("activity", "≡", "Activity", active)}
    ${navButton("reserves", "○", "Reserves", active)}
    <button data-map class="${active === "more" ? "active" : ""}"><b>•••</b><span>More</span></button>
  </nav>`;
}

function navButton(screenId, icon, label, active) {
  return `<button data-screen="${screenId}" class="${active === screenId ? "active" : ""}"><b>${icon}</b><span>${label}</span></button>`;
}

function metric(label, value, detail = "") {
  return `<div class="metric"><small>${label}</small><strong>${value}</strong>${detail ? `<span>${detail}</span>` : ""}</div>`;
}

function listRow(title, subtitle, trailing, screenId = "") {
  return `<button class="list-row" ${screenId ? `data-screen="${screenId}"` : "data-toast=" + JSON.stringify(title)}>
    <span class="row-placeholder"></span><span class="row-copy"><b>${title}</b><small>${subtitle}</small></span>${trailing ? `<strong>${trailing}</strong>` : ""}<i>›</i>
  </button>`;
}

function field(label, control, hint = "") {
  return `<label class="field"><span>${label}</span>${control}${hint ? `<small>${hint}</small>` : ""}</label>`;
}

function textInput(value = "", placeholder = "") {
  return `<input value="${value}" placeholder="${placeholder}" />`;
}

function selectInput(options, selected = 0) {
  return `<select>${options.map((option, index) => `<option ${index === selected ? "selected" : ""}>${option}</option>`).join("")}</select>`;
}

function actionBar(primary, secondary = "") {
  return `<div class="form-actions">${secondary ? `<button type="button" class="secondary" data-toast="${secondary}">${secondary}</button>` : ""}<button class="primary" type="submit">${primary}</button></div>`;
}

function transactionList(limit = transactions.length) {
  return `<div class="plain-list">${transactions
    .slice(0, limit)
    .map(([name, detail, amount]) => listRow(name, detail, amount, "transaction-detail"))
    .join("")}</div>`;
}

function welcomeScreen() {
  return `<div class="center-screen">
    <h2>Budgetly</h2>
    <span class="eyebrow">Personal finance POC</span>
    <h1>Know what is actually free to spend.</h1>
    <p>Track Accounts, explicit Reserves, and multi-currency operations in one Book.</p>
    <button class="primary wide" data-screen="book-setup">Create my first Book</button>
    <button class="secondary wide" data-toast="Search for Books in this iCloud account">Open an existing iCloud Book</button>
    <small>No app account. Uses your Apple iCloud account.</small>
  </div>`;
}

function bookSetupScreen() {
  return `${appHeader("Create Book", { back: "welcome" })}<form class="form-page">
    <div class="step-marker">STEP 1 OF 1</div>
    ${field("Book name", textInput("Family", "e.g. Family"))}
    ${field("Base currency", selectInput(["PLN — Polish złoty", "EUR — Euro", "USD — US dollar"]), "Cannot be changed in the POC")}
    <div class="info-box"><b>What belongs to a Book?</b><p>Accounts, transactions, categories, counterparties, Reserves, and reports. Books never mix their data.</p></div>
    <label class="check-row"><input type="checkbox" checked /><span>Synchronize this Book through iCloud</span></label>
    ${actionBar("Create Book")}
    <button type="button" class="text-link" data-screen="home">Skip setup in prototype →</button>
  </form>`;
}

function homeScreen() {
  return `${appHeader("Overview", { action: { label: "Sync ✓", screen: "data-sync" } })}
    <div class="page-scroll has-tabs">
      <section class="hero-wire">${metric("Free amount", "9,260 PLN", "Available 12,460 − Reserves 3,200")}</section>
      <div class="two-column">${metric("Available money", "12,460 PLN")}${metric("Net worth", "51,840 PLN")}</div>
      <button class="primary wide" data-screen="transaction-create">＋ Record transaction</button>
      <div class="section-title"><h2>Reserves</h2><button data-screen="reserves">See all</button></div>
      <div class="two-column"><button class="outline-card" data-screen="reserve-detail"><small>Tax</small><b>2,400 PLN</b></button><button class="outline-card" data-screen="reserve-detail"><small>Asturias</small><b>800 PLN</b></button></div>
      <div class="section-title"><h2>Accounts</h2><button data-screen="accounts">See all</button></div>
      ${listRow("mBank", "Transactional · PLN", "8,740 PLN", "account-detail")}
      ${listRow("Revolut", "Transactional · EUR", "860 EUR", "account-detail")}
      ${listRow("Trade Republic", "Valuation · updated 2 Aug", "39,380 PLN", "valuation-update")}
      <div class="section-title"><h2>Recent activity</h2><button data-screen="activity">See all</button></div>
      ${transactionList(2)}
    </div>${bottomNav("home")}`;
}

function activityScreen() {
  return `${appHeader("Activity", { action: { label: "＋", screen: "transaction-create" } })}
    <div class="page-scroll has-tabs">
      <div class="search-box">⌕ <input placeholder="Search operations" /></div>
      <div class="filter-row"><button>All accounts⌄</button><button>All types⌄</button><button>This month⌄</button></div>
      <div class="period-summary"><span>August 2026</span><b>Income 8,200</b><b>Expenses 146.85</b></div>
      <div class="section-title"><h2>Today</h2><span>−84.70 PLN</span></div>
      ${transactionList(2)}
      <div class="section-title"><h2>Earlier</h2><span>+8,137.85 PLN</span></div>
      ${transactionList(4)}
      <button class="secondary wide" data-screen="reports">Open reports</button>
    </div>${bottomNav("activity")}`;
}

function transactionCreateScreen() {
  return `${appHeader("Record transaction", { back: "home" })}<form class="form-page compact">
    <div class="segmented"><button type="button" data-segment class="active">Expense</button><button type="button" data-segment>Income</button></div>
    <label class="amount-wire"><span>PLN</span><input inputmode="decimal" placeholder="0.00" /></label>
    ${field("Account *", selectInput(["mBank · PLN", "Revolut · EUR"]))}
    ${field("Category", selectInput(["None", "Food", "Food › Groceries", "Software"], 2))}
    ${field("Counterparty", textInput("Biedronka", "Optional"))}
    ${field("Spend from", selectInput(["Free money", "Tax Reserve", "Asturias Reserve"]), "Never inferred")}
    <details class="more-fields"><summary>More details</summary>
      ${field("Transaction date", `<input type="date" value="2026-08-04" />`)}
      ${field("Occurrence time", `<input type="time" value="18:42" />`, "Captured automatically; optional")}
      ${field("Original amount", `<div class="inline-control"><input placeholder="Optional" /><select><option>EUR</option><option>USD</option></select></div>`)}
      ${field("Operation rate", `<div class="inline-control"><input value="4.31" /><button type="button">Use NBP</button></div>`, "Automatic or manual")}
      ${field("Note", `<textarea placeholder="Optional"></textarea>`)}
    </details>
    <div class="calculation-box"><span>Free after saving</span><b>9,175.30 PLN</b></div>
    ${actionBar("Save transaction")}
  </form>`;
}

function transactionDetailScreen() {
  return `${appHeader("Transaction", { back: "activity", action: { label: "Edit", screen: "transaction-create" } })}
    <div class="page-scroll">
      <div class="detail-amount"><small>EXPENSE</small><h2>−84.70 PLN</h2><span>Today, 18:42 · mBank</span></div>
      <dl class="detail-list"><dt>Counterparty</dt><dd>Biedronka</dd><dt>Category</dt><dd>Food › Groceries</dd><dt>Spend from</dt><dd>Free money</dd><dt>Original amount</dt><dd>19.65 EUR</dd><dt>Operation rate</dt><dd>4.3104 · manually edited</dd><dt>Reference quote</dt><dd>NBP · 4 Aug 2026</dd><dt>Note</dt><dd>Weekly groceries</dd></dl>
      <div class="history-box"><b>Financial effect</b><p>mBank −84.70 PLN</p><p>Free amount −84.70 PLN</p><p>Reserves unchanged</p></div>
      <button class="secondary wide" data-toast="Duplicate transaction">Duplicate</button>
      <button class="danger wide" data-toast="Delete would recompute all totals">Delete transaction</button>
    </div>`;
}

function accountsScreen() {
  return `${appHeader("Accounts", { action: { label: "＋", screen: "account-form" } })}<div class="page-scroll has-tabs">
    <div class="section-title"><h2>Transactional</h2><span>12,460 PLN current value</span></div>
    ${listRow("mBank", "PLN · included in net worth", "8,740 PLN", "account-detail")}
    ${listRow("Revolut", "EUR · current rate 4.3256", "860 EUR", "account-detail")}
    <div class="section-title"><h2>Valuation</h2><span>39,380 PLN</span></div>
    ${listRow("Trade Republic", "Manual total · updated 2 Aug", "39,380 PLN", "valuation-update")}
    <div class="section-title"><h2>Excluded</h2><button data-toast="Show archived Accounts">Archived</button></div>
    ${listRow("Old cash wallet", "Not in net worth", "0 PLN", "account-detail")}
    <button class="secondary wide" data-screen="transfer">Transfer between Accounts</button>
  </div>${bottomNav("more")}`;
}

function accountDetailScreen() {
  return `${appHeader("mBank", { back: "accounts", action: { label: "Edit", screen: "account-form" } })}<div class="page-scroll">
    <div class="detail-amount"><small>CURRENT BALANCE</small><h2>8,740 PLN</h2><span>Transactional Account · in net worth</span></div>
    <div class="three-actions"><button data-screen="transaction-create">＋ Transaction</button><button data-screen="transfer">⇄ Transfer</button><button data-screen="balance-adjustment">± Adjust</button></div>
    <div class="section-title"><h2>August</h2><button>Filter⌄</button></div>
    ${transactionList(4)}
    <div class="history-box"><b>Balance explanation</b><p>Opening adjustment 10,000</p><p>Income +8,200</p><p>Expenses −1,260</p><p>Transfers −8,200</p></div>
  </div>`;
}

function accountFormScreen() {
  return `${appHeader("Account", { back: "accounts" })}<form class="form-page">
    ${field("Tracking mode", `<div class="segmented"><button type="button" data-segment class="active">Transactional</button><button type="button" data-segment>Valuation</button></div>`, "Cannot be mixed")}
    ${field("Name", textInput("mBank"))}
    ${field("Currency", selectInput(["PLN", "EUR", "USD"]))}
    <label class="check-row"><input type="checkbox" checked /><span>Include in net worth</span></label>
    <div class="question-box"><b>POC question</b><p>Should this Account contribute to Available money?</p><label class="check-row"><input type="checkbox" checked /><span>Include in Available money</span></label></div>
    <div class="info-box"><b>Transactional Account</b><p>Balance follows from adjustments, income, expenses, and Transfers.</p></div>
    ${actionBar("Save Account")}
    <button type="button" class="danger wide" data-toast="Archive keeps Account history">Archive Account</button>
  </form>`;
}

function balanceAdjustmentScreen() {
  return `${appHeader("Balance adjustment", { back: "account-detail" })}<form class="form-page">
    ${field("Account", selectInput(["mBank · PLN", "Revolut · EUR"]))}
    ${field("Reason", selectInput(["Opening balance", "Reconciliation correction"], 1))}
    ${field("Actual balance", `<input inputmode="decimal" value="8740.00" />`)}
    <div class="calculation-box"><span>Recorded adjustment</span><b>−12.35 PLN</b></div>
    ${field("Date", `<input type="date" value="2026-08-04" />`)}
    ${field("Explanation", `<textarea placeholder="Why is this adjustment needed?"></textarea>`)}
    <div class="warning-box">This changes Account history but is not income or expense.</div>
    ${actionBar("Save adjustment")}
  </form>`;
}

function valuationUpdateScreen() {
  return `${appHeader("Update valuation", { back: "accounts" })}<form class="form-page">
    <div class="detail-amount"><small>TRADE REPUBLIC</small><h2>39,380 PLN</h2><span>Last updated 2 Aug 2026</span></div>
    ${field("New total value", `<input inputmode="decimal" value="40120.00" />`)}
    ${field("Currency", selectInput(["PLN", "EUR"]))}
    ${field("Valuation date", `<input type="date" value="2026-08-04" />`)}
    ${field("Note", `<textarea placeholder="Optional"></textarea>`)}
    <div class="calculation-box"><span>Net worth change</span><b>+740 PLN</b></div>
    <div class="info-box"><b>Free amount does not change</b><p>Valuation Accounts are not treated as money for purchases.</p></div>
    ${actionBar("Save valuation")}
    <button type="button" class="secondary wide" data-toast="Show previous valuation snapshots">View valuation history</button>
  </form>`;
}

function transferScreen() {
  return `${appHeader("Transfer", { back: "accounts" })}<form class="form-page compact">
    ${field("From Account", selectInput(["mBank · PLN", "Revolut · EUR"]))}
    ${field("Amount sent", `<div class="inline-control"><input inputmode="decimal" value="1000.00" /><b>PLN</b></div>`)}
    <div class="transfer-arrow">↓</div>
    ${field("To Account", selectInput(["Revolut · EUR", "mBank · PLN"]))}
    ${field("Amount received", `<div class="inline-control"><input inputmode="decimal" value="232.00" /><b>EUR</b></div>`)}
    <div class="calculation-box"><span>Effective rate</span><b>4.3103 PLN / EUR</b><button type="button" data-toast="Fetch an NBP reference quote">Compare NBP</button></div>
    ${field("Exchange fee", `<div class="inline-control"><input inputmode="decimal" value="5.00" /><b>PLN</b></div>`, "Saved as a separate expense")}
    ${field("Date", `<input type="date" value="2026-08-04" />`)}
    <div class="info-box"><b>Neutral movement</b><p>The Transfer is neither income nor expense. Only its fee appears as expense.</p></div>
    ${actionBar("Save Transfer")}
  </form>`;
}

function reservesScreen() {
  return `${appHeader("Reserves", { action: { label: "＋", screen: "reserve-form" } })}<div class="page-scroll has-tabs">
    <div class="hero-wire">${metric("Total Reserves", "3,200 PLN", "Free amount 9,260 PLN")}</div>
    ${listRow("Tax", "3 adjustments · last used 31 Jul", "2,400 PLN", "reserve-detail")}
    ${listRow("Asturias", "Created 2 Aug", "800 PLN", "reserve-detail")}
    <div class="section-title"><h2>How this works</h2></div>
    <div class="info-box"><p>Reserves are Book-wide commitments. They do not move money between Accounts and ordinary expenses never consume them automatically.</p></div>
    <button class="secondary wide" data-screen="reserve-adjust">Adjust a Reserve</button>
  </div>${bottomNav("reserves")}`;
}

function reserveDetailScreen() {
  return `${appHeader("Tax", { back: "reserves", action: { label: "Edit", screen: "reserve-form" } })}<div class="page-scroll">
    <div class="detail-amount"><small>CURRENT RESERVE</small><h2>2,400 PLN</h2><span>Book-wide · does not affect net worth</span></div>
    <div class="three-actions"><button data-screen="reserve-adjust">＋ Allocate</button><button data-screen="reserve-adjust">− Release</button><button data-screen="transaction-create">↗ Spend</button></div>
    <div class="section-title"><h2>History</h2><button>All⌄</button></div>
    ${listRow("Allocated", "4 Aug · From Free amount", "+400 PLN")}
    ${listRow("Tax payment", "31 Jul · Linked expense", "−200 PLN", "transaction-detail")}
    ${listRow("Created", "1 Jul", "+2,200 PLN")}
    <div class="history-box"><b>Effect now</b><p>Available money 12,460</p><p>Reserve 2,400</p><p>Free amount reduced by 2,400</p></div>
  </div>`;
}

function reserveFormScreen() {
  return `${appHeader("Reserve", { back: "reserves" })}<form class="form-page">
    ${field("Name", textInput("Tax", "e.g. Tax, Trip, Repair"))}
    ${field("Initial allocation", `<div class="inline-control"><input inputmode="decimal" value="400" /><b>PLN</b></div>`, "Cannot exceed current Free amount")}
    ${field("Note", `<textarea placeholder="Optional purpose or context"></textarea>`)}
    <div class="question-box"><b>Potential later fields</b><p>Target amount and target date are deliberately not assumed. Tell us if they belong in the POC.</p></div>
    ${actionBar("Save Reserve")}
    <button type="button" class="danger wide" data-toast="Archive keeps Reserve history">Archive Reserve</button>
  </form>`;
}

function reserveAdjustScreen() {
  return `${appHeader("Adjust Reserve", { back: "reserve-detail" })}<form class="form-page">
    ${field("Reserve", selectInput(["Tax · 2,400 PLN", "Asturias · 800 PLN"]))}
    <div class="segmented"><button type="button" data-segment class="active">Allocate</button><button type="button" data-segment>Release</button><button type="button" data-segment>Use</button></div>
    ${field("Amount", `<div class="inline-control"><input inputmode="decimal" value="200" /><b>PLN</b></div>`)}
    ${field("Date", `<input type="date" value="2026-08-04" />`)}
    ${field("Note", `<textarea placeholder="Optional"></textarea>`)}
    <div class="calculation-box"><span>Reserve after</span><b>2,600 PLN</b></div>
    <div class="calculation-box"><span>Free amount after</span><b>9,060 PLN</b></div>
    ${actionBar("Save adjustment")}
  </form>`;
}

function categoriesScreen() {
  return `${appHeader("Categories", { action: { label: "＋", screen: "category-form" } })}<div class="page-scroll">
    <div class="search-box">⌕ <input placeholder="Search Categories" /></div>
    <div class="filter-row"><button class="active">Active</button><button>Archived</button></div>
    <div class="tree-list">
      <button data-screen="category-form"><span>▾</span><b>Food</b><small>1,240 PLN</small></button>
      <button class="depth-1" data-screen="category-form"><span>▾</span><b>Groceries</b><small>860 PLN</small></button>
      <button class="depth-2" data-screen="category-form"><span>•</span><b>Weekly shop</b><small>520 PLN</small></button>
      <button class="depth-1" data-screen="category-form"><span>•</span><b>Dining out</b><small>380 PLN</small></button>
      <button data-screen="category-form"><span>▾</span><b>Home</b><small>720 PLN</small></button>
      <button class="depth-1" data-screen="category-form"><span>•</span><b>Utilities</b><small>420 PLN</small></button>
      <button class="depth-1" data-screen="category-form"><span>•</span><b>Repairs</b><small>300 PLN</small></button>
      <button data-screen="category-form"><span>•</span><b>Income</b><small>8,200 PLN</small></button>
    </div>
    <div class="info-box"><p>Every node can classify a Transaction directly, even when it has children. Reports include the node and all descendants.</p></div>
  </div>`;
}

function categoryFormScreen() {
  return `${appHeader("Category", { back: "categories" })}<form class="form-page">
    ${field("Name", textInput("Groceries"))}
    ${field("Parent Category", selectInput(["None — top level", "Food", "Food › Groceries", "Home"], 1), "Any active Category in this Book")}
    <div class="path-preview"><small>RESULTING PATH</small><b>Food › Groceries</b></div>
    <div class="info-box"><b>Hierarchy validation</b><p>The app rejects self-parenting, descendant cycles, missing parents, and cross-Book parents.</p></div>
    ${actionBar("Save Category")}
    <button type="button" class="danger wide" data-toast="Archiving also archives the subtree">Archive Category and subtree</button>
  </form>`;
}

function counterpartiesScreen() {
  return `${appHeader("Counterparties", { action: { label: "＋", screen: "counterparty-form" } })}<div class="page-scroll">
    <div class="search-box">⌕ <input placeholder="Search people and organizations" /></div>
    <div class="alpha-rule">A</div>
    ${listRow("Acme Studio", "Payer in 6 income Transactions", "8,200 PLN", "counterparty-form")}
    <div class="alpha-rule">B</div>
    ${listRow("Biedronka", "Payee in 18 expenses", "1,420 PLN", "counterparty-form")}
    <div class="alpha-rule">F</div>
    ${listRow("Figma", "Payee in 4 expenses", "248 PLN", "counterparty-form")}
    <div class="info-box"><p>The same Counterparty becomes payer or payee according to Transaction direction. Transfers have no Counterparty.</p></div>
  </div>`;
}

function counterpartyFormScreen() {
  return `${appHeader("Counterparty", { back: "counterparties" })}<form class="form-page">
    ${field("Name", textInput("Biedronka"))}
    ${field("Note", `<textarea placeholder="Optional"></textarea>`)}
    <div class="history-box"><b>Used in history</b><p>18 expense Transactions</p><p>Last used today</p></div>
    ${actionBar("Save Counterparty")}
    <button type="button" class="danger wide" data-toast="Archive hides this Counterparty from new entries">Archive Counterparty</button>
  </form>`;
}

function reportsScreen() {
  return `${appHeader("Reports", { back: "activity" })}<div class="page-scroll">
    <div class="filter-row"><button>August 2026⌄</button><button>All Accounts⌄</button></div>
    <div class="two-column">${metric("Income", "8,200 PLN")}${metric("Expenses", "2,185 PLN")}</div>
    <div class="wire-chart"><div style="height:35%"></div><div style="height:62%"></div><div style="height:48%"></div><div style="height:80%"></div><div style="height:55%"></div><div style="height:72%"></div></div>
    <div class="section-title"><h2>Expenses by Category</h2><button>View all</button></div>
    <div class="report-row"><b>Food</b><span class="bar"><i style="width:72%"></i></span><strong>1,240</strong></div>
    <div class="report-row depth"><b>Groceries</b><span class="bar"><i style="width:50%"></i></span><strong>860</strong></div>
    <div class="report-row depth"><b>Dining out</b><span class="bar"><i style="width:22%"></i></span><strong>380</strong></div>
    <div class="report-row"><b>Home</b><span class="bar"><i style="width:42%"></i></span><strong>720</strong></div>
    <div class="section-title"><h2>Net worth</h2><span>51,840 PLN</span></div>
    <div class="line-placeholder">NET WORTH OVER TIME</div>
  </div>`;
}

function booksScreen() {
  return `${appHeader("Books", { back: "home", action: { label: "＋", screen: "book-setup" } })}<div class="page-scroll">
    <div class="book-card active"><small>CURRENT BOOK</small><h2>Family</h2><p>Base currency PLN</p><dl><dt>Free amount</dt><dd>9,260 PLN</dd><dt>Last changed</dt><dd>Just now</dd><dt>iCloud</dt><dd>Synced ✓</dd></dl><button data-screen="home">Open Book</button></div>
    <div class="book-card"><h2>Personal EUR</h2><p>Base currency EUR</p><dl><dt>Free amount</dt><dd>2,130 EUR</dd><dt>Last changed</dt><dd>Yesterday</dd><dt>iCloud</dt><dd>Synced ✓</dd></dl><button data-screen="home">Open Book</button></div>
    <div class="info-box"><p>Books are independent. Accounts, Categories, Counterparties, Reserves, and operations never cross between them.</p></div>
  </div>`;
}

function bookSettingsScreen() {
  return `${appHeader("Book settings", { back: "home" })}<div class="page-scroll">
    <div class="settings-group"><h2>Book</h2>${listRow("Name", "Family", "", "book-setup")}${listRow("Base currency", "PLN · cannot change in POC", "")}${listRow("Accounts", "3 active", "", "accounts")}</div>
    <div class="settings-group"><h2>Organization</h2>${listRow("Categories", "8 active", "", "categories")}${listRow("Counterparties", "14 active", "", "counterparties")}${listRow("Reserves", "2 active", "", "reserves")}</div>
    <div class="settings-group"><h2>Data</h2>${listRow("iCloud, export, and backup", "Synced", "", "data-sync")}${listRow("Books", "2 on this device", "", "books")}</div>
    <div class="settings-group"><h2>Deferred</h2><div class="disabled-row">Family sharing — later</div><div class="disabled-row">Provider routing — automatic</div></div>
    <button class="danger wide" data-toast="Deleting a Book is intentionally not designed yet">Delete Book…</button>
  </div>`;
}

function dataSyncScreen() {
  return `${appHeader("Data and sync", { back: "book-settings" })}<div class="page-scroll">
    <div class="sync-status"><span class="status-placeholder">✓</span><div><b>iCloud is up to date</b><small>Last synchronized just now</small></div></div>
    <div class="settings-group"><h2>Synchronization</h2>${listRow("This device", "iPhone · active now", "")}${listRow("Other device", "Last synchronized 4 min ago", "")}</div>
    <button class="secondary wide" data-toast="Request an iCloud synchronization">Sync now</button>
    <div class="settings-group"><h2>Portability</h2>${listRow("Export Transactions as CSV", "For spreadsheets and review", "")}${listRow("Create complete backup", "All Book data and history", "")}${listRow("Restore from backup", "Into an empty Book", "")}</div>
    <div class="info-box"><b>No conventional backend</b><p>Personal-device synchronization uses the same iCloud account. Invitations to other people are deferred.</p></div>
  </div>`;
}

window.addEventListener("popstate", render);
window.addEventListener("keydown", (event) => {
  const target = event.target;
  const editing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
  if (editing || document.getElementById("screen-map").classList.contains("open")) return;
  if (event.key === "ArrowLeft") cycleScreen(-1);
  if (event.key === "ArrowRight") cycleScreen(1);
});

render();
