import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate GPT response and image generation for outfit
async function generateOutfitAndImage(selectedItems: string) {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: "You are a fashion expert. Based on the selected items, generate a stylish outfit recommendation.",
        },
        {
          role: 'user',
          content: `Here are the selected items: ${selectedItems}. Based on these items, what outfit would you recommend?`,
        }
      ],
    });
  
    const generatedOutfit = response.choices[0]?.message?.content || 'Unable to generate outfit';
  
    // Generate an image based on the outfit recommendation
    const dalleResponse = await openai.images.generate({
      prompt: `Fashionable outfit based on these items: ${selectedItems}`,
      n: 1,
      size: "512x512",
    });
  
    const imageUrl = dalleResponse.data[0]?.url || '';
  
    return { outfit: generatedOutfit, imageUrl };
  }
  
  export async function POST(req: NextRequest) {
    try {
      const { selectedItems } = await req.json();
  
      if (!selectedItems) {
        return NextResponse.json({ error: 'No items provided.' }, { status: 400 });
      }
  
      const result = await generateOutfitAndImage(selectedItems);
  
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: 'Failed to generate outfit and image', details: error.message }, { status: 500 });
      } else {
        return NextResponse.json({ error: 'Failed to generate outfit and image', details: 'An unknown error occurred' }, { status: 500 });
      }
    }
  }
