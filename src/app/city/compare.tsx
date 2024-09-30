"use client";

import { useEffect, useState, useRef } from "react";

export default function TrendComparison({ city }: { city: string }) {
  const [hasFetched, setHasFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [comparison, setComparison] = useState<string>(""); // Single string for trends comparison

  const sectionRef = useRef<HTMLDivElement | null>(null);

  // Simple fetch function to get comparison data
  const fetchData = async (url: string) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasFetched && city) {
          const fetchDataAsync = async () => {
            setIsLoading(true);

            const query = `This is the biggest difference in fashion in ${city} today versus 5 years ago:`;
            const data = await fetchData(`/api/perform-rag?type=compare&query=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}`);

            // Set comparison result
            setComparison(data.summary || "Unable to generate comparison.");

            setIsLoading(false);
            setHasFetched(true);
          };

          fetchDataAsync();
        }
      },
      { threshold: 1.0 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [city, hasFetched]);

  return (
    <section ref={sectionRef} className="snap-start w-full h-screen bg-black flex items-center justify-center relative">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-white"></div>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-10 relative">
          <h2 className="text-3xl text-center text-white mb-4">Today's Looks vs. Yesterday's Iconic Trends</h2>
          <div className="text-xl text-center text-white">
            <p>{comparison}</p>
          </div>
        </div>
      )}
    </section>
  );
}
