'use client';

import { useState } from "react";
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [city, setCity] = useState("");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCity(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && city.trim()) {
      // Navigate to the city page and pass the city typed as a query parameter
      router.push(`/city?city=${encodeURIComponent(city)}`);
    }
  };

  return (
    <div className="relative w-full h-screen">
      <Image
        src="/images/cover.jpg"
        alt="Fashion Forecast"
        layout="fill"
        objectFit="cover"
        objectPosition="top"
        priority={true}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
        <h1 className="text-white text-7xl">Fashion Forecast</h1>
        <input
          type="text"
          placeholder="Enter a city"
          className="px-4 py-2 rounded-md text-center text-black placeholder-gray-500 w-80 font-roboto"
          value={city}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress} // Trigger navigation when Enter key pressed
        />
      </div>
    </div>
  );
}
