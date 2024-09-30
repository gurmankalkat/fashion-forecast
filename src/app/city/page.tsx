"use client";

import { motion } from "framer-motion";
import TldrSection from "./tldr";
import CompareSection from "./compare";
import OutfitSection from "./getOutfit";
import { Suspense } from "react";

export default function Forecast() {

  return (
    <div className="snap-y snap-mandatory h-screen overflow-y-scroll">
      {/* Intro */}
      <section className="snap-start h-screen flex items-center justify-center bg-customWhite">
        <motion.h1
          className="text-4xl text-center p-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          Discover fashion inspiration from emerging trends, using insights from runway shows, seasonal changes, and consumer preferences.
        </motion.h1>
      </section>

      {/* Wrap your sections in Suspense */}
      <Suspense fallback={<div>Loading...</div>}>
        <TldrSection />
        <OutfitSection />
        <CompareSection />
      </Suspense>
    </div>
  );
}
