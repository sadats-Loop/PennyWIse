
"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CalendarDays,
  PieChart,
  BarChart3,
  Target,
  Receipt,
  Sparkles,
} from "lucide-react";

import "./Analytics.css";

const money = (value) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const compactMoney = (value) => {
  const amount = Number(value) || 0;

  if (amount >= 100000) {
    return `৳${(amount / 100000).toFixed(1)}L`;
  }

  if (amount >= 1000) {
    return `৳${(amount / 1000).toFixed(1)}k`;
  }

  return `৳${amount.toFixed(0)}`;
};

const getTransactionDate = (transaction) => {
  const rawDate =
    transaction.date ||
    transaction.createdAt ||
    transaction.transactionDate ||
    transaction.timestamp;

  if (!rawDate) return null;

  const parsed = new Date(rawDate);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getTransactionAmount = (transaction) => {
  const amount = Math.abs(Number(transaction.amount) || 0);

  const type = String(transaction.type || "").toLowerCase();

  const isExpense =
    type.includes("expense") ||
    type.includes("spend") ||
    type.includes("debit");

  const isIncome =
    type.includes("income") ||
    type.includes("earning") ||
    type.includes("credit");

  if (isExpense) return -amount;
  if (isIncome) return amount;

  // PennyWise convention: positive = income, negative = expense.
  return Number(transaction.amount) || 0;
};

const getCategory = (transaction) =>
  transaction.category ||
  transaction.categoryName ||
  transaction.title ||
  "Other";

const getDescription = (transaction) =>
  transaction.description ||
  transaction.title ||
  transaction.name ||
  getCategory(transaction);

const monthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const monthLabel = (date, short = true) =>
  date.toLocaleDateString("en-US", {
    month: short ? "short" : "long",
  });

const getPeriodStart = (period, now) => {
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  if (period === "sixMonths") {
    start.setMonth(start.getMonth() - 5);
  }

  if (period === "year") {
    start.setMonth(0);
  }

  start.setHours(0, 0, 0, 0);

  return start;
};

const categoryColors = [
  "#D91B70",
  "#8B5CF6",
  "#F59E0B",
  "#16A36A",
  "#3B82F6",
  "#EC6B45",
  "#14B8A6",
  "#A855F7",
];

export default function Analytics({
  transactions = [],
  financials = {},
  monthlyPocketMoney = 0,
}) {
  const [period, setPeriod] = useState("thisMonth");

  const now = new Date();

  const normalizedTransactions = useMemo(() => {
    return (Array.isArray(transactions) ? transactions : [])
      .map((transaction) => {
        const amount = getTransactionAmount(transaction);

        return {
          ...transaction,
          analyticsAmount: amount,
          analyticsDate: getTransactionDate(transaction),
          analyticsCategory: getCategory(transaction),
          analyticsDescription: getDescription(transaction),
        };
      })
      .filter(
        (transaction) =>
          transaction.analyticsDate &&
          Number.isFinite(transaction.analyticsAmount)
      );
  }, [transactions]);

  const periodData = useMemo(() => {
    const start = getPeriodStart(period, now);

    const filtered = normalizedTransactions.filter(
      (transaction) =>
        transaction.analyticsDate >= start &&
        transaction.analyticsDate <= now
    );

    const incomeTransactions = filtered.filter(
      (transaction) => transaction.analyticsAmount > 0
    );

    const expenseTransactions = filtered.filter(
      (transaction) => transaction.analyticsAmount < 0
    );

    const transactionIncome = incomeTransactions.reduce(
      (sum, transaction) => sum + transaction.analyticsAmount,
      0
    );

    const expenses = expenseTransactions.reduce(
      (sum, transaction) => sum + Math.abs(transaction.analyticsAmount),
      0
    );

    // Use the existing finance engine's current-month totals when
    // available, so pocket money is not omitted or counted twice.
    const isCurrentMonth = period === "thisMonth";

    const income =
      isCurrentMonth && Number.isFinite(Number(financials.totalIncome))
        ? Number(financials.totalIncome)
        : transactionIncome +
          (isCurrentMonth ? Number(monthlyPocketMoney) || 0 : 0);

    const finalExpenses =
      isCurrentMonth &&
      Number.isFinite(Number(financials.totalExpenses))
        ? Number(financials.totalExpenses)
        : expenses;

    const savings = income - finalExpenses;

    const daysElapsed = Math.max(
      1,
      Math.floor((now - start) / 86400000) + 1
    );

    const expenseByCategory = {};

    expenseTransactions.forEach((transaction) => {
      const category = transaction.analyticsCategory;
      expenseByCategory[category] =
        (expenseByCategory[category] || 0) +
        Math.abs(transaction.analyticsAmount);
    });

    const categories = Object.entries(expenseByCategory)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    const highestExpense = expenseTransactions.reduce(
      (highest, transaction) =>
        Math.abs(transaction.analyticsAmount) >
        Math.abs(highest?.analyticsAmount || 0)
          ? transaction
          : highest,
      null
    );

    return {
      filtered,
      incomeTransactions,
      expenseTransactions,
      transactionIncome,
      income,
      expenses: finalExpenses,
      savings,
      savingsRate:
        income > 0 ? Math.max(0, (savings / income) * 100) : 0,
      averageDaily:
        finalExpenses / daysElapsed,
      categories,
      highestExpense,
      transactionCount: filtered.length,
    };
  }, [
    normalizedTransactions,
    period,
    financials.totalIncome,
    financials.totalExpenses,
    monthlyPocketMoney,
  ]);

  const chartData = useMemo(() => {
    const monthCount = period === "year" ? 12 : 6;

    const months = Array.from({ length: monthCount }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (monthCount - 1 - index),
        1
      );

      return {
        key: monthKey(date),
        label: monthLabel(date),
        income: 0,
        expenses: 0,
      };
    });

    normalizedTransactions.forEach((transaction) => {
      const key = monthKey(transaction.analyticsDate);
      const month = months.find((item) => item.key === key);

      if (!month) return;

      if (transaction.analyticsAmount > 0) {
        month.income += transaction.analyticsAmount;
      } else {
        month.expenses += Math.abs(transaction.analyticsAmount);
      }
    });

    // Add the current monthly allowance once to the current month.
    const currentMonth = months.find(
      (item) => item.key === monthKey(now)
    );

    if (currentMonth) {
      currentMonth.income += Number(monthlyPocketMoney) || 0;
    }

    return months;
  }, [normalizedTransactions, period, monthlyPocketMoney]);

  const chartMax = Math.max(
    1,
    ...chartData.map((item) =>
      Math.max(item.income, item.expenses)
    )
  );

  const totalCategorySpending = periodData.categories.reduce(
    (sum, category) => sum + category.amount,
    0
  );

  const donutGradient = (() => {
    if (!totalCategorySpending) {
      return "#eeeaf0 0% 100%";
    }

    let current = 0;

    return periodData.categories
      .map((category, index) => {
        const start = current;
        const percentage =
          (category.amount / totalCategorySpending) * 100;

        current += percentage;

        return `${categoryColors[index % categoryColors.length]} ${start}% ${current}%`;
      })
      .join(", ");
  })();

  const periodTitle =
    period === "thisMonth"
      ? "This month"
      : period === "sixMonths"
        ? "Last 6 months"
        : "This year";

  const topCategory = periodData.categories[0];

  const highestExpenseDate = periodData.highestExpense
    ? periodData.highestExpense.analyticsDate.toLocaleDateString(
        "en-GB",
        {
          day: "numeric",
          month: "short",
        }
      )
    : null;

  const formatTransactionDate = (date) =>
    date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <span className="analytics-eyebrow">
            YOUR MONEY, UNDERSTOOD
          </span>
          <h1>Financial Analytics</h1>
          <p>
            Understand your habits. Make smarter money decisions.
          </p>
        </div>

        <div className="analytics-period-control">
          <CalendarDays size={17} />
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            aria-label="Analytics period"
          >
            <option value="thisMonth">This month</option>
            <option value="sixMonths">Last 6 months</option>
            <option value="year">This year</option>
          </select>
        </div>
      </div>

      <section className="analytics-overview">
        <article className="analytics-main-card">
          <div className="analytics-main-card-top">
            <div className="analytics-main-icon">
              <Wallet size={21} />
            </div>
            <span>{periodTitle} overview</span>
          </div>

          <div className="analytics-main-balance">
            {money(periodData.savings)}
          </div>

          <span className="analytics-main-caption">
            {periodData.savings >= 0
              ? "Income remaining after expenses"
              : "You spent more than your recorded income"}
          </span>

          <div className="analytics-main-bottom">
            <div>
              <span>Income</span>
              <strong>{money(periodData.income)}</strong>
            </div>
            <div>
              <span>Expenses</span>
              <strong>{money(periodData.expenses)}</strong>
            </div>
          </div>
        </article>

        <article className="analytics-stat-card">
          <div className="analytics-stat-top">
            <span>Income</span>
            <div className="analytics-stat-icon income">
              <ArrowDownRight size={19} />
            </div>
          </div>
          <strong>{money(periodData.income)}</strong>
          <small>
            <TrendingUp size={13} />
            Money received
          </small>
        </article>

        <article className="analytics-stat-card">
          <div className="analytics-stat-top">
            <span>Expenses</span>
            <div className="analytics-stat-icon expense">
              <ArrowUpRight size={19} />
            </div>
          </div>
          <strong>{money(periodData.expenses)}</strong>
          <small>
            <TrendingDown size={13} />
            Money spent
          </small>
        </article>

        <article className="analytics-stat-card">
          <div className="analytics-stat-top">
            <span>Savings rate</span>
            <div className="analytics-stat-icon savings">
              <Target size={18} />
            </div>
          </div>
          <strong>
            {periodData.savingsRate.toFixed(1)}%
          </strong>
          <small>
            <Activity size={13} />
            Of recorded income
          </small>
        </article>
      </section>

      <section className="analytics-primary-grid">
        <article className="analytics-panel analytics-trend-panel">
          <div className="analytics-panel-heading">
            <div>
              <h2>Income vs. expenses</h2>
              <p>Monthly cash flow comparison</p>
            </div>
            <div className="analytics-chart-legend">
              <span>
                <i className="legend-income" />
                Income
              </span>
              <span>
                <i className="legend-expense" />
                Expenses
              </span>
            </div>
          </div>

          <div className="analytics-bar-chart">
            {chartData.map((item) => (
              <div className="analytics-bar-group" key={item.key}>
                <div className="analytics-bars">
                  <div
                    className="analytics-bar income-bar"
                    style={{
                      height: `${Math.max(
                        item.income > 0 ? 3 : 0,
                        (item.income / chartMax) * 100
                      )}%`,
                    }}
                    title={`Income: ${money(item.income)}`}
                  />
                  <div
                    className="analytics-bar expense-bar"
                    style={{
                      height: `${Math.max(
                        item.expenses > 0 ? 3 : 0,
                        (item.expenses / chartMax) * 100
                      )}%`,
                    }}
                    title={`Expenses: ${money(item.expenses)}`}
                  />
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="analytics-panel analytics-category-panel">
          <div className="analytics-panel-heading">
            <div>
              <h2>Spending breakdown</h2>
              <p>Where your money goes</p>
            </div>
            <PieChart size={19} />
          </div>

          {periodData.categories.length === 0 ? (
            <div className="analytics-chart-empty">
              No expense categories yet.
            </div>
          ) : (
            <>
              <div className="analytics-donut-wrap">
                <div
                  className="analytics-donut"
                  style={{
                    background: `conic-gradient(${donutGradient})`,
                  }}
                >
                  <div className="analytics-donut-center">
                    <strong>{compactMoney(totalCategorySpending)}</strong>
                    <span>Total spent</span>
                  </div>
                </div>
              </div>

              <div className="analytics-category-list">
                {periodData.categories.slice(0, 6).map(
                  (category, index) => (
                    <div
                      className="analytics-category-row"
                      key={category.name}
                    >
                      <div className="analytics-category-name">
                        <i
                          style={{
                            background:
                              categoryColors[
                                index % categoryColors.length
                              ],
                          }}
                        />
                        <span>{category.name}</span>
                      </div>
                      <div className="analytics-category-value">
                        <strong>{money(category.amount)}</strong>
                        <span>
                          {totalCategorySpending
                            ? (
                                (category.amount /
                                  totalCategorySpending) *
                                100
                              ).toFixed(0)
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </article>
      </section>

      <section className="analytics-insights-grid">
        <article className="analytics-insight-card">
          <div className="analytics-insight-icon">
            <Receipt size={20} />
          </div>
          <div>
            <span>Transactions recorded</span>
            <strong>{periodData.transactionCount}</strong>
            <small>During {periodTitle.toLowerCase()}</small>
          </div>
        </article>

        <article className="analytics-insight-card">
          <div className="analytics-insight-icon orange">
            <TrendingDown size={20} />
          </div>
          <div>
            <span>Average daily spending</span>
            <strong>{money(periodData.averageDaily)}</strong>
            <small>Based on elapsed days in the period</small>
          </div>
        </article>

        <article className="analytics-insight-card">
          <div className="analytics-insight-icon purple">
            <Target size={20} />
          </div>
          <div>
            <span>Highest spending category</span>
            <strong className="analytics-insight-text">
              {topCategory?.name || "No data yet"}
            </strong>
            <small>
              {topCategory
                ? money(topCategory.amount)
                : "Add an expense to see insights"}
            </small>
          </div>
        </article>

        <article className="analytics-insight-card">
          <div className="analytics-insight-icon blue">
            <Sparkles size={20} />
          </div>
          <div>
            <span>Largest single expense</span>
            <strong>
              {periodData.highestExpense
                ? money(
                    Math.abs(
                      periodData.highestExpense.analyticsAmount
                    )
                  )
                : money(0)}
            </strong>
            <small>
              {periodData.highestExpense
                ? `${periodData.highestExpense.analyticsCategory} · ${highestExpenseDate}`
                : "No expenses recorded"}
            </small>
          </div>
        </article>
      </section>

      <section className="analytics-panel analytics-transactions-panel">
        <div className="analytics-panel-heading">
          <div>
            <h2>Recent activity</h2>
            <p>Your latest recorded transactions</p>
          </div>
          <span className="analytics-activity-count">
            {periodData.filtered.length} records
          </span>
        </div>

        {periodData.filtered.length === 0 ? (
          <div className="analytics-chart-empty">
            No transactions found for this period.
          </div>
        ) : (
          <div className="analytics-transaction-list">
            {[...periodData.filtered]
              .sort(
                (a, b) =>
                  b.analyticsDate - a.analyticsDate
              )
              .slice(0, 6)
              .map((transaction, index) => (
                <div
                  className="analytics-transaction-row"
                  key={transaction.id || `${index}-${transaction.analyticsDate.getTime()}`}
                >
                  <div
                    className={`analytics-transaction-icon ${
                      transaction.analyticsAmount >= 0
                        ? "positive"
                        : "negative"
                    }`}
                  >
                    {transaction.analyticsAmount >= 0 ? (
                      <ArrowDownRight size={18} />
                    ) : (
                      <ArrowUpRight size={18} />
                    )}
                  </div>

                  <div className="analytics-transaction-info">
                    <strong>
                      {transaction.analyticsDescription}
                    </strong>
                    <span>
                      {transaction.analyticsCategory} ·{" "}
                      {formatTransactionDate(
                        transaction.analyticsDate
                      )}
                    </span>
                  </div>

                  <strong
                    className={`analytics-transaction-amount ${
                      transaction.analyticsAmount >= 0
                        ? "positive"
                        : "negative"
                    }`}
                  >
                    {transaction.analyticsAmount >= 0 ? "+" : "-"}
                    {money(
                      Math.abs(transaction.analyticsAmount)
                    )}
                  </strong>
                </div>
              ))}
          </div>
        )}
      </section>

      <div className="analytics-footnote">
        <Activity size={15} />
        Analytics is based on your recorded transactions and current
        monthly allowance. Savings goal contributions are not treated
        as expenses.
      </div>
    </div>
  );
}
