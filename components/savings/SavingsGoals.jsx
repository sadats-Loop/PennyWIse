
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PiggyBank,
  Plus,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock3,
  Pause,
  Play,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  Wallet,
  ArrowUpRight,
} from "lucide-react";

import "./SavingsGoals.css";

const STORAGE_KEY = "pennywise_savings_goals";

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const emptyGoal = {
  name: "",
  targetAmount: "",
  deadline: "",
  description: "",
};

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyGoal);
  const [editingId, setEditingId] = useState(null);

  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionNote, setContributionNote] = useState("");
  const [activeGoalId, setActiveGoalId] = useState(null);

  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setGoals(parsed);
      }
    } catch (err) {
      console.error("Unable to load savings goals:", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch (err) {
      console.error("Unable to save savings goals:", err);
    }
  }, [goals, loaded]);

  const activeGoals = goals.filter((goal) => goal.status === "active");
  const pausedGoals = goals.filter((goal) => goal.status === "paused");
  const completedGoals = goals.filter(
    (goal) => goal.status === "completed"
  );

  const totalSaved = useMemo(
    () =>
      goals.reduce(
        (total, goal) => total + (Number(goal.savedAmount) || 0),
        0
      ),
    [goals]
  );

  const totalTarget = useMemo(
    () =>
      goals.reduce(
        (total, goal) => total + (Number(goal.targetAmount) || 0),
        0
      ),
    [goals]
  );

  const openCreateModal = () => {
    setForm(emptyGoal);
    setEditingId(null);
    setError("");
    setModal("goal");
  };

  const openEditModal = (goal) => {
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      deadline: goal.deadline || "",
      description: goal.description || "",
    });
    setEditingId(goal.id);
    setError("");
    setModal("goal");
  };

  const saveGoal = (event) => {
    event.preventDefault();

    const target = Number(form.targetAmount);

    if (!form.name.trim()) {
      setError("Please enter a goal name.");
      return;
    }

    if (!Number.isFinite(target) || target <= 0) {
      setError("Please enter a valid target amount.");
      return;
    }

    if (editingId) {
      setGoals((current) =>
        current.map((goal) =>
          goal.id === editingId
            ? {
                ...goal,
                name: form.name.trim(),
                targetAmount: target,
                deadline: form.deadline,
                description: form.description.trim(),
                status:
                  goal.status === "completed" && goal.savedAmount < target
                    ? "active"
                    : goal.status,
              }
            : goal
        )
      );
    } else {
      setGoals((current) => [
        {
          id: createId(),
          name: form.name.trim(),
          targetAmount: target,
          savedAmount: 0,
          deadline: form.deadline,
          description: form.description.trim(),
          status: "active",
          contributions: [],
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
    }

    setModal(null);
    setForm(emptyGoal);
    setEditingId(null);
    setError("");
  };

  const openContributionModal = (goal) => {
    setActiveGoalId(goal.id);
    setContributionAmount("");
    setContributionNote("");
    setError("");
    setModal("contribution");
  };

  const addContribution = (event) => {
    event.preventDefault();

    const amount = Number(contributionAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid contribution amount.");
      return;
    }

    setGoals((current) =>
      current.map((goal) => {
        if (goal.id !== activeGoalId) return goal;

        const newSavedAmount =
          (Number(goal.savedAmount) || 0) + amount;

        return {
          ...goal,
          savedAmount: newSavedAmount,
          status:
            newSavedAmount >= Number(goal.targetAmount)
              ? "completed"
              : goal.status,
          contributions: [
            ...(goal.contributions || []),
            {
              id: createId(),
              amount,
              note: contributionNote.trim(),
              date: new Date().toISOString(),
            },
          ],
        };
      })
    );

    setModal(null);
    setContributionAmount("");
    setContributionNote("");
    setActiveGoalId(null);
    setError("");
  };

  const togglePause = (goalId) => {
    setGoals((current) =>
      current.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              status: goal.status === "paused" ? "active" : "paused",
            }
          : goal
      )
    );
  };

  const markComplete = (goalId) => {
    setGoals((current) =>
      current.map((goal) =>
        goal.id === goalId
          ? { ...goal, status: "completed" }
          : goal
      )
    );
  };

  const deleteGoal = (goalId) => {
    const confirmed = window.confirm(
      "Delete this savings goal and its contribution history?"
    );

    if (!confirmed) return;

    setGoals((current) =>
      current.filter((goal) => goal.id !== goalId)
    );
  };

  const selectedGoal = goals.find(
    (goal) => goal.id === activeGoalId
  );

  const getProgress = (goal) => {
    const target = Number(goal.targetAmount) || 0;
    const saved = Number(goal.savedAmount) || 0;

    if (target <= 0) return 0;

    return Math.min(100, Math.round((saved / target) * 100));
  };

  const getRemaining = (goal) =>
    Math.max(
      0,
      (Number(goal.targetAmount) || 0) -
        (Number(goal.savedAmount) || 0)
    );

  if (!loaded) {
    return (
      <div className="savings-loading">
        Loading your savings goals...
      </div>
    );
  }

  return (
    <div className="savings-page">
      <div className="savings-heading">
        <div>
          <span className="savings-eyebrow">
            YOUR FINANCIAL FUTURE
          </span>
          <h1>Savings Goals</h1>
          <p>
            Small steps today. Bigger achievements tomorrow.
          </p>
        </div>

        <button
          className="savings-create-btn"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Create Goal
        </button>
      </div>

      <section className="savings-summary">
        <div className="savings-total-card">
          <div className="savings-total-top">
            <div className="savings-icon pink">
              <PiggyBank size={22} />
            </div>
            <span>Total saved across goals</span>
          </div>

          <h2>{formatMoney(totalSaved)}</h2>

          <div className="savings-total-footer">
            <span>
              of {formatMoney(totalTarget)} combined targets
            </span>
            <TrendingUp size={17} />
          </div>
        </div>

        <div className="savings-stat-card">
          <div className="savings-stat-icon purple">
            <Target size={20} />
          </div>
          <span>Active goals</span>
          <strong>{activeGoals.length}</strong>
          <small>Currently in progress</small>
        </div>

        <div className="savings-stat-card">
          <div className="savings-stat-icon green">
            <CheckCircle2 size={20} />
          </div>
          <span>Completed goals</span>
          <strong>{completedGoals.length}</strong>
          <small>Dreams achieved</small>
        </div>

        <div className="savings-stat-card">
          <div className="savings-stat-icon orange">
            <Clock3 size={20} />
          </div>
          <span>Paused goals</span>
          <strong>{pausedGoals.length}</strong>
          <small>Waiting to resume</small>
        </div>
      </section>

      <div className="savings-section-heading">
        <div>
          <h2>Your goals</h2>
          <p>Keep your progress moving forward.</p>
        </div>
        <span className="savings-goal-count">
          {goals.length} {goals.length === 1 ? "goal" : "goals"}
        </span>
      </div>

      {goals.length === 0 ? (
        <div className="savings-empty">
          <div className="savings-empty-icon">
            <PiggyBank size={34} />
          </div>
          <h3>Your first goal starts here</h3>
          <p>
            Create a savings goal for something you really want.
            Track every contribution and watch your progress grow.
          </p>
          <button
            className="savings-create-btn"
            onClick={openCreateModal}
          >
            <Plus size={18} />
            Create your first goal
          </button>
        </div>
      ) : (
        <div className="savings-goal-grid">
          {goals.map((goal) => {
            const progress = getProgress(goal);
            const remaining = getRemaining(goal);

            return (
              <article className="savings-goal-card" key={goal.id}>
                <div className="savings-goal-card-top">
                  <div className="savings-goal-symbol">
                    <Target size={21} />
                  </div>

                  <div className="savings-goal-actions">
                    <button
                      title="Edit goal"
                      onClick={() => openEditModal(goal)}
                    >
                      <Pencil size={16} />
                    </button>

                    {goal.status !== "completed" && (
                      <button
                        title={
                          goal.status === "paused"
                            ? "Resume goal"
                            : "Pause goal"
                        }
                        onClick={() => togglePause(goal.id)}
                      >
                        {goal.status === "paused" ? (
                          <Play size={16} />
                        ) : (
                          <Pause size={16} />
                        )}
                      </button>
                    )}

                    <button
                      title="Delete goal"
                      className="delete"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="savings-goal-title-row">
                  <div>
                    <h3>{goal.name}</h3>
                    {goal.description && (
                      <p>{goal.description}</p>
                    )}
                  </div>

                  <span
                    className={`savings-status ${goal.status}`}
                  >
                    {goal.status}
                  </span>
                </div>

                <div className="savings-goal-amounts">
                  <div>
                    <span>Saved so far</span>
                    <strong>{formatMoney(goal.savedAmount)}</strong>
                  </div>
                  <div className="savings-target-amount">
                    <span>Target</span>
                    <strong>{formatMoney(goal.targetAmount)}</strong>
                  </div>
                </div>

                <div className="savings-progress-track">
                  <div
                    className="savings-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="savings-progress-labels">
                  <strong>{progress}% completed</strong>
                  <span>
                    {formatMoney(remaining)} remaining
                  </span>
                </div>

                <div className="savings-goal-meta">
                  {goal.deadline ? (
                    <span>
                      <CalendarDays size={15} />
                      Due{" "}
                      {new Date(
                        `${goal.deadline}T00:00:00`
                      ).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  ) : (
                    <span>
                      <CalendarDays size={15} />
                      No deadline
                    </span>
                  )}

                  <span>
                    <Wallet size={15} />
                    {goal.contributions?.length || 0} contributions
                  </span>
                </div>

                {goal.status === "active" &&
                  progress < 100 && (
                    <button
                      className="savings-contribute-btn"
                      onClick={() => openContributionModal(goal)}
                    >
                      <Plus size={17} />
                      Add savings
                      <ArrowUpRight size={16} />
                    </button>
                  )}

                {goal.status === "paused" && (
                  <div className="savings-paused-note">
                    This goal is paused. Resume it to add savings.
                  </div>
                )}

                {goal.status === "completed" && (
                  <div className="savings-completed-note">
                    <CheckCircle2 size={17} />
                    Goal completed!
                  </div>
                )}

                {goal.status !== "completed" &&
                  progress < 100 && (
                    <button
                      className="savings-mark-complete"
                      onClick={() => markComplete(goal.id)}
                    >
                      Mark as completed
                    </button>
                  )}
              </article>
            );
          })}
        </div>
      )}

      {modal === "goal" && (
        <div
          className="savings-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModal(null);
            }
          }}
        >
          <form
            className="savings-modal"
            onSubmit={saveGoal}
          >
            <div className="savings-modal-header">
              <div>
                <span className="savings-eyebrow">
                  PLAN YOUR FUTURE
                </span>
                <h2>
                  {editingId ? "Edit your goal" : "Create a goal"}
                </h2>
              </div>
              <button
                type="button"
                className="savings-modal-close"
                onClick={() => setModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <label>
              Goal name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="e.g. New laptop"
                maxLength={60}
                required
              />
            </label>

            <label>
              Target amount (৳)
              <input
                type="number"
                min="1"
                step="1"
                value={form.targetAmount}
                onChange={(event) =>
                  setForm({
                    ...form,
                    targetAmount: event.target.value,
                  })
                }
                placeholder="e.g. 50000"
                required
              />
            </label>

            <label>
              Target deadline
              <input
                type="date"
                value={form.deadline}
                onChange={(event) =>
                  setForm({ ...form, deadline: event.target.value })
                }
              />
            </label>

            <label>
              Description <span>(optional)</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
                placeholder="Why are you saving for this?"
                rows={3}
                maxLength={240}
              />
            </label>

            {error && <p className="savings-form-error">{error}</p>}

            <button className="savings-submit-btn" type="submit">
              {editingId ? "Save changes" : "Create savings goal"}
            </button>
          </form>
        </div>
      )}

      {modal === "contribution" && selectedGoal && (
        <div
          className="savings-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModal(null);
            }
          }}
        >
          <form
            className="savings-modal"
            onSubmit={addContribution}
          >
            <div className="savings-modal-header">
              <div>
                <span className="savings-eyebrow">
                  BUILD YOUR SAVINGS
                </span>
                <h2>Add contribution</h2>
                <p className="savings-modal-description">
                  Adding to: <strong>{selectedGoal.name}</strong>
                </p>
              </div>

              <button
                type="button"
                className="savings-modal-close"
                onClick={() => setModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="savings-contribution-info">
              <span>Current progress</span>
              <strong>
                {formatMoney(selectedGoal.savedAmount)} /{" "}
                {formatMoney(selectedGoal.targetAmount)}
              </strong>
            </div>

            <label>
              Contribution amount (৳)
              <input
                type="number"
                min="1"
                step="1"
                value={contributionAmount}
                onChange={(event) =>
                  setContributionAmount(event.target.value)
                }
                placeholder="Enter amount"
                required
                autoFocus
              />
            </label>

            <label>
              Note <span>(optional)</span>
              <input
                value={contributionNote}
                onChange={(event) =>
                  setContributionNote(event.target.value)
                }
                placeholder="e.g. Saved from this week's allowance"
                maxLength={100}
              />
            </label>

            <div className="savings-contribution-notice">
              This contribution is tracked separately. Your PennyWise
              wallet balance and monthly budget will remain unchanged.
            </div>

            {error && <p className="savings-form-error">{error}</p>}

            <button className="savings-submit-btn" type="submit">
              Add contribution
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
