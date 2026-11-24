
"use client";

import { useEffect, useState } from "react";
import { Wallet, X, Sparkles } from "lucide-react";
import "./WelcomeModal.css";

export default function WelcomeModal({ profile }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!profile?.name?.trim()) return;

    const hasSeenWelcome = localStorage.getItem(
      "pennywise_welcome_seen"
    );

    if (!hasSeenWelcome) {
      setVisible(true);
    }
  }, [profile]);

  function closeWelcome() {
    localStorage.setItem("pennywise_welcome_seen", "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="welcome-modal-overlay">
      <div className="welcome-modal">
        <button
          className="welcome-modal-close"
          onClick={closeWelcome}
          aria-label="Close welcome message"
        >
          <X size={19} />
        </button>

        <div className="welcome-modal-content">
          <div className="welcome-modal-icon">
            <Wallet size={30} />
            <span className="welcome-modal-sparkle">
              <Sparkles size={16} />
            </span>
          </div>

          <span className="welcome-modal-label">
            WELCOME TO PENNYWISE
          </span>

          <h1>
            অবশেষে চলে এলে, {profile.name}! 😭
          </h1>

          <h2>Welcome to Pennywise!</h2>

          <p>
            তোমার financial decisions এখন Sadat-এর
            নজরদারিতে।
          </p>

          <button
            className="welcome-modal-cta"
            onClick={closeWelcome}
          >
            Let's Go! 🚀
          </button>

          <span className="welcome-modal-footer">
            Your money, your responsibility. 💗
          </span>
        </div>
      </div>
    </div>
  );
}
