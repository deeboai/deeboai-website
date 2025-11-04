import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import faviconPng from "@/assets/logos/white_on_black_no_background.png";

const applyBrandAssets = () => {
  const ensureLink = (rel: string, type?: string) => {
    let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement("link");
      link.rel = rel;
      document.head.appendChild(link);
    }
    if (type) {
      link.type = type;
    }
    link.href = faviconPng;
  };

  ensureLink("icon", "image/png");
  ensureLink("apple-touch-icon");
};

applyBrandAssets();

createRoot(document.getElementById("root")!).render(<App />);
