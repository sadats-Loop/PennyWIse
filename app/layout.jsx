
import "./globals.css";
import ServiceWorkerRegister from "../components/pwa/ServiceWorkerRegister";

export const metadata = {
  title: "PennyWise — Make Your Money Last",
  description:
    "A smarter money management companion for students.",

  applicationName: "PennyWise",

  manifest: "/manifest.webmanifest",

  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PennyWise",
  },

  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#D91B70",
  colorScheme: "light",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
