"use client";

import PostFeed from "@/components/PostFeed";
import OnboardingChecklist from "@/components/OnboardingChecklist";

export default function FilPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Fil de la communauté</h1>
      <OnboardingChecklist />
      <PostFeed />
    </div>
  );
}
