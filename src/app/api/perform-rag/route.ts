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
  return currentDate.toISOString().split('T')[0];
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

// Helper function to generate GPT-3.5 completion
async function generateCompletion(systemPrompt: string, userMessage: string, exaResult: any) {
  return openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Search results: ${JSON.stringify(exaResult.results.map((r: { text: any; }) => r.text))}\n\n${userMessage}` }
    ]
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryType = searchParams.get('type');
    const query = searchParams.get('query');
    const city = searchParams.get('city');
    console.log("Query type: ", queryType);
    console.log("City: ", city);

    if (!query || !queryType) {
      return NextResponse.json({ error: 'Query and type are required.' }, { status: 400 });
    }

    const exaFilters: Record<string, any> = {
      type: 'auto',
      useAutoprompt: true,
      numResults: 10,
      text: true,
    };

    if (queryType === 'tldr' || queryType === 'outfit') {
      exaFilters.startPublishedDate = getSixMonthsAgoDate();
    }

    const exaResult = await exa.searchAndContents(query, exaFilters);

    let systemPrompt = "";
    let userMessage = "";

    // Define prompts for different query types
    if (queryType === 'tldr') {
      systemPrompt = `You are a fashion stylist focusing on fashion trends. Summarize the top fashion trends in ${city} from the given search results in a 4 sentence paragraph. Each sentence should have a maximum of 20 words. Ignore info about cities that are not ${city}. Do not use bullet points or numbers to split sentences.`;
      userMessage = "Please provide a brief summary of the top fashion trends.";
    } else if (queryType === 'compare') {
      systemPrompt = `You are a fashion researcher. Compare current fashion trends with historical fashion trends in ${city}. Provide a concise paragraph explaining the differences and similarities.`;
      userMessage = "Please provide a comparison between current and historical fashion trends.";
    } else if (queryType === 'outfit') {
      systemPrompt = "You are a fashion researcher specializing in trend analysis. Your task is to provide a detailed list of 10 specific trendy clothing items. Avoid general terms and focus on individual items (e.g., 'oversized denim jacket,' 'ribbed knit turtleneck'). Include any relevant materials, colors, or patterns mentioned. Give the list of trending fashion items as a comma-separated string without dashes or bullet points (item 1, item 2, item 3, etc). Do not put a period after the last item.";
      userMessage = "Please provide a list of the top trending clothing items.";
    }

    const response = await generateCompletion(systemPrompt, userMessage, exaResult);

    if (response.choices?.[0]?.message?.content) {
      const summary = response.choices[0].message.content;

      if (queryType === 'tldr') {
        const filterPrompt = "Please remove any word, names, and sentences from the following text that would not be appropriate for fashion image generation.";
        const filteredResponse = await generateCompletion("You are an AI expert tasked with filtering text for DALLE image generation.", filterPrompt, exaResult);

        if (filteredResponse.choices?.[0]?.message?.content) {
          const result = filteredResponse.choices[0].message.content;
          const imageUrls = await generateImage(`You are a fashion expert.
            Your task is to provide detailed and visually appealing outfits based on ${result}. Avoid faces.`, summary.split(/[.!?]\s/).filter(Boolean).length, '512x512');
          return NextResponse.json({ summary, imageUrls }, { status: 200 });
        } else {
          return NextResponse.json({ error: 'Failed to filter sentences.' }, { status: 500 });
        }
      }

      return NextResponse.json({ summary }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Failed to generate response.' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to perform operation', details: error.message }, { status: 500 });
  }
}
