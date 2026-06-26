import type { Metadata } from "next";

import StartPage from "@/views/Start";

export const metadata: Metadata = {
  title: "Start a Project",
  description:
    "Tell DeeboAI what you want to build. Share your project goals, features, budget, and timeline, and we'll respond with a clear, specific next step.",
};

export default function Page() {
  return <StartPage />;
}
