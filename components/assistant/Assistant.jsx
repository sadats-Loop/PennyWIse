
"use client";

import { useMemo, useState } from "react";
import {
  Sparkles,
  Send,
  Plus,
  Bot,
  User,
  Wallet,
  TrendingUp,
  PiggyBank,
  Lightbulb,
  LoaderCircle,
  ArrowUpRight,
} from "lucide-react";

import "./Assistant.css";

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

const suggestions = [
  {
    icon: Wallet,
    title: "My financial health",
    prompt: "Analyze my current financial health and explain how I am doing.",
  },
  {
    icon: TrendingUp,
    title: "Spending analysis",
    prompt: "Analyze my spending this month. Which categories cost me the most?",
  },
  {
    icon: PiggyBank,
    title: "Help me save",
    prompt: "Give me a realistic plan to save more money this month.",
  },
  {
    icon: Lightbulb,
    title: "Smart advice",
    prompt: "Give me three practical financial recommendations based on my data.",
  },
];

function getAmount(transaction) {
  const amount = Number(transaction?.amount);

  if (!Number.isFinite(amount)) return 0;

  const type = String(transaction?.type || "").toLowerCase();

  if (type.includes("expense")) return -Math.abs(amount);
  if (type.includes("income")) return Math.abs(amount);

  return amount;
}

function getTransactionDate(transaction) {
  const value =
    transaction?.date ||
    transaction?.createdAt ||
    transaction?.transactionDate ||
    transaction?.timestamp;

  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function buildFinancialContext(
  transactions,
  financials,
  monthlyPocketMoney
) {
  const now = new Date();

  const currentMonthTransactions = (transactions || []).filter(
    (item) => {
      const date = getTransactionDate(item);

      return (
        date &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }
  );

  const categoryTotals = {};

  currentMonthTransactions.forEach((item) => {
    const amount = getAmount(item);

    if (amount >= 0) return;

    const category =
      item.category ||
      item.categoryName ||
      item.title ||
      "Other";

    categoryTotals[category] =
      (categoryTotals[category] || 0) + Math.abs(amount);
  });

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([category, amount]) => ({
      category,
      amount,
    }));

  const recentTransactions = (transactions || [])
    .slice()
    .sort((a, b) => {
      const dateA = getTransactionDate(a)?.getTime() || 0;
      const dateB = getTransactionDate(b)?.getTime() || 0;

      return dateB - dateA;
    })
    .slice(0, 10)
    .map((item) => ({
      description:
        item.description ||
        item.title ||
        item.name ||
        item.category ||
        "Transaction",

      category:
        item.category ||
        item.categoryName ||
        "Other",

      amount: getAmount(item),

      date:
        getTransactionDate(item)?.toISOString() || null,
    }));

  const calculatedIncome = Number(financials?.totalIncome);
  const calculatedExpenses = Number(financials?.totalExpenses);

  return {
    currency: "BDT",

    currentMonth: now.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    }),

    monthlyPocketMoney: Number(monthlyPocketMoney) || 0,

    currentBalance:
      Number(financials?.currentBalance) || 0,

    monthlyIncome: Number.isFinite(calculatedIncome)
      ? calculatedIncome
      : 0,

    monthlyExpenses: Number.isFinite(calculatedExpenses)
      ? calculatedExpenses
      : 0,

    monthlySavings:
      Number(financials?.savings) || 0,

    remainingBudget:
      Number(financials?.remainingBudget) || 0,

    topSpendingCategories: topCategories,

    recentTransactions,

    transactionCount: currentMonthTransactions.length,
  };
}

function formatMessage(text) {
  const lines = String(text || "").split("\n");

  return lines.map((line, index) => (
    <span key={index}>
      {line}
      {index < lines.length - 1 && <br />}
    </span>
  ));
}

export default function Assistant({
  transactions = [],
  financials = {},
  monthlyPocketMoney = 15000,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const financialContext = useMemo(
    () =>
      buildFinancialContext(
        transactions,
        financials,
        monthlyPocketMoney
      ),
    [transactions, financials, monthlyPocketMoney]
  );

  // SEND MESSAGE
  const sendMessage = async (customMessage) => {
    const messageText = (customMessage || input).trim();

    if (!messageText || loading) return;

    const userMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: messageText,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          message: messageText,

          history: messages.slice(-10).map((item) => ({
            role: item.role,
            content: item.content,
          })),

          financialContext,
        }),
      });

      // Read response safely instead of assuming JSON.
      const responseText = await response.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("PennyWise API returned invalid JSON:", {
          status: response.status,
          response: responseText.slice(0, 1000),
        });

        throw new Error(
          `Server returned HTML instead of JSON (HTTP ${response.status}). Check your API route.`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to get an AI response."
        );
      }

      if (!data.reply) {
        throw new Error(
          "PennyWise AI returned an empty response."
        );
      }

      // Add AI response.
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (err) {
      console.error("PennyWise Assistant error:", err);

      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // NEW CHAT
  const startNewChat = () => {
    if (loading) return;

    setMessages([]);
    setInput("");
    setError("");
  };

  return (
    <section className="assistant-page">

      {/* PAGE HEADER */}
      <div className="assistant-heading">
        <div>
          <div className="assistant-eyebrow">
            <Sparkles size={14} />
            PENNYWISE INTELLIGENCE
          </div>

          <h1>Your AI Financial Assistant</h1>

          <p>
            Understand your money, discover patterns, and make
            smarter financial decisions.
          </p>
        </div>

        <button
          type="button"
          className="assistant-new-chat"
          onClick={startNewChat}
          disabled={loading}
        >
          <Plus size={17} />
          New chat
        </button>
      </div>

      {/* MAIN WORKSPACE */}
      <div className="assistant-workspace">

        {/* FINANCIAL SIDEBAR */}
        <aside className="assistant-sidebar">

          <div className="assistant-sidebar-title">
            YOUR FINANCIAL SNAPSHOT
          </div>

          <div className="assistant-snapshot-card">
            <div className="assistant-snapshot-icon">
              <Wallet size={18} />
            </div>

            <span>Available balance</span>

            <strong>
              {currency.format(
                financialContext.currentBalance
              )}
            </strong>
          </div>

          <div className="assistant-snapshot-card">
            <div className="assistant-snapshot-icon">
              <TrendingUp size={18} />
            </div>

            <span>Monthly expenses</span>

            <strong>
              {currency.format(
                financialContext.monthlyExpenses
              )}
            </strong>
          </div>

          <div className="assistant-snapshot-card">
            <div className="assistant-snapshot-icon">
              <PiggyBank size={18} />
            </div>

            <span>Monthly savings</span>

            <strong>
              {currency.format(
                financialContext.monthlySavings
              )}
            </strong>
          </div>

          <div className="assistant-privacy-note">
            <Sparkles size={15} />

            <p>
              Your assistant uses your PennyWise financial
              summary to provide relevant answers.
            </p>
          </div>

        </aside>

        {/* CHAT AREA */}
        <div className="assistant-chat">

          {/* CHAT HEADER */}
          <div className="assistant-chat-header">

            <div className="assistant-bot-avatar">
              <Sparkles size={20} />
            </div>

            <div>
              <strong>PennyWise AI</strong>

              <span>
                <i />
                Your personal money companion
              </span>
            </div>

          </div>

          {/* MESSAGES */}
          <div className="assistant-messages">

            {messages.length === 0 ? (

              <div className="assistant-welcome">

                <div className="assistant-welcome-icon">
                  <Sparkles size={26} />
                </div>

                <h2>
                  Hey! Let's make your money smarter.
                </h2>

                <p>
                  Ask me anything about your spending, budget,
                  savings, or financial habits.
                </p>

                {/* SUGGESTIONS */}
                <div className="assistant-suggestions">

                  {suggestions.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        type="button"
                        key={item.title}
                        onClick={() =>
                          sendMessage(item.prompt)
                        }
                        disabled={loading}
                      >
                        <Icon size={18} />

                        <span>{item.title}</span>

                        <ArrowUpRight size={15} />
                      </button>
                    );
                  })}

                </div>

              </div>

            ) : (

              <div className="assistant-message-list">

                {messages.map((message) => (

                  <div
                    key={message.id}
                    className={`assistant-message assistant-message-${message.role}`}
                  >

                    <div className="assistant-message-avatar">

                      {message.role === "assistant" ? (
                        <Bot size={17} />
                      ) : (
                        <User size={17} />
                      )}

                    </div>

                    <div className="assistant-message-content">

                      <span className="assistant-message-name">
                        {message.role === "assistant"
                          ? "PennyWise AI"
                          : "You"}
                      </span>

                      <div className="assistant-message-bubble">
                        {formatMessage(message.content)}
                      </div>

                    </div>

                  </div>

                ))}

                {/* LOADING INDICATOR */}
                {loading && (

                  <div className="assistant-message assistant-message-assistant">

                    <div className="assistant-message-avatar">
                      <Bot size={17} />
                    </div>

                    <div className="assistant-message-content">

                      <span className="assistant-message-name">
                        PennyWise AI
                      </span>

                      <div className="assistant-typing">
                        <LoaderCircle
                          size={16}
                          className="assistant-spin"
                        />

                        Analyzing your finances...
                      </div>

                    </div>

                  </div>

                )}

              </div>

            )}

            {/* ERROR */}
            {error && (
              <div className="assistant-error">
                {error}
              </div>
            )}

          </div>

          {/* INPUT AREA */}
          <form
            className="assistant-input-area"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >

            <div className="assistant-input-box">

              <input
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                placeholder="Ask PennyWise anything about your money..."
                disabled={loading}
                maxLength={2000}
              />

              <button
                type="submit"
                aria-label="Send message"
                disabled={!input.trim() || loading}
              >

                {loading ? (
                  <LoaderCircle
                    size={19}
                    className="assistant-spin"
                  />
                ) : (
                  <Send size={18} />
                )}

              </button>

            </div>

            <span className="assistant-input-disclaimer">
              AI can make mistakes. Always verify important financial decisions.
            </span>

          </form>

        </div>

      </div>

    </section>
  );
}
