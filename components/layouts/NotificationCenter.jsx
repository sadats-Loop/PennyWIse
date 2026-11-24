
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  X,
  Wallet,
  ChartNoAxesCombined,
  Receipt,
  CheckCheck,
  Check,
  Trash2,
  ArrowUpRight,
} from "lucide-react";

import "./NotificationCenter.css";

const NOTIFICATION_STORAGE_KEY = "pennywise_notifications";

function formatCurrency(amount) {
  return `৳ ${Math.round(Number(amount) || 0).toLocaleString("en-BD")}`;
}

function createNotification({
  id,
  type,
  title,
  message,
  date,
  target,
}) {
  return {
    id,
    type,
    title,
    message,
    date: date || new Date().toISOString(),
    target,
    read: false,
  };
}

export default function NotificationCenter({
  transactions = [],
  financials,
  setActive,
}) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const latestTransactionId = useRef(
    transactions[0]?.id ?? null
  );

  const unreadCount = notifications.filter(
    (item) => !item.read
  ).length;

  // EXTRACT FINANCIAL VALUES
  const {
    monthKey,
    currentMonthAllowance,
    monthlyBudgetUsed,
    currentBalance,
  } = financials || {};

  // LOAD SAVED NOTIFICATIONS
  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        NOTIFICATION_STORAGE_KEY
      );

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setNotifications(parsed);
        }
      }
    } catch (error) {
      console.error("Unable to load notifications:", error);
    }

    setLoaded(true);
  }, []);

  // SAVE NOTIFICATIONS
  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(
        NOTIFICATION_STORAGE_KEY,
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error("Unable to save notifications:", error);
    }
  }, [notifications, loaded]);

  // ADD A NOTIFICATION ONLY ONCE PER ID
  const addNotification = useCallback((notification) => {
    setNotifications((previous) => {
      if (
        previous.some(
          (item) => item.id === notification.id
        )
      ) {
        return previous;
      }

      return [notification, ...previous].slice(0, 50);
    });
  }, []);

  // BUDGET AND BALANCE ALERTS
  useEffect(() => {
    if (!loaded || !monthKey) return;

    // BUDGET WARNING
    if (
      currentMonthAllowance > 0 &&
      monthlyBudgetUsed >= 80
    ) {
      addNotification(
        createNotification({
          id: `budget-warning-${monthKey}`,
          type: "budget",
          title: "Budget warning",
          message: `You've used ${Number(
            monthlyBudgetUsed
          ).toFixed(
            0
          )}% of this month's allowance. Keep an eye on your spending.`,
          target: "Budget Planner",
        })
      );
    }

    // LOW BALANCE WARNING
    if (currentBalance < 1000) {
      addNotification(
        createNotification({
          id: `low-balance-${monthKey}`,
          type: "balance",
          title: "Your balance is running low",
          message: `You have ${formatCurrency(
            currentBalance
          )} left in your wallet. Spend carefully.`,
          target: "Dashboard",
        })
      );
    }
  }, [
    loaded,
    monthKey,
    currentMonthAllowance,
    monthlyBudgetUsed,
    currentBalance,
    addNotification,
  ]);

  // NEW LARGE EXPENSE ALERT
  useEffect(() => {
    if (!loaded || transactions.length === 0) return;

    const latestTransaction = transactions[0];

    if (!latestTransaction?.id) return;

    const previousId = latestTransactionId.current;

    // INITIAL TRANSACTION: DO NOT ALERT FOR OLD DATA
    if (previousId === null) {
      latestTransactionId.current = latestTransaction.id;
      return;
    }

    // NO NEW TRANSACTION
    if (previousId === latestTransaction.id) return;

    // UPDATE LATEST TRANSACTION ID
    latestTransactionId.current = latestTransaction.id;

    const amount = Number(latestTransaction.amount);

    // ONLY ALERT FOR EXPENSES OF ৳2,000 OR MORE
    if (
      !Number.isFinite(amount) ||
      amount >= 0 ||
      Math.abs(amount) < 2000
    ) {
      return;
    }

    addNotification(
      createNotification({
        id: `large-expense-${latestTransaction.id}`,
        type: "expense",
        title: "Large expense recorded",
        message: `${latestTransaction.name || "An expense"} cost ${formatCurrency(
          Math.abs(amount)
        )}. Keep track of your spending.`,
        target: "Transactions",
      })
    );
  }, [transactions, loaded, addNotification]);

  // MARK ONE NOTIFICATION AS READ
  function markAsRead(id) {
    setNotifications((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, read: true }
          : item
      )
    );
  }

  // MARK ALL NOTIFICATIONS AS READ
  function markAllAsRead() {
    setNotifications((previous) =>
      previous.map((item) => ({
        ...item,
        read: true,
      }))
    );
  }

  // CLEAR ALL NOTIFICATIONS
  function clearAll() {
    setNotifications([]);
  }

  // OPEN NOTIFICATION
  function handleNotificationClick(notification) {
    markAsRead(notification.id);
    setOpen(false);

    if (notification.target && setActive) {
      setActive(notification.target);
    }
  }

  // NOTIFICATION ICON
  function getNotificationIcon(type) {
    if (type === "budget") return ChartNoAxesCombined;
    if (type === "balance") return Wallet;
    if (type === "expense") return Receipt;

    return Bell;
  }

  // NOTIFICATION COLORS
  function getNotificationStyle(type) {
    if (type === "budget") {
      return {
        background: "#fff4e5",
        color: "#d68a16",
      };
    }

    if (type === "balance") {
      return {
        background: "#fff0f1",
        color: "#e34d5b",
      };
    }

    if (type === "expense") {
      return {
        background: "#fce8f1",
        color: "#d91b70",
      };
    }

    return {
      background: "#edf1ff",
      color: "#647fd3",
    };
  }

  // NOTIFICATION TIME
  function getTimeLabel(date) {
    const timestamp = new Date(date).getTime();

    if (!Number.isFinite(timestamp)) return "";

    const difference = Math.max(
      0,
      Date.now() - timestamp
    );

    const minutes = Math.floor(difference / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours}h ago`;

    return new Date(date).toLocaleDateString("en-BD", {
      day: "numeric",
      month: "short",
    });
  }

  return (
    <div className="notification-center">
      {/* NOTIFICATION BELL */}
      <button
        type="button"
        className={`icon-button notification-trigger ${
          open ? "notification-trigger-active" : ""
        }`}
        aria-label={`Notifications${
          unreadCount
            ? `, ${unreadCount} unread`
            : ""
        }`}
        aria-expanded={open}
        onClick={() =>
          setOpen((previous) => !previous)
        }
      >
        <Bell size={18} />

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* NOTIFICATION PANEL */}
      {open && (
        <>
          <button
            type="button"
            className="notification-backdrop"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />

          <section className="notification-panel">
            {/* HEADER */}
            <div className="notification-header">
              <div>
                <h3>Notifications</h3>

                <p>
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${
                        unreadCount === 1 ? "" : "s"
                      }`
                    : "You're all caught up."}
                </p>
              </div>

              <button
                type="button"
                className="notification-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* ACTIONS */}
            {notifications.length > 0 && (
              <div className="notification-actions">
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <CheckCheck size={14} />
                  Mark all as read
                </button>

                <button
                  type="button"
                  onClick={clearAll}
                >
                  <Trash2 size={14} />
                  Clear all
                </button>
              </div>
            )}

            {/* NOTIFICATION LIST */}
            <div className="notification-list">
              {notifications.length > 0 ? (
                notifications.map((notification) => {
                  const Icon = getNotificationIcon(
                    notification.type
                  );

                  const style = getNotificationStyle(
                    notification.type
                  );

                  return (
                    <button
                      type="button"
                      key={notification.id}
                      className={`notification-item ${
                        notification.read
                          ? "is-read"
                          : "is-unread"
                      }`}
                      onClick={() =>
                        handleNotificationClick(notification)
                      }
                    >
                      <span
                        className="notification-item-icon"
                        style={{
                          background: style.background,
                          color: style.color,
                        }}
                      >
                        <Icon size={18} />
                      </span>

                      <span className="notification-item-content">
                        <span className="notification-item-top">
                          <strong>
                            {notification.title}
                          </strong>

                          {!notification.read && (
                            <span className="notification-unread-dot" />
                          )}
                        </span>

                        <span className="notification-message">
                          {notification.message}
                        </span>

                        <span className="notification-time">
                          {getTimeLabel(notification.date)}

                          <span className="notification-open-hint">
                            Open <ArrowUpRight size={11} />
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="notification-empty">
                  <div className="notification-empty-icon">
                    <Bell size={25} />
                  </div>

                  <strong>All quiet for now!</strong>

                  <p>
                    When PennyWise has something important
                    to tell you, you'll find it here.
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="notification-footer">
              <Check size={13} />
              You're up to date with PennyWise
            </div>
          </section>
        </>
      )}
    </div>
  );
}
