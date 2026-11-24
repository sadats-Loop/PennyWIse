
"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log(
          "PennyWise Service Worker registered:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error(
          "PennyWise Service Worker registration failed:",
          error
        );
      });
  }, []);

  return null;
}
