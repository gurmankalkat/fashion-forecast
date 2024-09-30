// Forecast.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import TldrSection from "./tldr"; 
import CompareSection from "./compare"; 
import OutfitSection from "./getOutfit";

export default function Forecast() {
  const searchParams = useSearchParams();
  const city = searchParams.get("city");

  return (
    <div className="snap-y snap-mandatory h-screen overflow-y-scroll">
      {/* Intro */}
      <section className="snap-start h-screen flex items-center justify-center bg-customWhite">
        <motion.h1
          className="text-2xl text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          Discover fashion inspiration from emerging trends, using insights from runway shows, seasonal changes, and consumer preferences.
        </motion.h1>
      </section>
      <TldrSection city={city || ''} /> 
      <OutfitSection city={city || ''} /> 
      <CompareSection city={city || ''} /> 
    </div>
  );
}
