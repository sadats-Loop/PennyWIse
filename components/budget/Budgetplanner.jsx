
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  WalletCards,
  Plus,
  Pencil,
  Trash2,
  Utensils,
  Bus,
  BookOpen,
  ShoppingBag,
  Gamepad2,
  HeartPulse,
  Home,
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Target,
  X,
  Check,
  AlertTriangle,
  LockKeyhole,
  CalendarCheck,
} from "lucide-react";

import "./Budgetplanner.css";

const STORAGE_KEY = "pennywise_category_budgets";
const COMPLETED_KEY = "pennywise_completed_budget_months";

const DEFAULT_CATEGORIES = [
  { id: "food", name: "Food & Dining", icon: Utensils, color: "#F59E0B", percentage: 25 },
  { id: "transport", name: "Transportation", icon: Bus, color: "#3B82F6", percentage: 15 },
  { id: "education", name: "Education", icon: BookOpen, color: "#8B5CF6", percentage: 20 },
  { id: "shopping", name: "Shopping", icon: ShoppingBag, color: "#EC4899", percentage: 15 },
  { id: "entertainment", name: "Entertainment", icon: Gamepad2, color: "#14B8A6", percentage: 10 },
  { id: "health", name: "Health", icon: HeartPulse, color: "#EF4444", percentage: 5 },
  { id: "bills", name: "Bills & Utilities", icon: Home, color: "#64748B", percentage: 5 },
  { id: "other", name: "Others", icon: MoreHorizontal, color: "#A855F7", percentage: 5 },
];

const formatCurrency = (amount) =>
  `৳${Number(amount || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  })}`;

const getMonthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getMonthLabel = (date) =>
  date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

function getNextMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function getTransactionMonth(transaction) {
  if (transaction.dateISO) {
    return transaction.dateISO.slice(0, 7);
  }

  if (transaction.date) {
    const parsed = new Date(transaction.date);

    if (!Number.isNaN(parsed.getTime())) {
      return getMonthKey(parsed);
    }
  }

  return null;
}

function isExpense(transaction) {
  const amount = Number(transaction.amount || 0);
  const type = String(transaction.type || "").toLowerCase();

  if (type === "income") return false;
  if (type === "expense") return true;

  return amount < 0;
}

function getCategoryId(transaction) {
  const category = String(
    transaction.category || "other"
  ).toLowerCase().trim();

  const aliases = {
    food: "food",
    dining: "food",
    restaurant: "food",
    groceries: "food",
    "food & dining": "food",
    transport: "transport",
    transportation: "transport",
    travel: "transport",
    education: "education",
    study: "education",
    books: "education",
    shopping: "shopping",
    clothes: "shopping",
    entertainment: "entertainment",
    games: "entertainment",
    health: "health",
    medical: "health",
    bills: "bills",
    utilities: "bills",
    rent: "bills",
    other: "other",
    others: "other",
  };

  return aliases[category] || "other";
}

function createDefaultBudgets(monthlyPocketMoney) {
  return DEFAULT_CATEGORIES.reduce((result, category) => {
    result[category.id] = Math.round(
      (monthlyPocketMoney * category.percentage) / 100
    );

    return result;
  }, {});
}

function BudgetModal({
  category,
  existingBudget,
  onClose,
  onSave,
}) {
  const [name, setName] = useState(category?.name || "");
  const [amount, setAmount] = useState(existingBudget ?? "");

  const handleSubmit = (event) => {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (
      !name.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return;
    }

    onSave({
      id: category?.id || `custom-${Date.now()}`,
      name: name.trim(),
      amount: numericAmount,
      color: category?.color || "#D91B70",
      icon: category?.icon || MoreHorizontal,
      percentage: 0,
    });
  };

  return (
    <div
      className="budget-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form className="budget-modal" onSubmit={handleSubmit}>
        <div className="budget-modal-header">
          <div>
            <h3>{category ? "Edit Budget" : "Create Budget"}</h3>
            <p>Set a spending limit for this category.</p>
          </div>

          <button
            type="button"
            className="budget-close-button"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>

        <label className="budget-field">
          <span>Category name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Food & Dining"
            required
          />
        </label>

        <label className="budget-field">
          <span>Monthly spending limit</span>
          <div className="budget-input-wrapper">
            <span>৳</span>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Enter amount"
              required
            />
          </div>
        </label>

        <div className="budget-modal-actions">
          <button
            type="button"
            className="budget-secondary-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button type="submit" className="budget-primary-button">
            <Check size={17} />
            Save Budget
          </button>
        </div>
      </form>
    </div>
  );
}

function MonthlyLockModal({ onClose }) {
  return (
    <div
      className="budget-lock-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="budget-lock-modal">
        <button
          className="budget-lock-close"
          onClick={onClose}
          aria-label="Close reminder"
        >
          <X size={20} />
        </button>

        <div className="budget-lock-icon">
          <LockKeyhole size={30} />
        </div>

        <span className="budget-lock-label">
          MONTHLY ACCESS RESTRICTED
        </span>

        <h2>
          এক মাসের হিসাব আরেক মাসে ফেলে রাখলে SADAT রাগ করে! 💀
        </h2>

        <p>
          Finish your current budget before unlocking the next one.
          Please don't test Sadat's patience.
        </p>

        <div className="budget-lock-note">
          <AlertTriangle size={17} />
          <span>
            Complete your current month's budget first.
          </span>
        </div>

        <button
          className="budget-lock-button"
          onClick={onClose}
        >
          Okay, I'll finish this month
        </button>
      </div>
    </div>
  );
}

function FinishMonthModal({ monthLabel, onCancel, onConfirm }) {
  return (
    <div
      className="budget-lock-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="budget-finish-modal">
        <button
          className="budget-lock-close"
          onClick={onCancel}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="budget-finish-icon">
          <CalendarCheck size={30} />
        </div>

        <h2>Finish {monthLabel}?</h2>

        <p>
          Your current monthly budget will be marked as completed.
          You can then unlock the next month.
        </p>

        <div className="budget-modal-actions">
          <button
            className="budget-secondary-button"
            onClick={onCancel}
          >
            Not yet
          </button>

          <button
            className="budget-primary-button"
            onClick={onConfirm}
          >
            <Check size={17} />
            Finish This Month
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Budgetplanner({
  transactions = [],
  profile,
}) {
  const monthlyPocketMoney = Math.max(
    0,
    Number(profile?.monthlyPocketMoney || 0)
  );

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [budgets, setBudgets] = useState({});
  const [completedMonths, setCompletedMonths] = useState([]);
  const [storageLoaded, setStorageLoaded] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showLockReminder, setShowLockReminder] = useState(false);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);

  const monthKey = getMonthKey(selectedMonth);
  const nextMonthKey = getMonthKey(getNextMonth(selectedMonth));
  const monthCompleted = completedMonths.includes(monthKey);

  // Load saved budgets and completed-month records.
  useEffect(() => {
    try {
      const storedBudgets = localStorage.getItem(STORAGE_KEY);
      const storedCompleted = localStorage.getItem(COMPLETED_KEY);

      if (storedBudgets) {
        setBudgets(JSON.parse(storedBudgets));
      }

      if (storedCompleted) {
        setCompletedMonths(JSON.parse(storedCompleted));
      }
    } catch (error) {
      console.error("Could not load budget data:", error);
    }

    setStorageLoaded(true);
  }, []);

  // Save budgets.
  useEffect(() => {
    if (!storageLoaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
    } catch (error) {
      console.error("Could not save budgets:", error);
    }
  }, [budgets, storageLoaded]);

  // Save completed months.
  useEffect(() => {
    if (!storageLoaded) return;

    try {
      localStorage.setItem(
        COMPLETED_KEY,
        JSON.stringify(completedMonths)
      );
    } catch (error) {
      console.error("Could not save completed months:", error);
    }
  }, [completedMonths, storageLoaded]);

  // Create the month's default category budgets only once.
  useEffect(() => {
    if (!storageLoaded) return;

    setBudgets((previous) => {
      if (previous[monthKey]) return previous;

      return {
        ...previous,
        [monthKey]: createDefaultBudgets(monthlyPocketMoney),
      };
    });
  }, [monthKey, monthlyPocketMoney, storageLoaded]);

  const currentBudgets = budgets[monthKey] || {};

  const categories = useMemo(() => {
    return Object.entries(currentBudgets).map(([id, amount]) => {
      const defaultCategory = DEFAULT_CATEGORIES.find(
        (item) => item.id === id
      );

      return {
        id,
        name: defaultCategory?.name || id,
        color: defaultCategory?.color || "#D91B70",
        icon: defaultCategory?.icon || MoreHorizontal,
        amount: Number(amount || 0),
      };
    });
  }, [currentBudgets]);

  const categorySpending = useMemo(() => {
    const result = {};

    transactions.forEach((transaction) => {
      if (!isExpense(transaction)) return;
      if (getTransactionMonth(transaction) !== monthKey) return;

      const categoryId = getCategoryId(transaction);

      result[categoryId] =
        (result[categoryId] || 0) +
        Math.abs(Number(transaction.amount || 0));
    });

    return result;
  }, [transactions, monthKey]);

  const totalBudget = categories.reduce(
    (sum, category) => sum + category.amount,
    0
  );

  const totalSpent = Object.values(categorySpending).reduce(
    (sum, amount) => sum + amount,
    0
  );

  const totalRemaining = totalBudget - totalSpent;

  const spentPercentage =
    totalBudget > 0
      ? Math.min((totalSpent / totalBudget) * 100, 100)
      : 0;

  const isOverBudget = totalSpent > totalBudget;

  // Next month remains locked until the current month is completed.
  const changeToNextMonth = () => {
    if (!monthCompleted) {
      setShowLockReminder(true);
      return;
    }

    setSelectedMonth(getNextMonth(selectedMonth));
  };

  // Complete the current month.
  const finishCurrentMonth = () => {
    if (monthCompleted) return;

    setCompletedMonths((previous) => {
      if (previous.includes(monthKey)) return previous;
      return [...previous, monthKey];
    });

    setShowFinishConfirmation(false);
  };

  const saveCategoryBudget = (item) => {
    setBudgets((previous) => ({
      ...previous,
      [monthKey]: {
        ...(previous[monthKey] || {}),
        [item.id]: item.amount,
      },
    }));

    setModalOpen(false);
    setEditingCategory(null);
  };

  const deleteCategory = (id) => {
    const confirmed = window.confirm(
      "Delete this category budget?"
    );

    if (!confirmed) return;

    setBudgets((previous) => {
      const updatedMonth = { ...(previous[monthKey] || {}) };
      delete updatedMonth[id];

      return {
        ...previous,
        [monthKey]: updatedMonth,
      };
    });
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  if (!storageLoaded) {
    return (
      <div className="budget-loading">
        Loading your budget planner...
      </div>
    );
  }

  return (
    <div className="budget-planner">
      {/* Page header */}
      <div className="budget-page-header">
        <div>
          <div className="budget-eyebrow">
            <Target size={15} />
            FINANCIAL CONTROL
          </div>

          <h1>Budget Planner</h1>

          <p>
            Plan your spending, control expenses, and stay
            on track with your monthly budget.
          </p>
        </div>

        <button
          className="budget-primary-button"
          onClick={openAddModal}
          disabled={monthCompleted}
        >
          <Plus size={18} />
          Create Budget
        </button>
      </div>

      {/* Month selector */}
      <div className="budget-month-selector budget-month-locked">
        <div className="budget-month-status">
          <span
            className={`budget-month-dot ${
              monthCompleted ? "completed" : ""
            }`}
          />
          <span>
            {monthCompleted ? "MONTH COMPLETED" : "ACTIVE MONTH"}
          </span>
        </div>

        <div className="budget-month-title">
          <span>MONTHLY OVERVIEW</span>
          <strong>{getMonthLabel(selectedMonth)}</strong>
        </div>

        <button
          className="budget-next-month-button"
          onClick={changeToNextMonth}
          aria-label="Next month"
          title={
            monthCompleted
              ? "Open next month"
              : "Complete this month first"
          }
        >
          {monthCompleted ? (
            <ChevronRight size={20} />
          ) : (
            <LockKeyhole size={18} />
          )}
        </button>
      </div>

      {monthCompleted && (
        <div className="budget-completed-banner">
          <Check size={18} />
          <span>
            {getMonthLabel(selectedMonth)} is completed. You can now
            unlock the next month.
          </span>
        </div>
      )}

      {/* Summary */}
      <div className="budget-summary-grid">
        <div className="budget-summary-card budget-total-card">
          <div className="budget-summary-icon">
            <WalletCards size={20} />
          </div>

          <span>Total Budget</span>
          <h2>{formatCurrency(totalBudget)}</h2>

          <small>{categories.length} active categories</small>
        </div>

        <div className="budget-summary-card">
          <div className="budget-summary-icon spent-icon">
            <TrendingDown size={20} />
          </div>

          <span>Total Spent</span>
          <h2>{formatCurrency(totalSpent)}</h2>

          <small>Expenses this month</small>
        </div>

        <div className="budget-summary-card">
          <div className="budget-summary-icon remaining-icon">
            <TrendingUp size={20} />
          </div>

          <span>Remaining Budget</span>

          <h2 className={totalRemaining < 0 ? "negative-value" : ""}>
            {formatCurrency(Math.abs(totalRemaining))}
            {totalRemaining < 0 ? " over" : ""}
          </h2>

          <small>
            {totalRemaining < 0
              ? "You exceeded your budget"
              : "Available to spend"}
          </small>
        </div>
      </div>

      {/* Overall progress */}
      <section className="budget-overview-card">
        <div className="budget-section-heading">
          <div>
            <h2>Overall Budget Progress</h2>
            <p>Track your monthly spending performance.</p>
          </div>

          <div className="budget-progress-percentage">
            {Math.round(
              totalBudget > 0
                ? (totalSpent / totalBudget) * 100
                : 0
            )}%
          </div>
        </div>

        <div className="budget-progress-track">
          <div
            className={`budget-progress-fill ${
              isOverBudget ? "over-budget" : ""
            }`}
            style={{ width: `${spentPercentage}%` }}
          />
        </div>

        <div className="budget-progress-labels">
          <span>Spent: {formatCurrency(totalSpent)}</span>
          <span>Budget: {formatCurrency(totalBudget)}</span>
        </div>

        {isOverBudget && (
          <div className="budget-warning">
            <AlertTriangle size={17} />
            Your total spending has exceeded your planned budget.
          </div>
        )}
      </section>

      {/* Category list */}
      <section className="budget-category-section">
        <div className="budget-section-heading">
          <div>
            <h2>Category Budgets</h2>
            <p>Manage spending limits for individual categories.</p>
          </div>

          <span className="budget-category-count">
            {categories.length} categories
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="budget-empty-state">
            <div>
              <WalletCards size={28} />
            </div>

            <h3>No budgets yet</h3>

            <p>
              Create your first category budget to start
              tracking your expenses.
            </p>

            <button
              className="budget-primary-button"
              onClick={openAddModal}
              disabled={monthCompleted}
            >
              <Plus size={17} />
              Create Your First Budget
            </button>
          </div>
        ) : (
          <div className="budget-category-grid">
            {categories.map((category) => {
              const Icon = category.icon;
              const spent = categorySpending[category.id] || 0;
              const remaining = category.amount - spent;

              const percentage =
                category.amount > 0
                  ? (spent / category.amount) * 100
                  : 0;

              const exceeded = spent > category.amount;

              return (
                <article
                  className="budget-category-card"
                  key={category.id}
                >
                  <div className="budget-category-top">
                    <div
                      className="budget-category-icon"
                      style={{
                        color: category.color,
                        background: `${category.color}15`,
                      }}
                    >
                      <Icon size={21} />
                    </div>

                    <div className="budget-category-actions">
                      <button
                        aria-label={`Edit ${category.name}`}
                        onClick={() => openEditModal(category)}
                        disabled={monthCompleted}
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        aria-label={`Delete ${category.name}`}
                        onClick={() => deleteCategory(category.id)}
                        disabled={monthCompleted}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h3>{category.name}</h3>

                  <div className="budget-category-amounts">
                    <strong>{formatCurrency(spent)}</strong>
                    <span>of {formatCurrency(category.amount)}</span>
                  </div>

                  <div className="budget-category-progress">
                    <div
                      className={exceeded ? "exceeded" : ""}
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        background: exceeded
                          ? "#EF4444"
                          : category.color,
                      }}
                    />
                  </div>

                  <div className="budget-category-footer">
                    <span className={exceeded ? "negative-value" : ""}>
                      {exceeded
                        ? `${formatCurrency(remaining * -1)} over budget`
                        : `${formatCurrency(remaining)} left`}
                    </span>

                    <span>{Math.round(percentage)}%</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Pocket money comparison */}
      <section className="budget-pocket-card">
        <div className="budget-pocket-icon">
          <WalletCards size={22} />
        </div>

        <div className="budget-pocket-content">
          <h3>Monthly Pocket Money</h3>
          <p>Your current monthly allowance from PennyWise.</p>
        </div>

        <strong>{formatCurrency(monthlyPocketMoney)}</strong>
      </section>

      {/* Finish month action */}
      {!monthCompleted && (
        <section className="budget-finish-section">
          <div>
            <h3>Finished with this month's budget?</h3>
            <p>
              Complete this month to unlock your next monthly budget.
            </p>
          </div>

          <button
            className="budget-finish-button"
            onClick={() => setShowFinishConfirmation(true)}
          >
            <CalendarCheck size={18} />
            Finish This Month
          </button>
        </section>
      )}

      {modalOpen && (
        <BudgetModal
          category={editingCategory}
          existingBudget={editingCategory?.amount}
          onClose={() => {
            setModalOpen(false);
            setEditingCategory(null);
          }}
          onSave={saveCategoryBudget}
        />
      )}

      {showLockReminder && (
        <MonthlyLockModal
          onClose={() => setShowLockReminder(false)}
        />
      )}

      {showFinishConfirmation && (
        <FinishMonthModal
          monthLabel={getMonthLabel(selectedMonth)}
          onCancel={() => setShowFinishConfirmation(false)}
          onConfirm={finishCurrentMonth}
        />
      )}
    </div>
  );
}
