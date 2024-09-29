"use client";

import { useEffect, useState, useRef } from "react";

export default function TrendComparison({ city }: { city: string }) {
  const [hasFetched, setHasFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [comparison, setComparison] = useState<string>(""); // Single string for trends comparison
  const [imageUrl, setImageUrl] = useState<string>("");

  const sectionRef = useRef<HTMLDivElement | null>(null);

  // Function for retry logic in case of rate limits
  const fetchWithRetry = async (url: string, retries = 5, delay = 1000) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      } else if (response.status === 429 && retries > 0) {
        console.log("Rate limit hit!")
        // Rate limit hit, retry after a delay
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, retries - 1, delay * 2); // Exponential backoff
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
          const fetchData = async () => {
            setIsLoading(true);

            const query = `This is the biggest difference in fashion in ${city} today versus 5 years ago:`;
            const data = await fetchWithRetry(`/api/perform-rag?type=compare&query=${encodeURIComponent(query)}`);
            console.log("Comparison data: ", data);

            // Set comparison result
            setComparison(data.summary || "Unable to generate comparison.");

            // Set image
            setImageUrl(data.imageUrls || "Unable to generate image");
            // console.log("imageUrl: ", imageUrl);

            setIsLoading(false);
            setHasFetched(true);
          };

          fetchData();
        }
      },
      { threshold: 1.0 } // Trigger when 50% of the section is visible
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
    <section ref={sectionRef} className="snap-start w-full h-screen bg-black grid grid-cols-2 relative">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-white"></div>
        </div>
      ) : (
        <>
          {/* Left Side: Current Fashion Trends with AI Visuals */}
          <div className="h-full w-full flex items-center justify-center p-10 bg-black">
            <div className="mt-6">
              {imageUrl === "Unable to generate image" ? (
                <p className="text-white text-2xl">Unable to generate image.</p>
              ) : (
                <img
                  src={imageUrl}
                  alt="Comparison of current and historical fashion trends"
                  className="h-64 w-full object-cover mt-4"
                />
              )}
            </div>
          </div>

          {/* Right Side: Trends Comparison */}
          <div className="h-full flex flex-col items-center justify-center p-10 relative">
            <h2 className="text-3xl text-center text-white mb-4">Today's Looks vs. Yesterday's Iconic Trends</h2>
            <div className="text-xl text-center text-white">
              <p>{comparison}</p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
