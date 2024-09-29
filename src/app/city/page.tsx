"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion"; 

export default function Forecast() {
  const searchParams = useSearchParams();
  const city = searchParams.get("city");
  const tldrRef = useRef(null); // Reference to the TLDR section
  const [hasFetched, setHasFetched] = useState(false); // Track if data has been fetched
  const [isLoading, setIsLoading] = useState(true); // Global loading state
  const [tldrResults, setTldrResults] = useState<string[]>([]); // Store TLDR results as an array of sentences
  const [imageUrls, setImageUrls] = useState<string[]>([]); // Store the DALL·E image URLs
  const [currentIndex, setCurrentIndex] = useState<number>(0); // Track the current visible sentence index

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasFetched) {
          // Fetch TLDR results and images from the API
          const fetchData = async () => {
            if (city) {
              setIsLoading(true); // Set loading to true before starting the fetch
              
              const query = `Here are what people are wearing in ${city}, influenced by celebrities, social media, fashion events, and runway shows.`;
              const response = await fetch(`/api/perform-rag?type=tldr&query=${encodeURIComponent(query)}`);
              const data = await response.json();
              console.log("data: ", data);

              if (data.summary) {
                const sentences = data.summary.split(/[.!?]\s/).filter(Boolean).map((sentence: string) => {
                  return sentence.trim().endsWith('.') ? sentence : sentence + '.';
                });
                setTldrResults(sentences);
              } else {
                console.error('No TLDR result found in the response');
              }

              if (data.imageUrls && data.imageUrls.length > 0) {
                setImageUrls(data.imageUrls); // Set generated image URLs
              } else {
                setImageUrls(["Unable to generate images"]); // Fallback message if no images generated
              }

              setIsLoading(false); // Set loading to false after everything is fetched
              setHasFetched(true); // Ensure we only fetch once
            }
          };
          fetchData();
        }
      },
      { threshold: 0.5 } // Trigger when 50% of the section is visible
    );

    if (tldrRef.current) {
      observer.observe(tldrRef.current);
    }

    return () => {
      if (tldrRef.current) {
        observer.unobserve(tldrRef.current);
      }
    };
  }, [city, hasFetched]);

  const handleNext = () => {
    if (currentIndex < tldrResults.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

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

      {/* TLDR Section with Button-Based Slide Transition */}
      <section ref={tldrRef} className="snap-start w-full h-screen bg-black grid grid-cols-2 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Spinner centered between sections */}
            <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-white"></div>
          </div>
        ) : (
          <>
            {/* Left Side */}
            <div className="h-full flex flex-col items-center justify-center p-10 relative">
              <div className="text-2xl text-center text-white">
                {tldrResults[currentIndex]}
              </div>

              <div className="absolute bottom-8 flex space-x-4">
                {currentIndex > 0 && (
                  <button onClick={handlePrev} className="bg-gray-300 p-2 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                      <path fillRule="evenodd" d="M14 8a.75.75 0 0 1-.75.75H4.56l1.22 1.22a.75.75 0 1 1-1.06 1.06l-2.5-2.5a.75.75 0 0 1 0-1.06l2.5-2.5a.75.75 0 0 1 1.06 1.06L4.56 7.25h8.69A.75.75 0 0 1 14 8Z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                {currentIndex < tldrResults.length - 1 && (
                  <button onClick={handleNext} className="bg-gray-300 p-2 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                      <path fillRule="evenodd" d="M2 8c0 .414.336.75.75.75h8.69l-1.22 1.22a.75.75 0 1 0 1.06 1.06l2.5-2.5a.75.75 0 0 0 0-1.06l-2.5-2.5a.75.75 0 1 0-1.06 1.06l1.22 1.22H2.75A.75.75 0 0 0 2 8Z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Right Side: Generated AI Visuals from DALL·E */}
            <div className="h-full w-full flex items-center justify-center bg-black">
              {imageUrls[currentIndex] === "Unable to generate images" || !imageUrls[currentIndex] ? (
                <p className="text-white text-2xl">Unable to generate images.</p>
              ) : (
                <img
                  src={imageUrls[currentIndex]}
                  alt={`AI Visual ${currentIndex + 1}`}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

          </>
        )}
      </section>
    </div>
  );
}
