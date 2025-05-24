import { NextRequest, NextResponse } from "next/server";
import { getGeminiResponse } from "../models/gemini";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { messages, chatId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required and must be an array" },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "No user message found" },
        { status: 400 }
      );
    }

    // Always use Gemini model
    const response = await getGeminiResponse(messages);
    
    // If chatId is provided, store the interaction in the database
    if (chatId) {
      // Ensure chat exists
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
      });
      
      if (chat) {
        // Store the message in the database
        await prisma.message.create({
          data: {
            question: lastUserMessage.content,
            answer: response.message.content,
            chatId: chatId,
          },
        });
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}