
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Sparkles, ArrowRight } from "lucide-react";
import "./OnboardingForm.css";

export default function OnboardingForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [pocketMoney, setPocketMoney] = useState("");
  const [pee, setPee] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim() || !pocketMoney || Number(pocketMoney) <= 0) {
      return;
    }

    onSubmit?.({
      name: name.trim(),
      monthlyPocketMoney: Number(pocketMoney),
      pee,
    });
  }

  return (
    <main className="onboarding-screen">
      <motion.section
        className="onboarding-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="onboarding-brand">
          <div className="onboarding-logo">
            <Wallet size={23} strokeWidth={2.2} />
          </div>
          <span>PennyWise</span>
        </div>

        <div className="onboarding-heading">
          <div className="onboarding-eyebrow">
            <Sparkles size={14} />
            YOUR FINANCIAL JOURNEY STARTS HERE
          </div>

          <h1>
            Let's get to
            <span> know you.</span>
          </h1>

          <p>
            A few little details to personalize your PennyWise
            experience. Let's make managing money feel effortless.
          </p>
        </div>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              placeholder="eg. Sadat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pocket-money">
              Monthly pocket money
            </label>

            <div className="money-input-wrapper">
              <span className="money-symbol">৳</span>
              <input
                type="number"
                id="pocket-money"
                placeholder="kire gorib:-)"
                value={pocketMoney}
                onChange={(e) => setPocketMoney(e.target.value)}
                min="1"
                step="1"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="pee">
              When was the last time you peed today? 🚽
              <span className="label-subtext">
                We won't judge. (Probably.)
              </span>
            </label>

            <input
              type="text"
              id="pee"
              placeholder="Sadat is conducting extremely unnecessary research..."
              value={pee}
              onChange={(e) => setPee(e.target.value)}
            />
          </div>

          <button type="submit" className="onboarding-submit">
            <span>Submit to Sadat</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="onboarding-footer">
          Made for your money. Designed for your life.
        </div>
      </motion.section>
    </main>
  );
}
