import { NextRequest, NextResponse } from 'next/server';
import Exa from 'exa-js';
import OpenAI from 'openai';

// Initialize Exa and OpenAI clients
const exa = new Exa(process.env.EXA_API_KEY);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to get a date six months ago
function getSixMonthsAgoDate(): string {
  const currentDate = new Date();
  currentDate.setMonth(currentDate.getMonth() - 6);
  return currentDate.toISOString().split('T')[0]; // Return the date in YYYY-MM-DD format
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryType = searchParams.get('type'); 
    const query = searchParams.get('query');

    if (!query || !queryType) {
      return NextResponse.json({ error: 'Query and type are required.' }, { status: 400 });
    }

    // Set Exa filters for TLDR and include the six-month date filter
    const exaFilters: Record<string, any> = {
      type: 'auto',
      useAutoprompt: true,
      numResults: 10,
      text: true,
    };

    if (queryType === 'tldr') {
      exaFilters.startPublishedDate = getSixMonthsAgoDate();
    }

    // Perform Exa search
    const exaResult = await exa.searchAndContents(query, exaFilters);
    console.log('Exa Results:', JSON.stringify(exaResult, null, 2));

    // Only proceed with TLDR request
    if (queryType === 'tldr') {
      const systemPrompt = "You are a fashion trend expert focusing on fashion trends. Summarize the top fashion trends from the given search results in a 5 sentence paragraph. Do not use bullet points or number like (1, 2, 3...) to split the sentences.";
      const userMessage = "Please provide a brief summary of the top fashion trends.";

      // Pass the Exa results as a message to OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Search results: ${JSON.stringify(exaResult.results.map(r => r.text))}\n\n${userMessage}` }
        ]
      });

      if (response.choices?.[0]?.message?.content) {
        let summary = response.choices[0].message.content;

        // Ask GPT to remove any sentences that would be inappropriate for image generation
        const filterPrompt = "Please remove any word, names, and sentences from the following text that would not be appropriate or possible to generate an image of (such as explicit content, abstract ideas, celebrity names or anything inappropriate for a fashion image):";

        const filteredResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: "You are an AI expert tasked with filtering text for DALLE image generation. You generate prompts that are always able to generate an image through DALLE, removing necessary words." },
            { role: 'user', content: `${filterPrompt}\n\n${summary}` }
          ]
        });

        if (filteredResponse.choices?.[0]?.message?.content) {
          const result = filteredResponse.choices[0].message.content;
          console.log('Filtered Results:', result);

          // Now we can use the filtered result to generate images with DALL·E
          try {
            let dallePrompt = `Showcase complete outfits. No faces. ${result}`;
            if (dallePrompt.length > 1000) {
              dallePrompt = dallePrompt.slice(0, 980) + "..."; // Trim to fit within 1000 characters
            }

            const dalleResponse = await openai.images.generate({
              prompt: dallePrompt,
              n: 5, 
              size: '512x512',
            });

            const imageUrls = dalleResponse.data.map((img: any) => img.url);
            return NextResponse.json({ summary, imageUrls }, { status: 200 });
          } catch (dalleError: unknown) {
            console.error('DALL·E Image Generation Error:', dalleError);
            if (dalleError instanceof Error) {
              return NextResponse.json({ error: 'Failed to generate images.', details: dalleError.message }, { status: 500 });
            } else {
              return NextResponse.json({ error: 'Failed to generate images.', details: 'Unknown error occurred' }, { status: 500 });
            }
          }

        } else {
          return NextResponse.json({ error: 'Failed to filter sentences.' }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: 'Failed to generate TLDR.' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid query type.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to perform operation', details: error.message }, { status: 500 });
  }
}
