import { GoogleGenAI } from "@google/genai";
import { Message, Participant } from "../types";

// Initialize the API client
// Note: In a real environment, ensure process.env.API_KEY is set.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

/**
 * Helper to generate content with retry logic for rate limits (429) and transient server errors (5xx).
 */
async function generateWithRetry(model: string, prompt: string, retries = 0): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.8,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }
    return text.trim();

  } catch (error: any) {
    // Check for specific error codes or status
    // The error object structure depends on the SDK, but usually has 'status' or 'code'
    const status = error.status || error.code;
    
    if (retries < MAX_RETRIES && (status === 429 || status === 500 || status === 503 || String(status).includes('RESOURCE_EXHAUSTED'))) {
      console.warn(`Attempt ${retries + 1} failed with ${status}. Retrying in ${BASE_DELAY_MS * Math.pow(2, retries)}ms...`);
      await new Promise(resolve => setTimeout(resolve, BASE_DELAY_MS * Math.pow(2, retries)));
      return generateWithRetry(model, prompt, retries + 1);
    }
    throw error;
  }
}

/**
 * Generates a reply for a specific bot based on the conversation history.
 */
export const generateBotReply = async (
  bot: Participant,
  participants: Participant[],
  messages: Message[]
): Promise<string> => {
  if (bot.isUser) {
    throw new Error("Cannot generate reply for a user participant.");
  }

  // 1. Construct the context for the model
  // We format the history as a script so the model understands the flow.
  // We only take the last 20 messages to keep context relevant and within token limits.
  const recentMessages = messages.slice(-20);
  
  let conversationHistory = "";
  recentMessages.forEach((msg) => {
    const sender = participants.find((p) => p.id === msg.senderId);
    const senderName = sender ? sender.name : "Unknown";
    conversationHistory += `${senderName}: ${msg.content}\n`;
  });

  // 2. Build the specific prompt for this bot
  const prompt = `
You are participating in a group chat.
Your name is: ${bot.name}
Your persona/instruction is: ${bot.systemInstruction || "You are a helpful assistant."}

The current conversation history is:
---
${conversationHistory}
---

Please provide your response to the conversation as ${bot.name}. 
Do not prefix your response with your name (e.g. "Name: ..."), just provide the message content directly.
Keep your response concise and conversational, suitable for a group chat setting.
IMPORTANT: Respond in Simplified Chinese (简体中文).
`;

  // 3. Call the API with retry wrapper
  try {
    return await generateWithRetry('gemini-3-flash-preview', prompt);
  } catch (error) {
    console.error(`Error generating reply for ${bot.name}:`, error);
    // Return null or empty string to indicate failure to the caller, or throw
    throw error; 
  }
};
