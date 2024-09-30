"use client";

import { useEffect, useState, useRef } from "react";
import Image from 'next/image';

export default function TldrSection({ city }: { city: string }) {
  const tldrRef = useRef(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tldrResults, setTldrResults] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasFetched) {
          const fetchData = async () => {
            if (city) {
              setIsLoading(true);
              const query = `Here are what people are wearing in ${city}, influenced by fashion news, celebrities, social media, fashion events, and runway shows:`;
              const response = await fetch(`/api/perform-rag?type=tldr&query=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}`);
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
                setImageUrls(data.imageUrls);
              } else {
                setImageUrls(["Unable to generate images"]);
              }

              setIsLoading(false);
              setHasFetched(true);
            }
          };
          fetchData();
        }
      },
      { threshold: 0.5 }
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
    <section ref={tldrRef} className="snap-start w-full h-screen bg-customWhite grid grid-cols-2 relative">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-black"></div>
        </div>
      ) : (
        <>
          <div className="h-full flex flex-col items-center justify-center p-10 relative">
            <h2 className="text-4xl text-center mb-4">Current Trends & News</h2>
            <div className="text-2xl text-center font-roboto">
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

          <div className="h-full w-full flex items-center justify-center bg-customWhite">
            {imageUrls[currentIndex] === "Unable to generate images" || !imageUrls[currentIndex] ? (
              <h4 className="text-2xl text-center p-10 font-roboto">Unable to generate images. This is either because we are only able to generate 5 images/min or there was a violation of OpenAI's safety system, as all fashion trends do not comply. Try again with another city. Sorry!</h4>
            ) : (
              <Image
                src={imageUrls[currentIndex]} 
                alt={`AI Visual ${currentIndex + 1}`} 
                className="object-cover"
                width={500} // Add the appropriate width (adjust as needed)
                height={500} // Add the appropriate height (adjust as needed)
                layout="responsive" // This helps maintain the aspect ratio with dynamic size
              />
            )}
          </div>
        </>
      )}
    </section>
  );
}