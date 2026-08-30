/* =========================================================
   FINMATE AI
   Personal Finance Dashboard
   ========================================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "finmate_transactions_v2";
  const SETTINGS_KEY = "finmate_settings_v2";

  /* =========================================================
     DEFAULT DATA
     ========================================================= */

  const CATEGORIES = [
    "Food & Dining",
    "Transport",
    "Shopping",
    "Subscriptions",
    "Fun & Social",
    "Bills",
    "Education",
    "Health",
    "Investing & Trading",
    "Other"
  ];

  const CATEGORY_COLORS = {
    "Food & Dining": "#14b8a6",
    "Transport": "#3b82f6",
    "Shopping": "#8b5cf6",
    "Subscriptions": "#ec4899",
    "Fun & Social": "#f97316",
    "Bills": "#ef4444",
    "Education": "#06b6d4",
    "Health": "#22c55e",
    "Investing & Trading": "#eab308",
    "Other": "#64748b"
  };

  const DEFAULT_SETTINGS = {
    monthlyIncome: 15000,
    fixedCosts: 5000,
    graduationMonths: 48,
    monthlyInvestment: 2500,
    budgets: {
      "Food & Dining": 4000,
      "Transport": 2000,
      "Shopping": 2500,
      "Subscriptions": 1000,
      "Fun & Social": 2000,
      "Bills": 2000,
      "Education": 2000,
      "Health": 1500,
      "Investing & Trading": 3000,
      "Other": 1500
    }
  };

  const DEFAULT_TRANSACTIONS = [
    {
      id: 1,
      desc: "Swiggy dinner",
      amount: 450,
      category: "Food & Dining",
      date: new Date().toISOString().slice(0, 10)
    },
    {
      id: 2,
      desc: "Ola ride to college",
      amount: 140,
      category: "Transport",
      date: new Date().toISOString().slice(0, 10)
    },
    {
      id: 3,
      desc: "Zerodha SIP - Nifty 50",
      amount: 2000,
      category: "Investing & Trading",
      date: new Date().toISOString().slice(0, 10)
    },
    {
      id: 4,
      desc: "Netflix subscription",
      amount: 199,
      category: "Subscriptions",
      date: new Date().toISOString().slice(0, 10)
    },
    {
      id: 5,
      desc: "PVR movie with friends",
      amount: 450,
      category: "Fun & Social",
      date: new Date().toISOString().slice(0, 10)
    }
  ];

  /* =========================================================
     STORAGE
     ========================================================= */

  function loadTransactions() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not load transactions", e);
    }

    return DEFAULT_TRANSACTIONS;
  }

  function saveTransactions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          budgets: {
            ...DEFAULT_SETTINGS.budgets,
            ...(parsed.budgets || {})
          }
        };
      }
    } catch (e) {
      console.warn("Could not load settings", e);
    }

    return DEFAULT_SETTINGS;
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  }

  /* =========================================================
     STATE
     ========================================================= */

  const state = {
    transactions: loadTransactions(),
    settings: loadSettings(),
    chartPeriod: "month",
    search: "",
    categoryFilter: "All"
  };

  /* =========================================================
     HELPERS
     ========================================================= */

  function money(value) {
    return "₹" + Math.round(Number(value) || 0).toLocaleString("en-IN");
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function isThisMonth(dateString) {
    const d = new Date(dateString + "T00:00:00");
    const now = new Date();

    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }

  function isThisWeek(dateString) {
    const d = new Date(dateString + "T00:00:00");
    const now = new Date();

    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - diff);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return d >= start && d < end;
  }

  function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function getFilteredTransactions() {
    let transactions = [...state.transactions];

    if (state.search.trim()) {
      const query = state.search.toLowerCase();

      transactions = transactions.filter((t) =>
        t.desc.toLowerCase().includes(query)
      );
    }

    if (state.categoryFilter !== "All") {
      transactions = transactions.filter(
        (t) => t.category === state.categoryFilter
      );
    }

    return transactions.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }

  function getPeriodTransactions() {
    if (state.chartPeriod === "week") {
      return state.transactions.filter((t) => isThisWeek(t.date));
    }

    if (state.chartPeriod === "month") {
      return state.transactions.filter((t) => isThisMonth(t.date));
    }

    return [...state.transactions];
  }

  function getCategoryTotals(transactions) {
    const totals = {};

    CATEGORIES.forEach((category) => {
      totals[category] = 0;
    });

    transactions.forEach((transaction) => {
      if (!totals[transaction.category]) {
        totals[transaction.category] = 0;
      }

      totals[transaction.category] += Number(transaction.amount) || 0;
    });

    return totals;
  }

  function getSpending() {
    return state.transactions
      .filter((t) => isThisMonth(t.date))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }

  function getRemainingBalance() {
    return (
      Number(state.settings.monthlyIncome || 0) -
      Number(state.settings.fixedCosts || 0) -
      getSpending()
    );
  }

  /* =========================================================
     ICONS
     ========================================================= */

  function icon(name) {
    const icons = {
      wallet: "💰",
      plus: "＋",
      trash: "🗑",
      chart: "◔",
      calendar: "📅",
      upload: "↑",
      graduation: "🎓",
      trend: "↗",
      settings: "⚙",
      arrow: "→",
      check: "✓",
      alert: "!",
      coffee: "☕"
    };

    return icons[name] || "";
  }

  /* =========================================================
     DONUT CHART
     ========================================================= */

  function createDonutChart(transactions) {
    const totals = getCategoryTotals(transactions);

    const data = Object.entries(totals)
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]);

    const total = data.reduce((sum, [, value]) => sum + value, 0);

    if (!total) {
      return `
        <div class="empty-chart">
          <div class="empty-chart-icon">◔</div>
          <strong>No spending yet</strong>
          <span>Add a transaction to see your spending breakdown.</span>
        </div>
      `;
    }

    let cumulative = 0;

    const gradientParts = data.map(([category, value]) => {
      const start = (cumulative / total) * 360;
      cumulative += value;
      const end = (cumulative / total) * 360;

      return `${CATEGORY_COLORS[category] || "#64748b"} ${start}deg ${end}deg`;
    });

    const gradient = gradientParts.join(", ");

    return `
      <div class="chart-layout">
        <div
          class="donut"
          style="background: conic-gradient(${gradient});"
        >
          <div class="donut-center">
            <strong>${money(total)}</strong>
            <span>spent</span>
          </div>
        </div>

        <div class="chart-legend">
          ${data
            .map(([category, value]) => {
              const percentage = Math.round((value / total) * 100);

              return `
                <div class="legend-row">
                  <div class="legend-name">
                    <span
                      class="legend-dot"
                      style="background:${CATEGORY_COLORS[category] || "#64748b"}"
                    ></span>
                    ${escapeHTML(category)}
                  </div>
                  <div class="legend-value">
                    ${money(value)}
                    <small>${percentage}%</small>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  /* =========================================================
     MONTHLY BAR CHART
     ========================================================= */

  function createMonthlyChart() {
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();

      d.setDate(1);
      d.setMonth(d.getMonth() - i);

      const month = d.getMonth();
      const year = d.getFullYear();

      const amount = state.transactions
        .filter((t) => {
          const td = new Date(t.date + "T00:00:00");

          return (
            td.getMonth() === month &&
            td.getFullYear() === year
          );
        })
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      months.push({
        label: d.toLocaleDateString("en-IN", {
          month: "short"
        }),
        amount
      });
    }

    const max = Math.max(...months.map((m) => m.amount), 1);

    return `
      <div class="bar-chart">
        ${months
          .map((month) => {
            const height = Math.max(
              (month.amount / max) * 100,
              month.amount > 0 ? 4 : 0
            );

            return `
              <div class="bar-column">
                <div class="bar-value">
                  ${month.amount > 0 ? money(month.amount) : ""}
                </div>

                <div class="bar-track">
                  <div
                    class="bar"
                    style="height:${height}%"
                  ></div>
                </div>

                <span>${month.label}</span>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  /* =========================================================
     TRANSACTION ROW
     ========================================================= */

  function transactionRow(transaction) {
    return `
      <div class="transaction-row">
        <div class="transaction-icon">
          ${categoryIcon(transaction.category)}
        </div>

        <div class="transaction-main">
          <strong>${escapeHTML(transaction.desc)}</strong>

          <div class="transaction-meta">
            <span>${escapeHTML(transaction.category)}</span>
            <span>•</span>
            <span>${formatDate(transaction.date)}</span>
          </div>
        </div>

        <div class="transaction-amount">
          ${money(transaction.amount)}
        </div>

        <button
          class="delete-button"
          title="Delete transaction"
          data-delete="${transaction.id}"
        >
          ${icon("trash")}
        </button>
      </div>
    `;
  }

  function categoryIcon(category) {
    const icons = {
      "Food & Dining": "🍔",
      Transport: "🚗",
      Shopping: "🛍️",
      Subscriptions: "📺",
      "Fun & Social": "🎉",
      Bills: "📄",
      Education: "📚",
      Health: "❤️",
      "Investing & Trading": "📈",
      Other: "💳"
    };

    return icons[category] || "💳";
  }

  /* =========================================================
     BUDGET SECTION
     ========================================================= */

  function createBudgets() {
    const totals = getCategoryTotals(
      state.transactions.filter((t) => isThisMonth(t.date))
    );

    return CATEGORIES.map((category) => {
      const spent = totals[category] || 0;
      const budget = Number(
        state.settings.budgets[category] || 0
      );

      const percentage =
        budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

      const exceeded = budget > 0 && spent > budget;

      return `
        <div class="budget-row">
          <div class="budget-header">
            <div>
              <strong>${categoryIcon(category)} ${escapeHTML(category)}</strong>
            </div>

            <span class="${exceeded ? "danger-text" : ""}">
              ${money(spent)} / ${money(budget)}
            </span>
          </div>

          <div class="budget-track">
            <div
              class="budget-progress ${exceeded ? "danger-progress" : ""}"
              style="width:${percentage}%"
            ></div>
          </div>
        </div>
      `;
    }).join("");
  }

  /* =========================================================
     GRADUATION PROJECTION
     ========================================================= */

  function calculateProjection(months) {
    const monthlyInvestment = Number(
      state.settings.monthlyInvestment || 0
    );

    const monthlyRate = 0.01;

    if (!months || months < 1) {
      return 0;
    }

    return Math.round(
      monthlyInvestment *
        ((Math.pow(1 + monthlyRate, months) - 1) /
          monthlyRate)
    );
  }

  /* =========================================================
     MAIN RENDER
     ========================================================= */

  function render() {
    const monthlySpending = getSpending();

    const remainingBalance = getRemainingBalance();

    const allPeriodTransactions = getPeriodTransactions();

    const periodSpending = allPeriodTransactions.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    );

    const transactions = getFilteredTransactions();

    const graduationMonths = Math.max(
      1,
      Number(state.settings.graduationMonths) || 1
    );

    const projectedValue =
      calculateProjection(graduationMonths);

    const balancePositive = remainingBalance >= 0;

    const periodLabel =
      state.chartPeriod === "week"
        ? "This Week"
        : state.chartPeriod === "month"
        ? "This Month"
        : "All Time";

    document.getElementById("root").innerHTML = `
      <div class="app-shell">

        <!-- HEADER -->
        <header class="topbar">
          <div class="brand">
            <div class="brand-logo">FM</div>

            <div>
              <h1>FinMate AI</h1>
              <p>Your personal finance dashboard</p>
            </div>
          </div>

          <div class="header-status">
            <span class="status-dot"></span>
            Data saved locally
          </div>
        </header>

        <main class="container">

          <!-- WELCOME -->
          <section class="welcome">
            <div>
              <p class="eyebrow">FINANCIAL OVERVIEW</p>
              <h2>Know where your money goes.</h2>
              <p>
                Track your spending, manage your balance and see
                how your money could grow before graduation.
              </p>
            </div>

            <button class="primary-button" id="scroll-add">
              ${icon("plus")} Add transaction
            </button>
          </section>

          <!-- SUMMARY CARDS -->
          <section class="summary-grid">

            <div class="summary-card income-card">
              <div class="summary-icon">💰</div>

              <div>
                <span>Monthly income</span>

                <strong>${money(
                  state.settings.monthlyIncome
                )}</strong>

                <small>Money available this month</small>
              </div>
            </div>

            <div class="summary-card spending-card">
              <div class="summary-icon">📊</div>

              <div>
                <span>Spent this month</span>

                <strong>${money(monthlySpending)}</strong>

                <small>
                  ${money(
                    state.settings.monthlyIncome
                      ? (monthlySpending /
                          state.settings.monthlyIncome) *
                          100
                      : 0
                  )}%
                  of income
                </small>
              </div>
            </div>

            <div
              class="summary-card balance-card ${
                balancePositive
                  ? "balance-positive"
                  : "balance-negative"
              }"
            >
              <div class="summary-icon">
                ${balancePositive ? "✓" : "!"}
              </div>

              <div>
                <span>Remaining balance</span>

                <strong>${money(remainingBalance)}</strong>

                <small>
                  Income − fixed costs − spending
                </small>
              </div>
            </div>

          </section>

          <div class="dashboard-grid">

            <!-- LEFT COLUMN -->
            <div class="left-column">

              <!-- ADD TRANSACTION -->
              <section class="card add-card" id="add-transaction">

                <div class="card-title">
                  <div>
                    <p class="eyebrow">TRANSACTIONS</p>
                    <h3>Add a transaction</h3>
                  </div>

                  <div class="title-icon">
                    ${icon("plus")}
                  </div>
                </div>

                <form id="transaction-form">

                  <div class="form-grid">

                    <div class="field field-wide">
                      <label>Description</label>

                      <input
                        id="transaction-description"
                        type="text"
                        placeholder="e.g. Swiggy dinner"
                        required
                      />
                    </div>

                    <div class="field">
                      <label>Amount</label>

                      <div class="input-prefix">
                        <span>₹</span>

                        <input
                          id="transaction-amount"
                          type="number"
                          min="1"
                          step="1"
                          placeholder="450"
                          required
                        />
                      </div>
                    </div>

                    <div class="field">
                      <label>Date</label>

                      <input
                        id="transaction-date"
                        type="date"
                        value="${todayISO()}"
                        required
                      />
                    </div>

                    <div class="field">
                      <label>Category</label>

                      <select id="transaction-category">
                        ${CATEGORIES.map(
                          (category) =>
                            `<option value="${category}">
                              ${category}
                            </option>`
                        ).join("")}
                      </select>
                    </div>

                  </div>

                  <div class="form-actions">
                    <button
                      type="submit"
                      class="primary-button"
                    >
                      ${icon("plus")} Add transaction
                    </button>

                    <label class="secondary-button upload-button">
                      ${icon("upload")}
                      Upload CSV
                      <input
                        type="file"
                        id="csv-upload"
                        accept=".csv,text/csv"
                        hidden
                      />
                    </label>
                  </div>

                  <p class="form-help">
                    CSV format:
                    <strong>description, amount, category, date</strong>
                  </p>

                </form>
              </section>

              <!-- SPENDING CHART -->
              <section class="card">

                <div class="card-title chart-title">

                  <div>
                    <p class="eyebrow">SPENDING ANALYSIS</p>
                    <h3>Where is your money going?</h3>
                  </div>

                  <div class="period-buttons">

                    <button
                      class="${
                        state.chartPeriod === "week"
                          ? "active"
                          : ""
                      }"
                      data-period="week"
                    >
                      Week
                    </button>

                    <button
                      class="${
                        state.chartPeriod === "month"
                          ? "active"
                          : ""
                      }"
                      data-period="month"
                    >
                      Month
                    </button>

                    <button
                      class="${
                        state.chartPeriod === "all"
                          ? "active"
                          : ""
                      }"
                      data-period="all"
                    >
                      All time
                    </button>

                  </div>

                </div>

                <div class="chart-summary">
                  <div>
                    <span>${periodLabel}</span>
                    <strong>${money(periodSpending)}</strong>
                  </div>

                  <div class="chart-summary-note">
                    Based on your transactions
                  </div>
                </div>

                ${createDonutChart(
                  allPeriodTransactions
                )}

              </section>

              <!-- MONTHLY SPENDING -->
              <section class="card">

                <div class="card-title">

                  <div>
                    <p class="eyebrow">SPENDING TREND</p>
                    <h3>Last 6 months</h3>
                  </div>

                  <div class="title-icon">
                    ${icon("trend")}
                  </div>

                </div>

                ${createMonthlyChart()}

              </section>

              <!-- TRANSACTIONS -->
              <section class="card">

                <div class="card-title transaction-heading">

                  <div>
                    <p class="eyebrow">ACTIVITY</p>
                    <h3>Transactions</h3>
                  </div>

                  <span class="transaction-count">
                    ${state.transactions.length}
                    transactions
                  </span>

                </div>

                <div class="transaction-filters">

                  <input
                    id="transaction-search"
                    type="search"
                    placeholder="Search transactions..."
                    value="${escapeHTML(state.search)}"
                  />

                  <select id="category-filter">
                    <option value="All">All categories</option>

                    ${CATEGORIES.map(
                      (category) =>
                        `<option
                          value="${category}"
                          ${
                            state.categoryFilter === category
                              ? "selected"
                              : ""
                          }
                        >
                          ${category}
                        </option>`
                    ).join("")}

                  </select>

                </div>

                <div class="transactions-list">

                  ${
                    transactions.length
                      ? transactions
                          .map(transactionRow)
                          .join("")
                      : `
                        <div class="empty-state">
                          <div>📭</div>
                          <strong>No transactions found</strong>
                          <span>
                            Add a transaction or change your filters.
                          </span>
                        </div>
                      `
                  }

                </div>

              </section>

            </div>

            <!-- RIGHT COLUMN -->
            <aside class="right-column">

              <!-- SETTINGS -->
              <section class="card">

                <div class="card-title">

                  <div>
                    <p class="eyebrow">SETTINGS</p>
                    <h3>Monthly plan</h3>
                  </div>

                  <div class="title-icon">
                    ${icon("settings")}
                  </div>

                </div>

                <div class="settings-fields">

                  <div class="field">
                    <label>Monthly income</label>

                    <div class="input-prefix">
                      <span>₹</span>

                      <input
                        id="monthly-income"
                        type="number"
                        min="0"
                        value="${state.settings.monthlyIncome}"
                      />
                    </div>
                  </div>

                  <div class="field">
                    <label>Fixed costs</label>

                    <div class="input-prefix">
                      <span>₹</span>

                      <input
                        id="fixed-costs"
                        type="number"
                        min="0"
                        value="${state.settings.fixedCosts}"
                      />
                    </div>
                  </div>

                </div>

                <div class="mini-balance">

                  <div>
                    <span>After fixed costs</span>

                    <strong>
                      ${money(
                        Number(
                          state.settings.monthlyIncome
                        ) -
                          Number(
                            state.settings.fixedCosts
                          )
                      )}
                    </strong>
                  </div>

                  <span class="mini-arrow">→</span>

                </div>

              </section>

              <!-- BALANCE CARD -->
              <section
                class="balance-panel ${
                  balancePositive
                    ? "positive"
                    : "negative"
                }"
              >

                <div class="balance-panel-icon">
                  ${balancePositive ? "✓" : "!"}
                </div>

                <span>Remaining this month</span>

                <strong>${money(remainingBalance)}</strong>

                <p>
                  ${
                    balancePositive
                      ? "You're currently within your available monthly balance."
                      : "Your spending has gone beyond your available monthly balance."
                  }
                </p>

              </section>

              <!-- GRADUATION -->
              <section class="card graduation-card">

                <div class="card-title">

                  <div>
                    <p class="eyebrow">GROWTH PROJECTOR</p>
                    <h3>Until graduation</h3>
                  </div>

                  <div class="title-icon">
                    🎓
                  </div>

                </div>

                <p class="section-description">
                  See how your monthly investment could grow
                  over any number of months.
                </p>

                <div class="graduation-input">

                  <label>Months until graduation</label>

                  <div class="months-input">

                    <input
                      id="graduation-months"
                      type="number"
                      min="1"
                      max="600"
                      value="${graduationMonths}"
                    />

                    <span>months</span>

                  </div>

                </div>

                <div class="graduation-result">

                  <span>
                    Projected value after
                    ${graduationMonths} months
                  </span>

                  <strong>
                    ${money(projectedValue)}
                  </strong>

                </div>

                <div class="growth-input">

                  <label>
                    Monthly investment
                  </label>

                  <div class="input-prefix">

                    <span>₹</span>

                    <input
                      id="monthly-investment"
                      type="number"
                      min="0"
                      value="${state.settings.monthlyInvestment}"
                    />

                  </div>

                </div>

              </section>

              <!-- BUDGETS -->
              <section class="card">

                <div class="card-title">

                  <div>
                    <p class="eyebrow">BUDGET CONTROL</p>
                    <h3>Category budgets</h3>
                  </div>

                </div>

                <div class="budgets">
                  ${createBudgets()}
                </div>

              </section>

            </aside>

          </div>

        </main>

        <footer class="footer">
          <span>FinMate AI</span>
          <span>Personal finance made simpler.</span>
        </footer>

      </div>
    `;

    attachEvents();
  }

  /* =========================================================
     EVENTS
     ========================================================= */

  function attachEvents() {

    /* Add transaction */

    const form = document.getElementById(
      "transaction-form"
    );

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();

        const description =
          document.getElementById(
            "transaction-description"
          ).value.trim();

        const amount = Number(
          document.getElementById(
            "transaction-amount"
          ).value
        );

        const date =
          document.getElementById(
            "transaction-date"
          ).value;

        const category =
          document.getElementById(
            "transaction-category"
          ).value;

        if (!description || !amount || amount <= 0 || !date) {
          alert("Please enter a valid transaction.");
          return;
        }

        state.transactions.push({
          id: Date.now(),
          desc: description,
          amount,
          category,
          date
        });

        saveTransactions();

        render();
      });
    }

    /* CSV Upload */

    const csvUpload =
      document.getElementById("csv-upload");

    if (csvUpload) {
      csvUpload.addEventListener("change", function (event) {
        const file = event.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (e) {
          try {
            const text = e.target.result;

            const rows = parseCSV(text);

            let added = 0;

            rows.forEach((row, index) => {
              if (index === 0 && isHeaderRow(row)) {
                return;
              }

              const description = row[0]?.trim();
              const amount = Number(
                String(row[1] || "")
                  .replace(/₹/g, "")
                  .replace(/,/g, "")
                  .trim()
              );

              const category =
                CATEGORIES.includes(row[2]?.trim())
                  ? row[2].trim()
                  : "Other";

              const date =
                row[3]?.trim() || todayISO();

              if (
                description &&
                amount &&
                amount > 0
              ) {
                state.transactions.push({
                  id:
                    Date.now() +
                    Math.random(),
                  desc: description,
                  amount,
                  category,
                  date
                });

                added++;
              }
            });

            saveTransactions();

            alert(
              `${added} transaction${
                added === 1 ? "" : "s"
              } imported successfully.`
            );

            render();
          } catch (error) {
            console.error(error);

            alert(
              "Could not read this CSV file. Please check the format."
            );
          }
        };

        reader.readAsText(file);
      });
    }

    /* Delete transactions */

    document
      .querySelectorAll("[data-delete]")
      .forEach((button) => {
        button.addEventListener("click", function () {
          const id = this.getAttribute("data-delete");

          const transaction =
            state.transactions.find(
              (t) => String(t.id) === String(id)
            );

          if (!transaction) return;

          const confirmed = confirm(
            `Delete "${transaction.desc}" for ${money(
              transaction.amount
            )}?`
          );

          if (!confirmed) return;

          state.transactions =
            state.transactions.filter(
              (t) => String(t.id) !== String(id)
            );

          saveTransactions();

          render();
        });
      });

    /* Chart period */

    document
      .querySelectorAll("[data-period]")
      .forEach((button) => {
        button.addEventListener("click", function () {
          state.chartPeriod =
            this.getAttribute("data-period");

          render();
        });
      });

    /* Search */

    const searchInput = document.getElementById(
      "transaction-search"
    );

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.search = this.value;

        const list =
          document.querySelector(".transactions-list");

        if (!list) return;

        const transactions =
          getFilteredTransactions();

        list.innerHTML = transactions.length
          ? transactions.map(transactionRow).join("")
          : `
            <div class="empty-state">
              <div>📭</div>
              <strong>No transactions found</strong>
              <span>Try another search.</span>
            </div>
          `;

        attachDeleteEventsOnly();
      });
    }

    /* Category filter */

    const categoryFilter =
      document.getElementById(
        "category-filter"
      );

    if (categoryFilter) {
      categoryFilter.addEventListener(
        "change",
        function () {
          state.categoryFilter = this.value;
          render();
        }
      );
    }

    /* Monthly income */

    const incomeInput =
      document.getElementById(
        "monthly-income"
      );

    if (incomeInput) {
      incomeInput.addEventListener(
        "change",
        function () {
          state.settings.monthlyIncome =
            Math.max(0, Number(this.value) || 0);

          saveSettings();
          render();
        }
      );
    }

    /* Fixed costs */

    const fixedCosts =
      document.getElementById(
        "fixed-costs"
      );

    if (fixedCosts) {
      fixedCosts.addEventListener(
        "change",
        function () {
          state.settings.fixedCosts =
            Math.max(0, Number(this.value) || 0);

          saveSettings();
          render();
        }
      );
    }

    /* Graduation months */

    const graduationMonths =
      document.getElementById(
        "graduation-months"
      );

    if (graduationMonths) {
      graduationMonths.addEventListener(
        "change",
        function () {
          let value =
            Math.max(
              1,
              Math.min(
                600,
                Number(this.value) || 1
              )
            );

          state.settings.graduationMonths =
            value;

          saveSettings();
          render();
        }
      );
    }

    /* Monthly investment */

    const monthlyInvestment =
      document.getElementById(
        "monthly-investment"
      );

    if (monthlyInvestment) {
      monthlyInvestment.addEventListener(
        "change",
        function () {
          state.settings.monthlyInvestment =
            Math.max(
              0,
              Number(this.value) || 0
            );

          saveSettings();
          render();
        }
      );
    }

    /* Budget inputs */

    document
      .querySelectorAll("[data-budget]")
      .forEach((input) => {
        input.addEventListener(
          "change",
          function () {
            const category =
              this.getAttribute(
                "data-budget"
              );

            state.settings.budgets[category] =
              Math.max(
                0,
                Number(this.value) || 0
              );

            saveSettings();
            render();
          }
        );
      });

    /* Scroll to transaction form */

    const scrollButton =
      document.getElementById(
        "scroll-add"
      );

    if (scrollButton) {
      scrollButton.addEventListener(
        "click",
        function () {
          document
            .getElementById(
              "add-transaction"
            )
            ?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
        }
      );
    }

    attachDeleteEventsOnly();
  }

  function attachDeleteEventsOnly() {
    document
      .querySelectorAll("[data-delete]")
      .forEach((button) => {
        button.onclick = function () {
          const id =
            this.getAttribute("data-delete");

          const transaction =
            state.transactions.find(
              (t) =>
                String(t.id) ===
                String(id)
            );

          if (!transaction) return;

          if (
            confirm(
              `Delete "${transaction.desc}" for ${money(
                transaction.amount
              )}?`
            )
          ) {
            state.transactions =
              state.transactions.filter(
                (t) =>
                  String(t.id) !==
                  String(id)
              );

            saveTransactions();

            render();
          }
        };
      });
  }

  /* =========================================================
     CSV PARSER
     ========================================================= */

  function parseCSV(text) {
    const rows = [];

    let row = [];
    let value = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"' && insideQuotes && next === '"') {
        value += '"';
        i++;
        continue;
      }

      if (char === '"') {
        insideQuotes = !insideQuotes;
        continue;
      }

      if (char === "," && !insideQuotes) {
        row.push(value);
        value = "";
        continue;
      }

      if (
        (char === "\n" || char === "\r") &&
        !insideQuotes
      ) {
        if (char === "\r" && next === "\n") {
          i++;
        }

        row.push(value);

        if (row.some((item) => item.trim() !== "")) {
          rows.push(row);
        }

        row = [];
        value = "";

        continue;
      }

      value += char;
    }

    if (value || row.length) {
      row.push(value);

      if (row.some((item) => item.trim() !== "")) {
        rows.push(row);
      }
    }

    return rows;
  }

  function isHeaderRow(row) {
    const first = String(
      row[0] || ""
    ).toLowerCase();

    const second = String(
      row[1] || ""
    ).toLowerCase();

    return (
      first.includes("description") ||
      first.includes("transaction") ||
      second.includes("amount")
    );
  }

  /* =========================================================
     STYLES
     ========================================================= */

  const style = document.createElement("style");

  style.textContent = `

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      background:
        linear-gradient(
          180deg,
          #f8fafc 0%,
          #eef7f6 100%
        );

      color: #0f172a;
    }

    button,
    input,
    select {
      font: inherit;
    }

    button {
      cursor: pointer;
    }

    .app-shell {
      min-height: 100vh;
    }

    /* HEADER */

    .topbar {
      height: 76px;
      background: rgba(255,255,255,.92);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid #e2e8f0;

      display: flex;
      align-items: center;
      justify-content: space-between;

      padding: 0 5vw;

      position: sticky;
      top: 0;
      z-index: 50;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      width: 42px;
      height: 42px;
      border-radius: 12px;

      background:
        linear-gradient(
          135deg,
          #0f766e,
          #14b8a6
        );

      color: white;

      display: flex;
      align-items: center;
      justify-content: center;

      font-weight: 800;
      letter-spacing: -.5px;

      box-shadow:
        0 8px 20px rgba(20,184,166,.2);
    }

    .brand h1 {
      margin: 0;
      font-size: 18px;
      letter-spacing: -.4px;
    }

    .brand p {
      margin: 2px 0 0;
      font-size: 12px;
      color: #64748b;
    }

    .header-status {
      color: #64748b;
      font-size: 12px;

      display: flex;
      align-items: center;
      gap: 7px;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 0 4px #d1fae5;
    }

    /* MAIN */

    .container {
      width: min(1200px, 92vw);
      margin: auto;
      padding: 36px 0 60px;
    }

    .welcome {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 30px;

      margin-bottom: 28px;
    }

    .welcome h2 {
      margin: 5px 0 7px;
      font-size: clamp(28px, 4vw, 42px);
      line-height: 1.05;
      letter-spacing: -1.5px;
    }

    .welcome p:not(.eyebrow) {
      color: #64748b;
      margin: 0;
      max-width: 600px;
      line-height: 1.6;
    }

    .eyebrow {
      margin: 0;
      color: #0f766e;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.4px;
    }

    /* BUTTONS */

    .primary-button,
    .secondary-button {
      border: none;
      border-radius: 11px;

      padding: 11px 16px;

      font-size: 13px;
      font-weight: 700;

      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;

      transition:
        transform .15s ease,
        box-shadow .15s ease,
        background .15s ease;
    }

    .primary-button {
      background: #0f766e;
      color: white;

      box-shadow:
        0 7px 18px rgba(15,118,110,.18);
    }

    .primary-button:hover {
      background: #115e59;
      transform: translateY(-1px);
    }

    .secondary-button {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #e2e8f0;
    }

    .secondary-button:hover {
      background: #e2e8f0;
    }

    /* SUMMARY */

    .summary-grid {
      display: grid;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));

      gap: 16px;

      margin-bottom: 22px;
    }

    .summary-card {
      border-radius: 18px;
      padding: 21px;

      display: flex;
      align-items: flex-start;
      gap: 14px;

      border: 1px solid #e2e8f0;
      background: white;

      box-shadow:
        0 5px 25px rgba(15,23,42,.04);
    }

    .summary-icon {
      width: 43px;
      height: 43px;

      border-radius: 12px;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 19px;
      background: #f0fdfa;
    }

    .summary-card span {
      display: block;
      color: #64748b;
      font-size: 12px;
      margin-bottom: 4px;
    }

    .summary-card strong {
      display: block;
      font-size: 25px;
      letter-spacing: -.8px;
    }

    .summary-card small {
      display: block;
      color: #94a3b8;
      margin-top: 3px;
      font-size: 10px;
    }

    .balance-positive .summary-icon {
      background: #ecfdf5;
      color: #059669;
    }

    .balance-negative .summary-icon {
      background: #fef2f2;
      color: #dc2626;
    }

    /* DASHBOARD */

    .dashboard-grid {
      display: grid;
      grid-template-columns:
        minmax(0, 1.6fr)
        minmax(320px, .9fr);

      gap: 20px;
      align-items: start;
    }

    .left-column,
    .right-column {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* CARDS */

    .card {
      background: rgba(255,255,255,.96);
      border: 1px solid #e2e8f0;

      border-radius: 18px;

      padding: 21px;

      box-shadow:
        0 6px 28px rgba(15,23,42,.045);
    }

    .card-title {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 15px;

      margin-bottom: 18px;
    }

    .card-title h3 {
      margin: 3px 0 0;
      font-size: 17px;
      letter-spacing: -.3px;
    }

    .title-icon {
      width: 34px;
      height: 34px;

      border-radius: 10px;

      background: #f0fdfa;
      color: #0f766e;

      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* FORM */

    .form-grid {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0,1fr));

      gap: 14px;
    }

    .field-wide {
      grid-column: 1 / -1;
    }

    .field label {
      display: block;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .field input,
    .field select,
    .transaction-filters input,
    .transaction-filters select {

      width: 100%;

      border: 1px solid #cbd5e1;
      background: white;

      border-radius: 10px;

      padding: 10px 11px;

      color: #0f172a;
      font-size: 13px;

      outline: none;

      transition:
        border .15s ease,
        box-shadow .15s ease;
    }

    .field input:focus,
    .field select:focus,
    .transaction-filters input:focus,
    .transaction-filters select:focus {

      border-color: #14b8a6;

      box-shadow:
        0 0 0 3px
        rgba(20,184,166,.11);
    }

    .input-prefix {
      display: flex;
      align-items: center;

      border: 1px solid #cbd5e1;
      border-radius: 10px;

      overflow: hidden;
      background: white;
    }

    .input-prefix span {
      padding-left: 11px;
      color: #64748b;
      font-weight: 600;
    }

    .input-prefix input {
      border: none;
      box-shadow: none !important;
    }

    .form-actions {
      display: flex;
      gap: 9px;
      margin-top: 17px;
      flex-wrap: wrap;
    }

    .upload-button {
      position: relative;
      overflow: hidden;
    }

    .form-help {
      color: #94a3b8;
      font-size: 10px;
      margin: 10px 0 0;
    }

    /* CHART */

    .chart-title {
      align-items: center;
    }

    .period-buttons {
      display: flex;
      gap: 4px;

      background: #f1f5f9;
      padding: 4px;
      border-radius: 9px;
    }

    .period-buttons button {
      border: none;
      background: transparent;

      color: #64748b;

      padding: 7px 10px;
      border-radius: 7px;

      font-size: 11px;
      font-weight: 700;
    }

    .period-buttons button.active {
      background: white;
      color: #0f766e;

      box-shadow:
        0 2px 7px rgba(15,23,42,.08);
    }

    .chart-summary {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;

      margin-bottom: 18px;
    }

    .chart-summary span {
      display: block;
      font-size: 11px;
      color: #64748b;
    }

    .chart-summary strong {
      display: block;
      margin-top: 3px;
      font-size: 23px;
    }

    .chart-summary-note {
      color: #94a3b8;
      font-size: 10px;
    }

    .chart-layout {
      display: grid;
      grid-template-columns: 230px 1fr;
      align-items: center;
      gap: 20px;
    }

    .donut {
      width: 205px;
      height: 205px;
      border-radius: 50%;

      display: flex;
      align-items: center;
      justify-content: center;

      margin: auto;

      position: relative;
    }

    .donut-center {
      width: 125px;
      height: 125px;

      border-radius: 50%;
      background: white;

      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      box-shadow:
        0 4px 20px rgba(15,23,42,.06);
    }

    .donut-center strong {
      font-size: 20px;
      letter-spacing: -.6px;
    }

    .donut-center span {
      color: #94a3b8;
      font-size: 10px;
      margin-top: 2px;
    }

    .chart-legend {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .legend-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;

      font-size: 11px;
    }

    .legend-name {
      display: flex;
      align-items: center;
      gap: 7px;

      color: #475569;
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .legend-value {
      font-weight: 700;
      text-align: right;
    }

    .legend-value small {
      display: inline-block;
      margin-left: 4px;
      color: #94a3b8;
      font-weight: 500;
    }

    /* EMPTY CHART */

    .empty-chart {
      min-height: 220px;

      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      color: #64748b;
      text-align: center;
      gap: 5px;
    }

    .empty-chart-icon {
      font-size: 38px;
      color: #cbd5e1;
    }

    .empty-chart strong {
      color: #334155;
    }

    .empty-chart span {
      font-size: 11px;
    }

    /* BAR CHART */

    .bar-chart {
      height: 235px;

      display: grid;
      grid-template-columns:
        repeat(6, 1fr);

      gap: 10px;
      align-items: end;

      padding-top: 20px;
    }

    .bar-column {
      height: 100%;

      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      gap: 7px;
    }

    .bar-column > span {
      color: #94a3b8;
      font-size: 10px;
    }

    .bar-track {
      height: 170px;
      width: 100%;
      max-width: 45px;

      display: flex;
      align-items: flex-end;

      background: #f1f5f9;
      border-radius: 9px 9px 5px 5px;

      overflow: hidden;
    }

    .bar {
      width: 100%;

      background:
        linear-gradient(
          180deg,
          #14b8a6,
          #0f766e
        );

      border-radius: 8px 8px 3px 3px;

      min-height: 3px;
    }

    .bar-value {
      min-height: 13px;
      font-size: 9px;
      color: #64748b;
    }

    /* TRANSACTIONS */

    .transaction-heading {
      align-items: center;
    }

    .transaction-count {
      background: #f1f5f9;
      color: #64748b;

      padding: 6px 9px;
      border-radius: 20px;

      font-size: 10px;
    }

    .transaction-filters {
      display: grid;
      grid-template-columns: 1fr 180px;
      gap: 8px;

      margin-bottom: 13px;
    }

    .transactions-list {
      border-top: 1px solid #f1f5f9;
    }

    .transaction-row {
      display: flex;
      align-items: center;
      gap: 11px;

      padding: 12px 2px;

      border-bottom: 1px solid #f1f5f9;
    }

    .transaction-icon {
      width: 36px;
      height: 36px;

      border-radius: 10px;

      background: #f8fafc;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 15px;

      flex-shrink: 0;
    }

    .transaction-main {
      flex: 1;
      min-width: 0;
    }

    .transaction-main strong {
      display: block;

      font-size: 12px;
      font-weight: 700;

      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .transaction-meta {
      display: flex;
      gap: 5px;

      margin-top: 3px;

      color: #94a3b8;
      font-size: 9px;
    }

    .transaction-amount {
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
    }

    .delete-button {
      width: 29px;
      height: 29px;

      border: none;
      border-radius: 8px;

      background: transparent;
      color: #94a3b8;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 13px;
    }

    .delete-button:hover {
      background: #fef2f2;
      color: #dc2626;
    }

    .empty-state {
      padding: 35px 10px;

      display: flex;
      flex-direction: column;
      align-items: center;

      text-align: center;

      gap: 5px;

      color: #94a3b8;
    }

    .empty-state div {
      font-size: 30px;
      margin-bottom: 4px;
    }

    .empty-state strong {
      color: #475569;
      font-size: 12px;
    }

    .empty-state span {
      font-size: 10px;
    }

    /* SETTINGS */

    .settings-fields {
      display: grid;
      gap: 12px;
    }

    .mini-balance {
      margin-top: 15px;
      padding: 13px;

      border-radius: 11px;

      background: #f8fafc;

      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .mini-balance span {
      color: #64748b;
      font-size: 10px;
    }

    .mini-balance strong {
      display: block;
      color: #0f766e;
      font-size: 17px;
      margin-top: 2px;
    }

    .mini-arrow {
      font-size: 18px !important;
      color: #94a3b8 !important;
    }

    /* BALANCE PANEL */

    .balance-panel {
      border-radius: 18px;
      padding: 23px;

      color: white;

      box-shadow:
        0 12px 30px rgba(15,23,42,.13);
    }

    .balance-panel.positive {
      background:
        linear-gradient(
          135deg,
          #115e59,
          #0f766e
        );
    }

    .balance-panel.negative {
      background:
        linear-gradient(
          135deg,
          #991b1b,
          #dc2626
        );
    }

    .balance-panel-icon {
      width: 35px;
      height: 35px;

      border-radius: 10px;

      background: rgba(255,255,255,.13);

      display: flex;
      align-items: center;
      justify-content: center;

      margin-bottom: 14px;
    }

    .balance-panel > span {
      display: block;
      font-size: 11px;
      opacity: .78;
    }

    .balance-panel strong {
      display: block;
      font-size: 31px;
      letter-spacing: -1px;
      margin: 3px 0;
    }

    .balance-panel p {
      font-size: 10px;
      line-height: 1.5;
      opacity: .75;
      margin: 5px 0 0;
    }

    /* GRADUATION */

    .section-description {
      color: #64748b;
      font-size: 11px;
      line-height: 1.55;
      margin: -5px 0 17px;
    }

    .graduation-input label,
    .growth-input label {
      display: block;
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      margin-bottom: 6px;
    }

    .months-input {
      display: flex;
      align-items: center;

      border: 1px solid #cbd5e1;
      border-radius: 10px;

      overflow: hidden;
      background: white;
    }

    .months-input input {
      width: 100%;
      border: none;
      outline: none;
      padding: 10px;
      font-weight: 700;
    }

    .months-input span {
      padding-right: 11px;
      color: #64748b;
      font-size: 10px;
      font-weight: 600;
    }

    .graduation-result {
      margin: 14px 0;

      padding: 15px;

      border-radius: 12px;

      background:
        linear-gradient(
          135deg,
          #f0fdfa,
          #ecfeff
        );

      border: 1px solid #ccfbf1;
    }

    .graduation-result span {
      display: block;
      color: #64748b;
      font-size: 10px;
    }

    .graduation-result strong {
      display: block;
      color: #0f766e;
      font-size: 23px;
      margin-top: 3px;
    }

    .growth-input {
      margin-top: 12px;
    }

    /* BUDGETS */

    .budgets {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .budget-header {
      display: flex;
      justify-content: space-between;
      gap: 10px;

      font-size: 10px;
      margin-bottom: 5px;
    }

    .budget-header strong {
      font-weight: 600;
      color: #475569;
    }

    .budget-header > span {
      color: #64748b;
      white-space: nowrap;
    }

    .budget-track {
      height: 6px;

      border-radius: 20px;
      overflow: hidden;

      background: #f1f5f9;
    }

    .budget-progress {
      height: 100%;

      border-radius: inherit;

      background:
        linear-gradient(
          90deg,
          #14b8a6,
          #0f766e
        );
    }

    .danger-progress {
      background: #ef4444;
    }

    .danger-text {
      color: #dc2626 !important;
      font-weight: 800;
    }

    /* FOOTER */

    .footer {
      border-top: 1px solid #e2e8f0;

      padding: 20px 5vw;

      display: flex;
      justify-content: space-between;

      color: #94a3b8;
      font-size: 10px;
    }

    .footer span:first-child {
      color: #64748b;
      font-weight: 700;
    }

    /* RESPONSIVE */

    @media (max-width: 900px) {

      .dashboard-grid {
        grid-template-columns: 1fr;
      }

      .right-column {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0,1fr));
      }

      .balance-panel {
        grid-column: span 2;
      }
    }

    @media (max-width: 700px) {

      .topbar {
        padding: 0 4vw;
      }

      .header-status {
        display: none;
      }

      .container {
        width: 92vw;
        padding-top: 25px;
      }

      .welcome {
        flex-direction: column;
        align-items: flex-start;
      }

      .welcome .primary-button {
        width: 100%;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .right-column {
        display: flex;
      }

      .balance-panel {
        grid-column: auto;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .field-wide {
        grid-column: auto;
      }

      .chart-layout {
        grid-template-columns: 1fr;
      }

      .chart-title {
        flex-direction: column;
      }

      .period-buttons {
        width: 100%;
      }

      .period-buttons button {
        flex: 1;
      }

      .transaction-filters {
        grid-template-columns: 1fr;
      }

      .transaction-amount {
        font-size: 11px;
      }

      .delete-button {
        width: 27px;
      }

      .footer {
        flex-direction: column;
        gap: 5px;
      }
    }

    @media (max-width: 420px) {

      .card {
        padding: 16px;
      }

      .donut {
        width: 180px;
        height: 180px;
      }

      .donut-center {
        width: 110px;
        height: 110px;
      }

      .donut-center strong {
        font-size: 17px;
      }

      .transaction-meta {
        font-size: 8px;
      }
    }

  `;

  document.head.appendChild(style);

  /* =========================================================
     START APP
     ========================================================= */

  render();

})();
