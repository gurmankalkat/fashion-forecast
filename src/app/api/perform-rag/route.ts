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

// Helper function for image generation
async function generateImage(prompt: string, numImages: number, imageSize: string = '512x512'): Promise<string[]> {
  let imageUrls: string[] = [];

  try {
    if (prompt.length > 1000) {
      prompt = prompt.slice(0, 980) + "...";
    }

    const dalleResponse = await openai.images.generate({
      prompt: prompt,
      n: numImages,
      size: imageSize as "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792",
    });

    imageUrls = dalleResponse.data.map((img) => img.url ?? '');
  } catch (error) {
    console.error('DALL·E Image Generation Error:', error);
    imageUrls = ["Unable to generate images"];
  }

  return imageUrls;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryType = searchParams.get('type'); 
    const query = searchParams.get('query');
    const city = searchParams.get('city');
    console.log("city in route.ts: ", city);

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

    if (queryType === 'tldr' || queryType === 'buy') {
      exaFilters.startPublishedDate = getSixMonthsAgoDate();
    } 

    // Perform Exa search
    const exaResult = await exa.searchAndContents(query, exaFilters);

    // Handle TLDR or comparison request
    if (queryType === 'tldr' || queryType === 'compare') {
      let systemPrompt = "";
      let userMessage = "";

      if (queryType === 'tldr') {
        systemPrompt = `You are a fashion stylist focusing on fashion trends. Summarize the top fashion trends in ${city} from the given search results in a 4-sentence paragraph where each sentence contains max 20 words. Ignore info about cities that are not ${city}. Do not use bullet points or numbers like (1, 2, 3...) to split the sentences.`;
        userMessage = "Please provide a brief summary of the top fashion trends.";
      } else if (queryType === 'compare') {
        systemPrompt = `You are a fashion researcher. Compare current fashion trends with historical fashion trends. Provide a concise paragraph explaining the differences and similarities.`;
        userMessage = "Please provide a comparison between current and historical fashion trends.";
      }

      // Pass the Exa results as a message to OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Search results: ${JSON.stringify(exaResult.results.map(r => r.text))}\n\n${userMessage}` }
        ]
      });

      if (response.choices?.[0]?.message?.content) {
        const summary = response.choices[0].message.content;

        // Ask GPT to remove any sentences that would be inappropriate for image generation
        const filterPrompt = "Please remove any word, names, and sentences from the following text that would not be appropriate or make it impossible to generate an image. For instance, remove explicit content, celebrity names, or anything inappropriate for a fashion image.";

        const filteredResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: "You are an AI expert tasked with filtering text for DALLE image generation." },
            { role: 'user', content: `${filterPrompt}\n\n${summary}` }
          ]
        });

        if (filteredResponse.choices?.[0]?.message?.content) {
          const result = filteredResponse.choices[0].message.content;

          if (queryType === 'tldr') {
            // Use the helper function to generate images
            const imageUrls = await generateImage(`You are a fashion stylist showcasing images of outfits. Only show clothing articles, fabrics, & accessories. No faces. ${result}`, summary.split(/[.!?]\s/).filter(Boolean).length, '512x512');

            return NextResponse.json({ summary, imageUrls }, { status: 200 });
          } else {
            // Generate a bar graph for comparison
            const imageUrls = await generateImage(`Generate a bar graph like the one in (https://www150.statcan.gc.ca/n1/edu/power-pouvoir/ch9/bargraph-diagrammeabarres/5214818-eng.htm) that displays ${result}`, 1, '1024x1024');

            return NextResponse.json({ summary, imageUrls }, { status: 200 });
          }
        } else {
          return NextResponse.json({ error: 'Failed to filter sentences.' }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: 'Failed to generate TLDR.' }, { status: 500 });
      }
    } else {
      const systemPrompt = "You are an expert that knows the best clothing stores to shop for current fashion trends. Write 4 short sentences about 4 different stores and include links to their website.";
      const userMessage = "Please provide a list of the top clothing stores.";

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Search results: ${JSON.stringify(exaResult.results.map(r => r.text))}\n\n${userMessage}` }
        ]
      });

      if (response.choices && response.choices.length > 0) {
        const gptResponse = response.choices[0].message.content;
        return NextResponse.json({ message: gptResponse }, { status: 200 });
      } else {
        return NextResponse.json({ error: 'No response from GPT' }, { status: 500 });
      }
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to perform operation', details: error.message }, { status: 500 });
  }
}
