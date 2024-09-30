"use client";

import { useEffect, useState, useRef } from "react";

export default function OutfitGenerator({ city }: { city: string }) {
  const [hasFetched, setHasFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading for initial fetch
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading for form submission
  const [items, setItems] = useState<string[]>([]); // Array of strings for split items
  const [selectedItems, setSelectedItems] = useState<string[]>([]); // State for selected items
  const [generatedOutfit, setGeneratedOutfit] = useState<string | null>(null); // Store the generated outfit text
  const [imageUrl, setImageUrl] = useState<string | null>(null); // Store the generated image URL

  const sectionRef = useRef<HTMLDivElement | null>(null);

  // Simple fetch function to get comparison data
  const fetchData = async (url: string) => {
    try {
      const response = await fetch(url);
      
      if (response.ok) {
        return await response.json();
      } else {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        throw new Error(`Failed to fetch: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('API call failed:', error);
      throw new Error('Failed to fetch data from API');
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasFetched && city) {
          const fetchDataAsync = async () => {
            setIsLoading(true);

            const query = `This is the specific fashion item (clothing, bag, accessory) that is trending in ${city}:`;
            const data = await fetchData(`/api/perform-rag?type=outfit&query=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}`);
            console.log("data: ", data);

            const splitItems = data.summary.split(',').map((item: string) => item.trim());
            console.log(splitItems);    
            setItems(splitItems);

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

  // Handle checkbox change
  const handleCheckboxChange = (item: string) => {
    setSelectedItems((prevSelectedItems) =>
      prevSelectedItems.includes(item)
        ? prevSelectedItems.filter((i) => i !== item) // Remove if already selected
        : [...prevSelectedItems, item] // Add if not selected
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedItemsString = selectedItems.join('. ') + '.';
    console.log("Selected items as a string: ", selectedItemsString);
    
    setIsSubmitting(true); // Start spinner in the right section

    try {
      const response = await fetch('/api/generate-outfit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedItems: selectedItemsString }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Generated outfit:', data);
        setGeneratedOutfit(data.outfit);
        setImageUrl(data.imageUrl); // Store the image URL from the response
      } else {
        console.error('Failed to generate outfit');
      }
    } catch (error) {
      console.error('Error submitting the form:', error);
    } finally {
      setIsSubmitting(false); // Stop spinner once data is received
    }
  };

  return (
    <section ref={sectionRef} className="snap-start w-full h-screen bg-customWhite flex justify-between items-center relative">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-black"></div>
        </div>
      ) : (
        <>
          {/* Left Side: Form */}
          <div className="w-1/2 h-full flex flex-col items-start justify-center pl-24 p-10">
            <h1 className="text-4xl mb-8">Outfit Generator</h1>
            <h2 className="text-2xl mb-8">Generate an outfit based on the most trendy pieces in your city!</h2>
            <form onSubmit={handleSubmit} className="text-lg w-full">
              <div>
                {items.map((item, index) => (
                  <div key={index} className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id={`item-${index}`}
                      value={item}
                      onChange={() => handleCheckboxChange(item)}
                      className="mr-3 appearance-none h-5 w-5 border border-gray-300 rounded-sm bg-white checked:bg-gray-600 checked:border-transparent focus:outline-none transition duration-200 cursor-pointer"
                    />
                    <label htmlFor={`item-${index}`} className="text-xl cursor-pointer font-roboto">
                      {item}
                    </label>
                  </div>
                ))}
              </div>
              <button
                type="submit"
                className="bg-gray-300 p-2 rounded-md flex items-center justify-center mt-4 hover:bg-gray-400 transition duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </button>
            </form>
          </div>

          {/* Right Side: Display generated outfit and image */}
          <div className="w-1/2 h-full flex flex-col items-center justify-center p-10">
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black"></div>
            ) : (
              <>
                {generatedOutfit && (
                  <div className="text-xl mb-4 text-center font-roboto">
                    <p>{generatedOutfit}</p>
                  </div>
                )}
                {imageUrl && (
                  <div className="flex flex-col items-center">
                    <img src={imageUrl} alt="Generated Outfit" className="rounded-md shadow-md" />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}

