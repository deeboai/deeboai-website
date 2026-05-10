"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { GOOGLE_APPOINTMENT_SCHEDULING_URL } from "@/lib/contact";

declare global {
  interface Window {
    calendar?: {
      schedulingButton?: {
        load: (options: {
          url: string;
          color: string;
          label: string;
          target: HTMLElement;
        }) => void;
      };
    };
  }
}

const GOOGLE_SCHEDULING_STYLESHEET_ID = "google-scheduling-button-stylesheet";
const GOOGLE_SCHEDULING_SCRIPT_ID = "google-scheduling-button-script";
const GOOGLE_SCHEDULING_STYLESHEET_URL =
  "https://calendar.google.com/calendar/scheduling-button-script.css";
const GOOGLE_SCHEDULING_SCRIPT_URL =
  "https://calendar.google.com/calendar/scheduling-button-script.js";

function ensureGoogleSchedulingStylesheet() {
  if (document.getElementById(GOOGLE_SCHEDULING_STYLESHEET_ID)) {
    return;
  }

  const stylesheet = document.createElement("link");
  stylesheet.id = GOOGLE_SCHEDULING_STYLESHEET_ID;
  stylesheet.rel = "stylesheet";
  stylesheet.href = GOOGLE_SCHEDULING_STYLESHEET_URL;
  document.head.appendChild(stylesheet);
}

function ensureGoogleSchedulingScript() {
  const existingScript = document.getElementById(
    GOOGLE_SCHEDULING_SCRIPT_ID,
  ) as HTMLScriptElement | null;

  if (existingScript?.dataset.loaded === "true") {
    return Promise.resolve();
  }

  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load Google scheduling script.")), {
        once: true,
      });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = GOOGLE_SCHEDULING_SCRIPT_ID;
    script.src = GOOGLE_SCHEDULING_SCRIPT_URL;
    script.async = true;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", () => reject(new Error("Unable to load Google scheduling script.")), {
      once: true,
    });
    document.head.appendChild(script);
  });
}

type GoogleAppointmentButtonProps = {
  label?: string;
  color?: string;
  className?: string;
};

export function GoogleAppointmentButton({
  label = "Book a consultation",
  color = "#039BE5",
  className,
}: GoogleAppointmentButtonProps) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadButton() {
      ensureGoogleSchedulingStylesheet();
      await ensureGoogleSchedulingScript();

      if (!isActive || !targetRef.current || !window.calendar?.schedulingButton?.load) {
        return;
      }

      // Clear any previous button markup before Google mounts the new one.
      targetRef.current.innerHTML = "";
      window.calendar.schedulingButton.load({
        url: GOOGLE_APPOINTMENT_SCHEDULING_URL,
        color,
        label,
        target: targetRef.current,
      });
      setIsEmbedded(true);
    }

    void loadButton();

    return () => {
      isActive = false;
    };
  }, [color, label]);

  return (
    <div className={className}>
      <div ref={targetRef} />
      {!isEmbedded ? (
        <Button asChild className="w-full sm:w-auto">
          <a href={GOOGLE_APPOINTMENT_SCHEDULING_URL} target="_blank" rel="noreferrer">
            {label}
          </a>
        </Button>
      ) : null}
    </div>
  );
}
