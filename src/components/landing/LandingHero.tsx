"use client";

import Link from "next/link";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { ValuePropCard } from "./ValuePropCard";
import { BlinkingCursor } from "./BlinkingCursor";

export function LandingHero() {
  return (
    <main className="min-h-screen px-4 pt-12 pb-20 md:px-6 md:pt-20 md:pb-24">
      <div className="max-w-6xl mx-auto space-y-12 md:space-y-16">
        {/* Hero Section */}
        <section aria-labelledby="hero-heading" className="max-w-3xl mx-auto">
          <TerminalPanel showCornerBrackets className="p-6 md:p-12">
            <div className="text-center">
              <h1
                id="hero-heading"
                className="text-3xl md:text-5xl font-bold uppercase tracking-wider leading-tight mb-4 md:mb-6 text-terminal-text"
                style={{ letterSpacing: "0.1em" }}
              >
                <span aria-hidden="true">{">"} </span>
                <span>TRACK. LIFT. GROW.</span>
                <BlinkingCursor />
              </h1>

              <p className="text-lg md:text-xl uppercase text-terminal-textSecondary mb-6 md:mb-8 leading-relaxed">
                THE SIMPLEST WORKOUT TRACKER
                <br />
                FOR PEOPLE WHO JUST LIFT
              </p>

              <Link
                href="/sign-up"
                className="inline-block w-full md:w-auto px-8 md:px-12 py-3 md:py-4 bg-terminal-success text-terminal-bg font-bold uppercase text-sm md:text-base tracking-wider hover:opacity-90 active:scale-97 transition-all border-0"
                aria-label="Sign up to start tracking workouts"
              >
                GET STARTED
              </Link>
            </div>
          </TerminalPanel>
        </section>

        {/* Value Props Section */}
        <section aria-label="Key features">
          <h2 className="sr-only">WHY CHOOSE VOLUME</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <ValuePropCard
              title="FAST"
              description={["LOG SETS IN", "SECONDS"]}
              accentColor="info"
            />
            <ValuePropCard
              title="SIMPLE"
              description={["NO BLOAT", "NO BS", "JUST LIFT"]}
              accentColor="warning"
            />
            <ValuePropCard
              title="YOURS"
              description={["YOUR DATA", "YOUR WAY", "NO LOCK-IN"]}
              accentColor="accent"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
