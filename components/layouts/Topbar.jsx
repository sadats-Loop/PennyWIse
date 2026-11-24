
"use client";

import { motion } from "framer-motion";
import {
  WalletCards,
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Target,
  Sparkles,
  Bell,
  Settings,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Transactions", icon: ArrowLeftRight },
  { label: "Budget Planner", icon: WalletCards },
  { label: "Savings Goals", icon: Target },
  { label: "Analytics", icon: ChartNoAxesCombined },
  { label: "AI Assistant", icon: Sparkles },
  { label: "Settings", icon: Settings },
];

function Brand() {
  return (
    <div className="brand topbar-brand">
      <div className="brand-icon">
        <WalletCards size={22} strokeWidth={2.5} />
      </div>

      <div className="brand-name">
        Penny<span>Wise</span>
      </div>
    </div>
  );
}

export default function Topbar({ active, setActive }) {
  return (
    <header className="topbar topbar-new">

      {/* Brand */}
      <Brand />

      {/* Main navigation */}
      <nav className="topbar-navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const selected = active === item.label;

          return (
            <button
              key={item.label}
              className={`topbar-nav-item ${
                selected ? "active" : ""
              }`}
              onClick={() => setActive(item.label)}
            >
              <Icon size={16} strokeWidth={2} />

              <span>{item.label}</span>

              {selected && (
                <motion.div
                  layoutId="topbar-active-indicator"
                  className="topbar-active-indicator"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Actions */}
      <div className="topbar-actions">
        <button
          className="icon-button"
          aria-label="Notifications"
          onClick={() =>
            window.alert(
              "Notifications will be available in a future update."
            )
          }
        >
          <Bell size={18} />
        </button>

        <div className="avatar">S</div>
      </div>
    </header>
  );
}
