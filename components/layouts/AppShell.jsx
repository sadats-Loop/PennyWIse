
"use client";
import BudgetPlanner from "../budget/Budgetplanner"; 
import NotificationCenter from "./NotificationCenter";
import WelcomeModal from "./WelcomeModal";
import SavingsGoals from "../savings/SavingsGoals"; 
import Assistant from "../assistant/Assistant";
import Analytics from "../analytics/Analytics";  
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Topbar from "./Topbar";
import OnboardingForm from "../onboarding/OnboardingForm";

import {
  WalletCards,
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Sparkles,
  Bell,
  Eye,
  EyeOff,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Coffee,
  Bus,
  BookOpen,
  Wallet,
  UserRound,
  CalendarDays,
  ChevronRight,
  PiggyBank,
  Search,
  X,
  Pencil,
  Trash2,
  Settings,
  Save,
  CheckCircle2,
  TrendingUp,
  CalendarClock,
} from "lucide-react";

// --------------------------------------------------
// STORAGE CONFIGURATION
// --------------------------------------------------

const STORAGE_KEY = "pennywise_transactions";
const PROFILE_STORAGE_KEY = "pennywise_profile";
const ALLOWANCE_STORAGE_KEY = "pennywise_allowance_ledger";

// --------------------------------------------------
// DATE HELPERS
// --------------------------------------------------

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getPreviousMonthKey(date = new Date()) {
  const previousMonth = new Date(
    date.getFullYear(),
    date.getMonth() - 1,
    1
  );

  return getMonthKey(previousMonth);
}

function getMonthInfo(date = new Date()) {
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();

  return {
    monthKey: getMonthKey(date),
    daysInMonth,
    daysElapsed: date.getDate(),
    daysRemaining: daysInMonth - date.getDate() + 1,
  };
}

function getMonthName(date = new Date()) {
  return date.toLocaleDateString("en-BD", {
    month: "long",
    year: "numeric",
  });
}

function getTransactionDateLabel(dateString) {
  if (!dateString) return "Unknown date";

  const today = getLocalDateString();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateString === today) return "Today";

  if (dateString === getLocalDateString(yesterday)) {
    return "Yesterday";
  }

  return new Date(`${dateString}T12:00:00`).toLocaleDateString(
    "en-BD",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getTransactionTimestamp(transaction) {
  if (!transaction.dateISO) return 0;

  const timestamp = new Date(
    `${transaction.dateISO}T12:00:00`
  ).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

// --------------------------------------------------
// TRANSACTION HELPERS
// --------------------------------------------------

function getTransactionIcon(category) {
  const icons = {
    "Food & Dining": Coffee,
    Transportation: Bus,
    Education: BookOpen,
    Income: WalletCards,
    Shopping: Wallet,
    Entertainment: Sparkles,
    Health: Wallet,
    Bills: Wallet,
    Other: Wallet,
  };

  return icons[category] || Wallet;
}

function getCategoryStyle(category) {
  const styles = {
    "Food & Dining": {
      color: "#fff0e5",
      iconColor: "#e88b39",
    },
    Transportation: {
      color: "#eaf0ff",
      iconColor: "#6084dc",
    },
    Education: {
      color: "#f2eaff",
      iconColor: "#9363cf",
    },
    Shopping: {
      color: "#fff1f7",
      iconColor: "#d91b70",
    },
    Entertainment: {
      color: "#f0eaff",
      iconColor: "#9363cf",
    },
    Health: {
      color: "#e7f8ef",
      iconColor: "#159b69",
    },
    Bills: {
      color: "#edf1ff",
      iconColor: "#647fd3",
    },
    Other: {
      color: "#f2f2f5",
      iconColor: "#777580",
    },
    Income: {
      color: "#e7f8ef",
      iconColor: "#159b69",
    },
  };

  return styles[category] || styles.Other;
}

// --------------------------------------------------
// ALLOWANCE LEDGER
// --------------------------------------------------

function createEmptyLedger() {
  return {
    version: 1,
    creditedMonths: {},
  };
}

function getTotalAllowanceCredits(ledger, monthlyPocketMoney) {
  const credits = Object.values(
    ledger?.creditedMonths || {}
  );

  if (credits.length === 0) {
    return Number(monthlyPocketMoney) || 0;
  }

  return credits.reduce(
    (total, amount) => total + Math.max(0, Number(amount) || 0),
    0
  );
}

function ensureCurrentMonthCredit(ledger, monthlyPocketMoney) {
  const currentMonth = getMonthKey();

  const creditedMonths = {
    ...(ledger?.creditedMonths || {}),
  };

  if (
    Object.prototype.hasOwnProperty.call(
      creditedMonths,
      currentMonth
    )
  ) {
    return ledger;
  }

  creditedMonths[currentMonth] = Number(monthlyPocketMoney) || 0;

  return {
    version: 1,
    creditedMonths,
  };
}

// --------------------------------------------------
// FINANCIAL CALCULATIONS
// --------------------------------------------------

function calculateFinancials(
  transactions,
  monthlyPocketMoney,
  allowanceLedger
) {
  const now = new Date();
  const today = getLocalDateString();

  const {
    monthKey,
    daysInMonth,
    daysElapsed,
    daysRemaining,
  } = getMonthInfo(now);

  const previousMonthKey = getPreviousMonthKey(now);

  const pocketMoney = Math.max(
    0,
    Number(monthlyPocketMoney) || 0
  );

  const ledger = allowanceLedger || createEmptyLedger();

  const creditedMonths = ledger.creditedMonths || {};

  const currentMonthAllowance =
    Number(creditedMonths[monthKey] ?? pocketMoney) || 0;

  const previousMonthAllowance =
    Number(creditedMonths[previousMonthKey] ?? 0) || 0;

  // All transactions remain part of the wallet balance.
  // Monthly reports only use transactions from their own month.

  const validTransactions = transactions.filter(
    (item) => Number.isFinite(Number(item.amount))
  );

  const currentMonthTransactions = validTransactions.filter(
    (item) => String(item.dateISO || "").startsWith(monthKey)
  );

  const previousMonthTransactions = validTransactions.filter(
    (item) =>
      String(item.dateISO || "").startsWith(previousMonthKey)
  );

  function getTotals(items) {
    const income = items
      .filter((item) => Number(item.amount) > 0)
      .reduce(
        (total, item) => total + Number(item.amount),
        0
      );

    const expenses = items
      .filter((item) => Number(item.amount) < 0)
      .reduce(
        (total, item) => total + Math.abs(Number(item.amount)),
        0
      );

    return { income, expenses };
  }

  const currentTotals = getTotals(currentMonthTransactions);
  const previousTotals = getTotals(previousMonthTransactions);

  // Current month's allowance + income earned this month.
  const totalIncome =
    currentMonthAllowance + currentTotals.income;

  const totalExpenses = currentTotals.expenses;

  // Lifetime wallet calculation.
  // Every month's allowance is credited once.
  const totalAllowanceCredits = getTotalAllowanceCredits(
    ledger,
    pocketMoney
  );

  const lifetimeIncome = validTransactions
    .filter((item) => Number(item.amount) > 0)
    .reduce(
      (total, item) => total + Number(item.amount),
      0
    );

  const lifetimeExpenses = validTransactions
    .filter((item) => Number(item.amount) < 0)
    .reduce(
      (total, item) => total + Math.abs(Number(item.amount)),
      0
    );

  const currentBalance =
    totalAllowanceCredits +
    lifetimeIncome -
    lifetimeExpenses;

  const savings = totalIncome - totalExpenses;

  const remainingBudget = Math.max(
    0,
    currentMonthAllowance - totalExpenses
  );

  const todayExpenses = currentMonthTransactions
    .filter(
      (item) =>
        Number(item.amount) < 0 &&
        item.dateISO === today
    )
    .reduce(
      (total, item) => total + Math.abs(Number(item.amount)),
      0
    );

  const dailyAllowance =
    daysRemaining > 0
      ? remainingBudget / daysRemaining
      : 0;

  const remainingToday = Math.max(
    0,
    dailyAllowance - todayExpenses
  );

  const monthlyBudgetUsed =
    currentMonthAllowance > 0
      ? Math.min(
          100,
          (totalExpenses / currentMonthAllowance) * 100
        )
      : 0;

  const savingsRate =
    totalIncome > 0
      ? (savings / totalIncome) * 100
      : 0;

  const previousIncome =
    previousMonthAllowance + previousTotals.income;

  const previousExpenses = previousTotals.expenses;

  function percentageChange(current, previous) {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
  }

  const incomeChange = percentageChange(
    totalIncome,
    previousIncome
  );

  const expenseChange = percentageChange(
    totalExpenses,
    previousExpenses
  );

  const previousSavings =
    previousIncome - previousExpenses;

  const savingsChange = percentageChange(
    savings,
    previousSavings
  );

  const dailyAllowanceUsed =
    dailyAllowance > 0
      ? Math.min(
          100,
          (todayExpenses / dailyAllowance) * 100
        )
      : todayExpenses > 0
        ? 100
        : 0;

  const dailyStatus =
    dailyAllowanceUsed >= 100
      ? "Limit reached"
      : dailyAllowanceUsed >= 80
        ? "Near your limit"
        : "On track";

  const projectedMonthlySpend =
    daysElapsed > 0
      ? (totalExpenses / daysElapsed) * daysInMonth
      : 0;

  const projectedBudgetStatus =
    projectedMonthlySpend > currentMonthAllowance
      ? "You may exceed your monthly budget."
      : "You're currently on track with your monthly budget.";

  return {
    totalIncome,
    totalExpenses,
    savings,
    currentBalance,

    totalAllowanceCredits,
    lifetimeIncome,
    lifetimeExpenses,

    currentMonthAllowance,
    previousMonthAllowance,

    todayExpenses,
    remainingBudget,
    dailyAllowance,
    remainingToday,

    monthlyBudgetUsed,
    savingsRate,

    incomeChange,
    expenseChange,
    savingsChange,

    dailyAllowanceUsed,
    dailyStatus,

    projectedMonthlySpend,
    projectedBudgetStatus,

    daysInMonth,
    daysElapsed,
    daysRemaining,

    monthKey,
    monthName: getMonthName(now),

    currentMonthTransactions,
    previousMonthTransactions,
  };
}

// --------------------------------------------------
// GENERAL HELPERS
// --------------------------------------------------

const formatCurrency = (amount) =>
  `৳ ${Math.round(Number(amount) || 0).toLocaleString("en-BD")}`;

const maskedAmount = "৳ ••••••";

const modalLabelStyle = {
  display: "block",
  fontSize: 10,
  fontWeight: 800,
  color: "#777580",
  marginBottom: 8,
  marginTop: 16,
  letterSpacing: 0.5,
};

const modalInputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 14px",
  border: "1px solid #eeeeF2",
  borderRadius: 10,
  outline: "none",
  background: "#fff",
  color: "#25232a",
  fontSize: 13,
};

// --------------------------------------------------
// NAVIGATION
// --------------------------------------------------

const bottomNavigation = [
  { label: "Home", icon: LayoutDashboard, page: "Dashboard" },
  { label: "Activity", icon: ArrowLeftRight, page: "Transactions" },
  { label: "Budget", icon: Wallet, page: "Budget Planner" },
  { label: "Savings", icon: PiggyBank, page: "Savings Goals" },
  { label: "Insights", icon: ChartNoAxesCombined, page: "Analytics" },
];
// --------------------------------------------------
// BRAND
// --------------------------------------------------

function Brand() {
  return (
    <div className="brand">
      <div className="brand-icon">
        <WalletCards size={23} strokeWidth={2.5} />
      </div>

      <div className="brand-name">
        Penny<span>Wise</span>
      </div>
    </div>
  );
}

// --------------------------------------------------
// BALANCE CARD
// --------------------------------------------------

function BalanceCard({
  hidden,
  financials,
  monthlyPocketMoney,
}) {
  return (
    <motion.div
      className="balance-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="balance-caption">
        YOUR AVAILABLE BALANCE
      </div>

      <motion.div
        key={hidden ? "hidden" : "visible"}
        className="balance-amount"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
      >
        {hidden
          ? maskedAmount
          : formatCurrency(financials.currentBalance)}
      </motion.div>

      <div className="balance-caption">
        Your money, your control. Keep managing it wisely!
      </div>

      <div className="balance-footer">
        <div>
          <div className="balance-caption">
            MONTHLY POCKET MONEY
          </div>

          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              marginTop: 5,
            }}
          >
            {hidden
              ? maskedAmount
              : formatCurrency(monthlyPocketMoney)}
          </div>
        </div>

        <div className="balance-pill">
          <TrendingUp
            size={13}
            style={{ display: "inline" }}
          />
          {" "}Monthly allocation
        </div>
      </div>
    </motion.div>
  );
}

// --------------------------------------------------
// OVERVIEW CARDS
// --------------------------------------------------

function OverviewCards({ hidden, financials }) {
  const items = [
    {
      label: "Total Income",
      value: financials.totalIncome,
      icon: ArrowDownRight,
      color: "#e7f8ef",
      iconColor: "#159b69",
      change: financials.incomeChange,
      positive: financials.incomeChange >= 0,
    },
    {
      label: "Total Expenses",
      value: financials.totalExpenses,
      icon: ArrowUpRight,
      color: "#fff0f1",
      iconColor: "#e34d5b",
      change: financials.expenseChange,
      positive: financials.expenseChange <= 0,
    },
    {
      label: "Saved This Month",
      value: financials.savings,
      icon: PiggyBank,
      color: "#fff1f7",
      iconColor: "#d91b70",
      change: financials.savingsChange,
      positive: financials.savingsChange >= 0,
      detail: `${financials.savingsRate.toFixed(1)}% savings rate`,
    },
    {
      label: "Days Remaining",
      value: `${financials.daysRemaining} Days`,
      icon: CalendarDays,
      color: "#edf1ff",
      iconColor: "#647fd3",
      isText: true,
    },
  ];

  return (
    <div className="overview-grid">
      {items.map((item, index) => {
        const Icon = item.icon;

        return (
          <motion.div
            key={item.label}
            className="card overview-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <div
              className="overview-icon"
              style={{
                background: item.color,
                color: item.iconColor,
              }}
            >
              <Icon size={17} />
            </div>

            <div className="overview-label">
              {item.label}
            </div>

            <div className="overview-value">
              {hidden
                ? "••••••"
                : item.isText
                  ? item.value
                  : formatCurrency(item.value)}
            </div>

            {item.change !== undefined && (
              <div
                style={{
                  marginTop: 7,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  color: item.positive ? "#159b69" : "#e34d5b",
                }}
              >
                {hidden ? (
                  "•••• vs. last month"
                ) : (
                  <>
                    {item.positive ? (
                      <ArrowUpRight size={13} />
                    ) : (
                      <ArrowDownRight size={13} />
                    )}

                    {Math.abs(item.change).toFixed(1)}%

                    <span
                      style={{
                        color: "#92909a",
                        fontWeight: 500,
                      }}
                    >
                      vs. last month
                    </span>
                  </>
                )}
              </div>
            )}

            {item.detail && (
              <div
                style={{
                  marginTop: 5,
                  fontSize: 10,
                  color: "#92909a",
                  fontWeight: 600,
                }}
              >
                {hidden ? "••••••" : item.detail}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// --------------------------------------------------
// RECENT TRANSACTIONS
// --------------------------------------------------

function RecentTransactions({
  onViewAll,
  hidden,
  transactions,
}) {
  const recentItems = [...transactions]
    .sort(
      (a, b) =>
        getTransactionTimestamp(b) -
        getTransactionTimestamp(a)
    )
    .slice(0, 4);

  return (
    <section className="card section-card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 15,
        }}
      >
        <div>
          <h3 className="section-title">
            Recent Transactions
          </h3>

          <p className="section-subtitle">
            Your latest money movements.
          </p>
        </div>

        <button
          onClick={onViewAll}
          style={{
            border: 0,
            background: "transparent",
            color: "#d91b70",
            fontSize: 11,
            fontWeight: 800,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          View all <ChevronRight size={13} style={{ verticalAlign: "middle" }} />
        </button>
      </div>

      {recentItems.length > 0 ? (
        recentItems.map((item) => {
          const Icon = getTransactionIcon(item.category);
          const isIncome = item.amount > 0;

          return (
            <div className="transaction-row" key={item.id}>
              <div
                className="transaction-icon"
                style={{
                  background: item.color || "#f2eaff",
                  color: item.iconColor || "#9363cf",
                }}
              >
                <Icon size={18} />
              </div>

              <div className="transaction-info" style={{ minWidth: 0 }}>
                <div className="transaction-name">
                  {item.name}
                </div>

                <div className="transaction-category">
                  {item.category} · {item.date}
                </div>
              </div>

              <div
                className="transaction-amount"
                style={{
                  color: isIncome ? "#159b69" : "#25232a",
                  whiteSpace: "nowrap",
                }}
              >
                {hidden
                  ? "••••••"
                  : `${isIncome ? "+" : "-"}${formatCurrency(
                      Math.abs(item.amount)
                    )}`}
              </div>
            </div>
          );
        })
      ) : (
        <p
          style={{
            textAlign: "center",
            padding: 25,
            color: "#92909a",
            fontSize: 12,
          }}
        >
          No transactions yet.
        </p>
      )}
    </section>
  );
}

// --------------------------------------------------
// ADD / EDIT TRANSACTION MODAL
// --------------------------------------------------

function TransactionModal({ onClose, onSave, transaction }) {
  const isEditing = Boolean(transaction);

  const [type, setType] = useState(
    transaction?.amount > 0 ? "income" : "expense"
  );

  const [name, setName] = useState(transaction?.name || "");

  const [amount, setAmount] = useState(
    transaction ? String(Math.abs(transaction.amount)) : ""
  );

  const [category, setCategory] = useState(
    transaction?.category || "Food & Dining"
  );

  const [date, setDate] = useState(
    transaction?.dateISO || getLocalDateString()
  );

  const expenseCategories = [
    "Food & Dining",
    "Transportation",
    "Education",
    "Shopping",
    "Entertainment",
    "Health",
    "Bills",
    "Other",
  ];

  const categories =
    type === "income" ? ["Income"] : expenseCategories;

  function handleSubmit(event) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (
      !name.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !date
    ) {
      return;
    }

    const styles = getCategoryStyle(category);

    onSave({
      id: transaction?.id ?? Date.now(),
      name: name.trim(),
      category,
      date: getTransactionDateLabel(date),
      dateISO: date,
      amount:
        type === "income" ? numericAmount : -numericAmount,
      color: styles.color,
      iconColor: styles.iconColor,
    });
  }

  return (
    <motion.div
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(25, 20, 30, 0.48)",
        backdropFilter: "blur(5px)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <motion.div
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        style={{
          width: "100%",
          maxWidth: 440,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 20px 70px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 22,
          }}
        >
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
              {isEditing ? "Edit Transaction" : "Add Transaction"}
            </h2>

            <p style={{ fontSize: 12, color: "#92909a", marginTop: 5 }}>
              {isEditing
                ? "Update your transaction details."
                : "Record where your money goes."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 0,
              background: "#f7f7f9",
              borderRadius: 10,
              width: 36,
              height: 36,
              cursor: "pointer",
              color: "#777580",
              display: "grid",
              placeItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              background: "#f7f7f9",
              padding: 5,
              borderRadius: 12,
              marginBottom: 22,
            }}
          >
            {["expense", "income"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setType(item);
                  setCategory(
                    item === "income" ? "Income" : "Food & Dining"
                  );
                }}
                style={{
                  border: 0,
                  borderRadius: 9,
                  padding: 11,
                  background: type === item ? "#fff" : "transparent",
                  color:
                    type === item
                      ? item === "income"
                        ? "#159b69"
                        : "#d91b70"
                      : "#92909a",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow:
                    type === item
                      ? "0 2px 8px rgba(0,0,0,0.06)"
                      : "none",
                  textTransform: "capitalize",
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <label style={modalLabelStyle}>TRANSACTION NAME</label>

          <input
            required
            maxLength={60}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Lunch with friends"
            style={modalInputStyle}
          />

          <label style={modalLabelStyle}>AMOUNT (৳)</label>

          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Enter amount"
            style={modalInputStyle}
          />

          <label style={modalLabelStyle}>CATEGORY</label>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            style={modalInputStyle}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label style={modalLabelStyle}>DATE</label>

          <input
            required
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            style={modalInputStyle}
          />

          <button
            type="submit"
            className="primary-button"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: 22,
              padding: 14,
            }}
          >
            {isEditing ? (
              <>
                <Pencil size={16} />
                Update Transaction
              </>
            ) : (
              <>
                <Plus size={16} />
                Save Transaction
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// --------------------------------------------------
// TRANSACTIONS PAGE
// --------------------------------------------------

function TransactionsPage({
  setActive,
  hidden,
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    "All",
    "Income",
    "Food & Dining",
    "Transportation",
    "Education",
    "Shopping",
    "Entertainment",
    "Health",
    "Bills",
    "Other",
  ];

  const filteredTransactions = [...transactions]
    .sort(
      (a, b) =>
        getTransactionTimestamp(b) -
        getTransactionTimestamp(a)
    )
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

  return (
    <motion.div
      key="transactions"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-heading">
        <div>
          <h1 className="page-title">Transactions</h1>

          <p className="page-subtitle">
            Track and manage your money movements.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={onAddTransaction}
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      <section className="card section-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            border: "1px solid #eeeeF2",
            borderRadius: 12,
            padding: "0 13px",
            background: "#fff",
            marginBottom: 18,
          }}
        >
          <Search size={17} color="#92909a" />

          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search transactions..."
            style={{
              flex: 1,
              minWidth: 0,
              border: 0,
              outline: 0,
              padding: "13px 0",
              background: "transparent",
              fontSize: 12,
              color: "#25232a",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 5,
            marginBottom: 16,
          }}
        >
          {categories.map((category) => {
            const selected = selectedCategory === category;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  flexShrink: 0,
                  border: selected
                    ? "1px solid #d91b70"
                    : "1px solid #eeeeF2",
                  background: selected ? "#fce8f1" : "#fff",
                  color: selected ? "#d91b70" : "#777580",
                  padding: "8px 13px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <h3 className="section-title">
            All Transactions
          </h3>

          <span style={{ fontSize: 11, color: "#92909a" }}>
            {filteredTransactions.length} results
          </span>
        </div>

        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((item) => {
            const Icon = getTransactionIcon(item.category);
            const isIncome = item.amount > 0;

            return (
              <div
                className="transaction-row"
                key={item.id}
                style={{ gap: 10 }}
              >
                <div
                  className="transaction-icon"
                  style={{
                    background: item.color || "#f2eaff",
                    color: item.iconColor || "#9363cf",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </div>

                <div
                  className="transaction-info"
                  style={{ minWidth: 0, flex: 1 }}
                >
                  <div className="transaction-name">
                    {item.name}
                  </div>

                  <div className="transaction-category">
                    {item.category} · {item.date}
                  </div>

                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 5,
                      color: isIncome ? "#159b69" : "#e34d5b",
                      background: isIncome ? "#e7f8ef" : "#fff0f1",
                      borderRadius: 20,
                      padding: "3px 8px",
                      fontSize: 9,
                      fontWeight: 800,
                    }}
                  >
                    {isIncome ? "INCOME" : "EXPENSE"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <div
                    className="transaction-amount"
                    style={{
                      color: isIncome ? "#159b69" : "#25232a",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {hidden
                      ? "••••••"
                      : `${isIncome ? "+" : "-"}${formatCurrency(
                          Math.abs(item.amount)
                        )}`}
                  </div>

                  <div style={{ display: "flex", gap: 5 }}>
                    <button
                      type="button"
                      title="Edit transaction"
                      onClick={() => onEditTransaction(item)}
                      style={{
                        border: "1px solid #eeeeF2",
                        background: "#fff",
                        color: "#777580",
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      type="button"
                      title="Delete transaction"
                      onClick={() => onDeleteTransaction(item.id)}
                      style={{
                        border: "1px solid #ffe5e7",
                        background: "#fff7f7",
                        color: "#e34d5b",
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "45px 15px",
              color: "#92909a",
            }}
          >
            <Search
              size={28}
              style={{ margin: "0 auto 12px", opacity: 0.5 }}
            />

            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#25232a",
              }}
            >
              No transactions found
            </p>

            <p style={{ fontSize: 11 }}>
              Try another search term or category.
            </p>
          </div>
        )}
      </section>
    </motion.div>
  );
}

// --------------------------------------------------
// DAILY ALLOWANCE
// --------------------------------------------------

function DailyAllowance({ hidden, financials }) {
  const statusColor =
    financials.dailyStatus === "Limit reached"
      ? "#e34d5b"
      : financials.dailyStatus === "Near your limit"
        ? "#d98b25"
        : "#159b69";

  const coachingMessage =
    financials.dailyStatus === "Limit reached"
      ? "You've reached your suggested daily allowance. Consider keeping additional spending low today."
      : financials.dailyStatus === "Near your limit"
        ? "You're getting close to your daily limit. Keep an eye on additional spending."
        : "You're on track. Keep managing your spending wisely.";

  return (
    <section className="card section-card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h3 className="section-title">
            Daily Spending Allowance
          </h3>

          <p className="section-subtitle">
            Your suggested spending limit.
          </p>
        </div>

        <div
          className="overview-icon"
          style={{
            background: "#fff1f7",
            color: "#d91b70",
            marginBottom: 0,
          }}
        >
          <Wallet size={18} />
        </div>
      </div>

      <div style={{ marginTop: 26 }}>
        <div style={{ color: "#92909a", fontSize: 11 }}>
          YOU CAN SAFELY SPEND
        </div>

        <div
          style={{
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: -1.5,
            marginTop: 7,
          }}
        >
          {hidden
            ? maskedAmount
            : formatCurrency(financials.dailyAllowance)}

          <span
            style={{
              color: "#92909a",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {" "} / day
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 15,
          gap: 10,
        }}
      >
        <span style={{ color: "#92909a", fontSize: 11 }}>
          Today's allowance usage
        </span>

        <span
          style={{
            background: `${statusColor}18`,
            color: statusColor,
            padding: "5px 9px",
            borderRadius: 20,
            fontSize: 10,
            fontWeight: 800,
          }}
        >
          {financials.dailyStatus}
        </span>
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="progress-track">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{
              width: `${financials.dailyAllowanceUsed}%`,
              background: statusColor,
            }}
            transition={{ duration: 0.8 }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            fontSize: 10,
            color: "#92909a",
          }}
        >
          <span>
            {hidden
              ? "••••"
              : `${financials.dailyAllowanceUsed.toFixed(1)}% used`}
          </span>

          <span>
            {hidden
              ? "••••••"
              : `${formatCurrency(financials.dailyAllowance)} limit`}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          marginTop: 20,
        }}
      >
        <div>
          <div style={{ color: "#92909a", fontSize: 10 }}>
            SPENT TODAY
          </div>

          <strong style={{ fontSize: 13 }}>
            {hidden
              ? "••••••"
              : formatCurrency(financials.todayExpenses)}
          </strong>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#92909a", fontSize: 10 }}>
            LEFT TODAY
          </div>

          <strong style={{ fontSize: 13, color: "#159b69" }}>
            {hidden
              ? "••••••"
              : formatCurrency(financials.remainingToday)}
          </strong>
        </div>
      </div>

      <div style={{ marginTop: 25 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            marginBottom: 10,
          }}
        >
          <span style={{ color: "#92909a" }}>
            Monthly budget used
          </span>

          <strong>
            {hidden
              ? "••••"
              : `${financials.monthlyBudgetUsed.toFixed(1)}%`}
          </strong>
        </div>

        <div className="progress-track">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{
              width: `${financials.monthlyBudgetUsed}%`,
            }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginTop: 20,
          padding: "13px 0",
          borderTop: "1px solid #f0edf0",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "#92909a" }}>
            ESTIMATED MONTH-END SPENDING
          </div>

          <strong
            style={{
              fontSize: 17,
              display: "block",
              marginTop: 5,
            }}
          >
            {hidden
              ? maskedAmount
              : formatCurrency(financials.projectedMonthlySpend)}
          </strong>
        </div>

        <div
          style={{
            color:
              financials.projectedMonthlySpend >
              financials.currentMonthAllowance
                ? "#e34d5b"
                : "#159b69",
            fontSize: 10,
            fontWeight: 800,
            textAlign: "right",
          }}
        >
          {financials.projectedMonthlySpend >
          financials.currentMonthAllowance
            ? "Over budget"
            : "Within budget"}
        </div>
      </div>

      <div
        style={{
          background: "#fff5f9",
          borderRadius: 12,
          padding: 13,
          marginTop: 10,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <Sparkles
          size={17}
          color="#d91b70"
          style={{ flexShrink: 0 }}
        />

        <div>
          <p
            style={{
              margin: 0,
              color: "#87516b",
              fontSize: 11,
              lineHeight: 1.7,
            }}
          >
            {coachingMessage}
          </p>

          <p
            style={{
              margin: "7px 0 0",
              color: "#87516b",
              fontSize: 10,
              lineHeight: 1.6,
              fontWeight: 700,
            }}
          >
            {financials.projectedBudgetStatus}
          </p>
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------
// DASHBOARD
// --------------------------------------------------

function Dashboard({
  hidden,
  setHidden,
  setActive,
  financials,
  transactions,
  onAddTransaction,
  profile,
  monthlyPocketMoney,
}) {
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-heading">
        <div>
          <h1 className="page-title">
     Hey, {profile?.name || "there"}! 👋
          </h1>

          <p className="page-subtitle">
            Here's how your money is looking today.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={onAddTransaction}
        >
          <Plus size={16} />
          Add expense
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 12,
        }}
      >
        <button
          onClick={() => setHidden((previous) => !previous)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            border: "1px solid #eeeeF2",
            background: "#fff",
            color: "#777580",
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {hidden ? <Eye size={15} /> : <EyeOff size={15} />}
          {hidden ? "Show balances" : "Hide balances"}
        </button>
      </div>

      <div className="dashboard-grid">
        <BalanceCard
          hidden={hidden}
          financials={financials}
          monthlyPocketMoney={monthlyPocketMoney}
        />

        <OverviewCards
          hidden={hidden}
          financials={financials}
        />
      </div>

      <div className="content-grid">
        <RecentTransactions
          hidden={hidden}
          transactions={transactions}
          onViewAll={() => setActive("Transactions")}
        />

        <DailyAllowance
          hidden={hidden}
          financials={financials}
        />
      </div>

      <div style={{ marginTop: 22 }}>
        <section
          className="card section-card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 15,
            background: "linear-gradient(110deg, #fff, #fff4f8)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 13,
              alignItems: "center",
            }}
          >
            <div
              className="overview-icon"
              style={{
                background: "#fce8f1",
                color: "#d91b70",
                margin: 0,
              }}
            >
              <Sparkles size={20} />
            </div>

            <div>
              <h3 className="section-title">
                Meet your AI Money Coach
              </h3>

              <p className="section-subtitle">
                Smarter spending starts with better decisions.
              </p>
            </div>
          </div>

          <button
            className="primary-button"
            onClick={() => setActive("AI Assistant")}
          >
            Explore <ArrowUpRight size={15} />
          </button>
        </section>
      </div>
    </motion.div>
  );
}

// --------------------------------------------------
// POCKET MONEY SETTINGS
// --------------------------------------------------

function SettingsPage({
  profile,
  financials,
  onSavePocketMoney,
}) {
  const [amount, setAmount] = useState(
    String(profile.monthlyPocketMoney)
  );

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setAmount(String(profile.monthlyPocketMoney));
  }, [profile.monthlyPocketMoney]);

  function handleSubmit(event) {
    event.preventDefault();

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    onSavePocketMoney(value);
    setSaved(true);
  }

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-heading">
        <div>
          <h1 className="page-title">Settings</h1>

          <p className="page-subtitle">
            Manage your profile and monthly pocket money.
          </p>
        </div>
      </div>

      <div
        className="card section-card"
        style={{ maxWidth: 650 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 13,
            marginBottom: 24,
          }}
        >
          <div
            className="overview-icon"
            style={{
              background: "#fce8f1",
              color: "#d91b70",
              margin: 0,
            }}
          >
            <UserRound size={20} />
          </div>

          <div>
            <h3 className="section-title">
              Personal Profile
            </h3>

            <p className="section-subtitle">
              Your PennyWise account information.
            </p>
          </div>
        </div>

        <div
          style={{
            padding: 15,
            background: "#f8f7fa",
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 10, color: "#92909a" }}>
            YOUR NAME
          </div>

          <strong
            style={{
              display: "block",
              marginTop: 6,
              fontSize: 16,
            }}
          >
            {profile.name}
          </strong>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 13,
            marginBottom: 20,
          }}
        >
          <div
            className="overview-icon"
            style={{
              background: "#e7f8ef",
              color: "#159b69",
              margin: 0,
            }}
          >
            <WalletCards size={20} />
          </div>

          <div>
            <h3 className="section-title">
              Monthly Pocket Money
            </h3>

            <p className="section-subtitle">
              Set your monthly allowance.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={modalLabelStyle}>
            MONTHLY POCKET MONEY (BDT)
          </label>

          <input
            type="number"
            min="1"
            step="1"
            required
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setSaved(false);
            }}
            style={modalInputStyle}
          />

          <p
            style={{
              fontSize: 11,
              color: "#92909a",
              lineHeight: 1.7,
              marginTop: 10,
            }}
          >
            Changing this amount updates this month's allowance
            allocation. Your previous months' credits and your
            transaction history remain unchanged.
          </p>

          <button
            type="submit"
            className="primary-button"
            style={{
              marginTop: 18,
              justifyContent: "center",
              width: "100%",
              padding: 13,
            }}
          >
            <Save size={16} />
            Save Pocket Money
          </button>

          {saved && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                background: "#e7f8ef",
                color: "#159b69",
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle2 size={16} />
              Pocket money updated successfully.
            </div>
          )}
        </form>

        <div
          style={{
            marginTop: 30,
            borderTop: "1px solid #f0edf0",
            paddingTop: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 17,
            }}
          >
            <CalendarClock size={19} color="#d91b70" />

            <h3 className="section-title">
              Monthly Allowance Overview
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div
              style={{
                background: "#f8f7fa",
                padding: 15,
                borderRadius: 12,
              }}
            >
              <div style={{ fontSize: 10, color: "#92909a" }}>
                CURRENT MONTH ALLOCATION
              </div>

              <strong
                style={{
                  display: "block",
                  fontSize: 17,
                  marginTop: 7,
                }}
              >
                {formatCurrency(
                  financials.currentMonthAllowance
                )}
              </strong>
            </div>

            <div
              style={{
                background: "#f8f7fa",
                padding: 15,
                borderRadius: 12,
              }}
            >
              <div style={{ fontSize: 10, color: "#92909a" }}>
                AVAILABLE WALLET BALANCE
              </div>

              <strong
                style={{
                  display: "block",
                  fontSize: 17,
                  marginTop: 7,
                  color: "#159b69",
                }}
              >
                {formatCurrency(financials.currentBalance)}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --------------------------------------------------
// COMING SOON
// --------------------------------------------------

function ComingSoon({ title }) {
  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
      style={{
        padding: 35,
        minHeight: 300,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
      }}
    >
      <div>
        <div
          className="brand-icon"
          style={{
            margin: "0 auto 20px",
            width: 55,
            height: 55,
          }}
        >
          <Sparkles size={25} />
        </div>

        <h2 style={{ fontSize: 22 }}>{title}</h2>

        <p
          style={{
            color: "#92909a",
            fontSize: 13,
            maxWidth: 340,
            lineHeight: 1.8,
          }}
        >
          We're building this part of PennyWise.
          It'll be available in an upcoming development phase.
        </p>
      </div>
    </motion.div>
  );
}

// --------------------------------------------------
// MOBILE BOTTOM NAVIGATION
// --------------------------------------------------

function BottomNav({ active, setActive }) {
  return (
    <nav className="bottom-nav">
      {bottomNavigation.map((item) => {
        const Icon = item.icon;
        const selected = active === item.page;

        return (
          <button
            key={item.label}
            className={selected ? "active" : ""}
            onClick={() => setActive(item.page)}
          >
            <Icon
              size={20}
              strokeWidth={selected ? 2.5 : 2}
            />

            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// --------------------------------------------------
// MAIN APP SHELL
// --------------------------------------------------

export default function AppShell() {
  const [active, setActive] = useState("Dashboard");
  const [hidden, setHidden] = useState(false);

  // PROFILE
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // TRANSACTIONS
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);

  // MONTHLY ALLOWANCE LEDGER
  const [allowanceLedger, setAllowanceLedger] = useState(null);
  const [ledgerLoaded, setLedgerLoaded] = useState(false);

  // MODAL
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // --------------------------------------------------
  // LOAD PROFILE
  // --------------------------------------------------

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(
        PROFILE_STORAGE_KEY
      );

      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);

        if (
          parsedProfile &&
          typeof parsedProfile.name === "string" &&
          Number(parsedProfile.monthlyPocketMoney) > 0
        ) {
          setProfile({
            name: parsedProfile.name,
            monthlyPocketMoney: Number(
              parsedProfile.monthlyPocketMoney
            ),
          });
        }
      }
    } catch (error) {
      console.error("Unable to load profile:", error);
    }

    setProfileLoaded(true);
  }, []);

  // --------------------------------------------------
  // LOAD TRANSACTIONS
  // --------------------------------------------------

  useEffect(() => {
    try {
      const savedTransactions = localStorage.getItem(STORAGE_KEY);

      if (savedTransactions) {
        const parsedTransactions = JSON.parse(savedTransactions);

        if (Array.isArray(parsedTransactions)) {
          setTransactions(parsedTransactions);
        }
      }
    } catch (error) {
      console.error("Unable to load transactions:", error);
    }

    setTransactionsLoaded(true);
  }, []);

  // --------------------------------------------------
  // LOAD ALLOWANCE LEDGER
  // --------------------------------------------------

  useEffect(() => {
    try {
      const savedLedger = localStorage.getItem(
        ALLOWANCE_STORAGE_KEY
      );

      if (savedLedger) {
        const parsedLedger = JSON.parse(savedLedger);

        if (
          parsedLedger &&
          typeof parsedLedger.creditedMonths === "object" &&
          parsedLedger.creditedMonths !== null
        ) {
          setAllowanceLedger(parsedLedger);
        } else {
          setAllowanceLedger(createEmptyLedger());
        }
      } else {
        setAllowanceLedger(createEmptyLedger());
      }
    } catch (error) {
      console.error("Unable to load allowance ledger:", error);
      setAllowanceLedger(createEmptyLedger());
    }

    setLedgerLoaded(true);
  }, []);

  // --------------------------------------------------
  // AUTOMATIC MONTHLY ALLOWANCE CREDIT
  // --------------------------------------------------

  useEffect(() => {
    if (!profile || !ledgerLoaded || !allowanceLedger) {
      return;
    }

    const updatedLedger = ensureCurrentMonthCredit(
      allowanceLedger,
      profile.monthlyPocketMoney
    );

    if (updatedLedger !== allowanceLedger) {
      setAllowanceLedger(updatedLedger);
    }
  }, [
    profile,
    ledgerLoaded,
    allowanceLedger,
  ]);

  // --------------------------------------------------
  // SAVE TRANSACTIONS
  // --------------------------------------------------

  useEffect(() => {
    if (!transactionsLoaded) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(transactions)
      );
    } catch (error) {
      console.error("Unable to save transactions:", error);
    }
  }, [transactions, transactionsLoaded]);

  // --------------------------------------------------
  // SAVE ALLOWANCE LEDGER
  // --------------------------------------------------

  useEffect(() => {
    if (!ledgerLoaded || !allowanceLedger) return;

    try {
      localStorage.setItem(
        ALLOWANCE_STORAGE_KEY,
        JSON.stringify(allowanceLedger)
      );
    } catch (error) {
      console.error("Unable to save allowance ledger:", error);
    }
  }, [allowanceLedger, ledgerLoaded]);

  // --------------------------------------------------
  // ONBOARDING
  // --------------------------------------------------

  function handleOnboardingComplete(formData) {
    const newProfile = {
      name: String(formData.name || "").trim(),
      monthlyPocketMoney: Number(
        formData.monthlyPocketMoney
      ),
    };

    if (
      !newProfile.name ||
      !Number.isFinite(newProfile.monthlyPocketMoney) ||
      newProfile.monthlyPocketMoney <= 0
    ) {
      return;
    }

    try {
      localStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify(newProfile)
      );

      setProfile(newProfile);

      setAllowanceLedger((previous) =>
        ensureCurrentMonthCredit(
          previous || createEmptyLedger(),
          newProfile.monthlyPocketMoney
        )
      );

      setActive("Dashboard");
    } catch (error) {
      console.error("Unable to save profile:", error);

      window.alert(
        "Your profile could not be saved. Please try again."
      );
    }
  }

  // --------------------------------------------------
  // EDIT MONTHLY POCKET MONEY
  // --------------------------------------------------

  function handleSavePocketMoney(newAmount) {
    if (
      !Number.isFinite(newAmount) ||
      newAmount <= 0 ||
      !profile
    ) {
      return;
    }

    const updatedProfile = {
      ...profile,
      monthlyPocketMoney: newAmount,
    };

    try {
      localStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify(updatedProfile)
      );

      setProfile(updatedProfile);

      const currentMonth = getMonthKey();

      setAllowanceLedger((previous) => {
        const currentLedger =
          previous || createEmptyLedger();

        return {
          version: 1,
          creditedMonths: {
            ...(currentLedger.creditedMonths || {}),
            [currentMonth]: newAmount,
          },
        };
      });
    } catch (error) {
      console.error("Unable to update pocket money:", error);

      window.alert(
        "Unable to save your new pocket money amount."
      );
    }
  }

  // --------------------------------------------------
  // ADD TRANSACTION
  // --------------------------------------------------

  function handleAddTransaction(newTransaction) {
    setTransactions((previous) => [
      newTransaction,
      ...previous,
    ]);

    setShowTransactionModal(false);
    setEditingTransaction(null);
  }

  // --------------------------------------------------
  // EDIT TRANSACTION
  // --------------------------------------------------

  function handleEditTransaction(updatedTransaction) {
    setTransactions((previous) =>
      previous.map((item) =>
        item.id === updatedTransaction.id
          ? updatedTransaction
          : item
      )
    );

    setShowTransactionModal(false);
    setEditingTransaction(null);
  }

  function openEditModal(transaction) {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  }

  // --------------------------------------------------
  // DELETE TRANSACTION
  // --------------------------------------------------

  function handleDeleteTransaction(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction? This action cannot be undone."
    );

    if (!confirmed) return;

    setTransactions((previous) =>
      previous.filter((item) => item.id !== id)
    );
  }

  // --------------------------------------------------
  // TRANSACTION MODAL
  // --------------------------------------------------

  function openAddModal() {
    setEditingTransaction(null);
    setShowTransactionModal(true);
  }

  function closeTransactionModal() {
    setShowTransactionModal(false);
    setEditingTransaction(null);
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (!profileLoaded) {
    return null;
  }

  // --------------------------------------------------
  // ONBOARDING
  // --------------------------------------------------

  if (!profile) {
    return (
      <OnboardingForm
        onSubmit={handleOnboardingComplete}
      />
    );
  }

  // Wait for financial data to load before showing the balance.
  if (!transactionsLoaded || !ledgerLoaded || !allowanceLedger) {
    return null;
  }

  // --------------------------------------------------
  // FINANCIAL DATA
  // --------------------------------------------------

  const monthlyPocketMoney = profile.monthlyPocketMoney;

  const financials = calculateFinancials(
    transactions,
    monthlyPocketMoney,
    allowanceLedger
  );

  // --------------------------------------------------
  // MAIN APP
  // --------------------------------------------------

  return (
    <div className="app-shell">
      <div className="main-area">

     
{/* MOBILE HEADER */}
<div className="mobile-header">
  <Brand />

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}
  >
    {/* AI ASSISTANT */}
    <button
      type="button"
      onClick={() => setActive("AI Assistant")}
      aria-label="Open AI Assistant"
      title="AI Money Coach"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "9px 12px",
        border:
          active === "AI Assistant"
            ? "1px solid #d91b70"
            : "1px solid #f5c6dc",
        borderRadius: 12,
        background:
          active === "AI Assistant"
            ? "#fce8f1"
            : "#fff5f9",
        color: "#d91b70",
        fontSize: 11,
        fontWeight: 800,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      <Sparkles size={16} strokeWidth={2.3} />
      AI
    </button>

   {/* LIVE NOTIFICATIONS */}
<NotificationCenter
  transactions={transactions}
  financials={financials}
  setActive={setActive}
/>

    {/* PROFILE */}
    <button
      type="button"
      className={`avatar ${
        active === "Settings" ? "active" : ""
      }`}
      aria-label="Open profile and settings"
      title="Profile & Settings"
      onClick={() => setActive("Settings")}
      style={{
        border: "none",
        cursor: "pointer",
        font: "inherit",
      }}
    >
      {profile.name.charAt(0).toUpperCase()}
    </button>
  </div>
  
</div>


        {/* DESKTOP TOP NAVIGATION */}

 

<Topbar
  active={active}
  setActive={setActive}
/>

<main className="main-content">
  <AnimatePresence mode="wait">
   {active === "Dashboard" ? (
  <>
   

    <Dashboard
      key="dashboard"
      hidden={hidden}
      setHidden={setHidden}
      setActive={setActive}
      financials={financials}
      transactions={transactions}
    profile={profile}
    />
  </>
    ) : active === "Transactions" ? (
      <TransactionsPage
        key="transactions"
        setActive={setActive}
        hidden={hidden}
        transactions={transactions}
        onAddTransaction={openAddModal}
        onEditTransaction={openEditModal}
        onDeleteTransaction={handleDeleteTransaction}
      />
    ) : active === "Budget Planner" ? (
      <BudgetPlanner
        key="budget-planner"
        transactions={transactions}
        profile={profile}
      />
    ) : active === "Savings Goals" ? (
      <SavingsGoals
        key="savings-goals"
      />
      ) : active === "Analytics" ? (
  <Analytics
    key="analytics"
    transactions={transactions}
    financials={financials}
    monthlyPocketMoney={monthlyPocketMoney}
  />
  ) : active === "AI Assistant" ? (
  <Assistant
    key="ai-assistant"
    transactions={transactions}
    financials={financials}
    monthlyPocketMoney={monthlyPocketMoney}
  />
    ) : active === "Settings" ? (
      <SettingsPage
        key="settings"
        profile={profile}
        financials={financials}
        onSavePocketMoney={handleSavePocketMoney}
      />
    ) : (
      <ComingSoon
        key={active}
        title={active}
      />
    )}
  </AnimatePresence>
</main>
</div>


      {/* MOBILE BOTTOM NAVIGATION */}

      <BottomNav
        active={active}
        setActive={setActive}
      />

      {/* ADD / EDIT TRANSACTION MODAL */}

      <AnimatePresence>
        {showTransactionModal && (
          <TransactionModal
            key={editingTransaction?.id ?? "new-transaction"}
            transaction={editingTransaction}
            onClose={closeTransactionModal}
            onSave={
              editingTransaction
                ? handleEditTransaction
                : handleAddTransaction
            }
          />
        )}
      </AnimatePresence>
      <WelcomeModal profile={profile} />
      
    </div>
  );
}
