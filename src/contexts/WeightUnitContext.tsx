"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type WeightUnit = "lbs" | "kg";

interface WeightUnitContextType {
  unit: WeightUnit;
  toggleUnit: () => void;
}

const WeightUnitContext = createContext<WeightUnitContextType | undefined>(undefined);

export function WeightUnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnit] = useState<WeightUnit>("lbs");

  // Load preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("weightUnit");
    if (stored === "kg" || stored === "lbs") {
      setUnit(stored);
    }
  }, []);

  const toggleUnit = () => {
    setUnit((prev) => {
      const next = prev === "lbs" ? "kg" : "lbs";
      localStorage.setItem("weightUnit", next);
      return next;
    });
  };

  return (
    <WeightUnitContext.Provider value={{ unit, toggleUnit }}>
      {children}
    </WeightUnitContext.Provider>
  );
}

export function useWeightUnit() {
  const context = useContext(WeightUnitContext);
  if (!context) {
    throw new Error("useWeightUnit must be used within WeightUnitProvider");
  }
  return context;
}
