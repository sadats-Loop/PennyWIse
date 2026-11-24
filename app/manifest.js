
export default function manifest() {
  return {
    id: "/",
    name: "PennyWise — Make Your Money Last",
    short_name: "PennyWise",
    description:
      "A smarter money management companion for students.",

    start_url: "/",
    scope: "/",

    display: "standalone",
    orientation: "portrait",

    background_color: "#F7F7F9",
    theme_color: "#D91B70",

    categories: ["finance", "productivity"],

    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],

    screenshots: [
      {
        src: "/screenshots/pennywise-mobile.png",
        sizes: "720x1280",
        type: "image/png",
        label: "PennyWise mobile dashboard",
      },
      {
        src: "/screenshots/pennywise-desktop.png",
        sizes: "1280x720",
        type: "image/png",
        label: "PennyWise desktop dashboard",
        form_factor: "wide",
      },
    ],
  };
}
