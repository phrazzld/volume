"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ValuePropCard } from "./ValuePropCard";
import { BlinkingCursor } from "./BlinkingCursor";

export function LandingHero() {
  return (
    <main className="min-h-screen px-4 pt-12 pb-20 md:px-6 md:pt-20 md:pb-24">
      <div className="max-w-6xl mx-auto space-y-12 md:space-y-16">
        {/* Hero Section */}
        <section aria-labelledby="hero-heading" className="max-w-3xl mx-auto">
          <Card className="p-6 md:p-12">
            <div className="text-center">
              <h1
                id="hero-heading"
                className="text-3xl md:text-5xl font-bold tracking-wider leading-tight mb-4 md:mb-6"
                style={{ letterSpacing: "0.1em" }}
              >
                <span aria-hidden="true">{">"} </span>
                <span>Track. Lift. Grow.</span>
                <BlinkingCursor />
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 leading-relaxed">
                The simplest workout tracker
                <br />
                for people who just lift
              </p>

              <Link
                href="/sign-up"
                className="inline-block w-full md:w-auto px-8 md:px-12 py-3 md:py-4 bg-primary text-primary-foreground font-bold text-sm md:text-base tracking-wider hover:opacity-90 active:scale-97 transition-all rounded-md"
                aria-label="Sign up to start tracking workouts"
              >
                Get Started
              </Link>
            </div>
          </Card>
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
