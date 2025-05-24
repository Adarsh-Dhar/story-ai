import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGeminiResponse } from "@/app/api/models/gemini";
import { getDeepseekResponse } from "@/app/api/models/deepseek";
import { mockChatOperations, mockMessageOperations } from "@/lib/mock-data";
import { Message } from "@/types/chat";

interface MessageParams {
  params: {
    chatId: string;
  };
}

export async function GET(req: NextRequest, { params }: MessageParams) {
  try {
    const { chatId } = params;

    try {
      // Try to get messages from database
      const messages = await prisma.message.findMany({
        where: {
          chatId,
        },
        orderBy: {
          id: "asc",
        },
      });
      
      // If we successfully retrieved messages from the database, return them
      return NextResponse.json(messages);
    } catch (dbError) {
      console.warn(`Database error when fetching messages for chat ${chatId}, falling back to mock data:`, dbError);
    }
    
    // If database operation failed, try mock data
    try {
      // Get messages from mock data
      const mockMessages = mockChatOperations.getMessages(chatId);
      console.log(`Retrieved ${mockMessages.length} mock messages for chat ${chatId}`);
      return NextResponse.json(mockMessages);
    } catch (mockError) {
      console.error(`Error fetching mock messages for chat ${chatId}:`, mockError);
      return NextResponse.json(
        { error: "Failed to fetch messages from mock data" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`Error fetching messages for chat ${params.chatId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: MessageParams) {
  try {
    const { chatId } = params;
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    
    const { question, model = 'gemini' } = requestBody;
    
    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }
    
    let chatExists = false;
    let previousMessages: any[] = [];
    
    try {
      // Check if chat exists in database
      const chat = await prisma.chat.findUnique({
        where: {
          id: chatId,
        },
      });
      
      if (chat) {
        chatExists = true;
        
        // Get previous messages from database
        previousMessages = await prisma.message.findMany({
          where: { chatId },
          orderBy: { id: 'asc' },
        });
      }
    } catch (dbError) {
      console.warn('Database error when checking chat existence, falling back to mock data:', dbError);
    }
    
    // If not found in database, check mock data
    if (!chatExists) {
      const mockChat = mockChatOperations.getChat(chatId);
      
      if (!mockChat) {
        return NextResponse.json(
          { error: "Chat not found" },
          { status: 404 }
        );
      }
      chatExists = true;
      
      // Get previous messages from mock data
      previousMessages = mockChatOperations.getMessages(chatId);
    }
    
    // Format messages for AI model
    const formattedMessages: Message[] = [
      ...previousMessages.flatMap((msg: any) => [
        { role: 'user' as const, content: msg.question },
        { role: 'assistant' as const, content: msg.answer }
      ]),
      { role: 'user' as const, content: question }
    ];

    // Get response from selected AI model
    let aiResponse;
    try {
      if (model === 'deepseek') {
        aiResponse = await getDeepseekResponse(formattedMessages);
      } else {
        // Default to Gemini
        aiResponse = await getGeminiResponse(formattedMessages);
      }
    } catch (error) {
      const aiError = error as Error;
      console.error(`Error getting AI response from ${model} model:`, aiError);
      return NextResponse.json(
        { error: `Error getting AI response: ${aiError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }
    
    if (!aiResponse || !aiResponse.message || !aiResponse.message.content) {
      console.error('Invalid AI response format:', aiResponse);
      return NextResponse.json(
        { error: "Invalid AI response format" },
        { status: 500 }
      );
    }
    
    const answer = aiResponse.message.content;

    // Try to save message to database
    try {
      const message = await prisma.message.create({
        data: {
          question,
          answer,
          chatId,
        },
      });
      
      // If this is the first message, update the chat title
      if (previousMessages.length === 0) {
        const title = question.length > 30 
          ? question.slice(0, 30) + '...' 
          : question;
        
        try {  
          await prisma.chat.update({
            where: { id: chatId },
            data: { title },
          });
        } catch (titleError) {
          // Non-critical error, just log it
          console.error('Error updating chat title:', titleError);
        }
      }
      
      console.log('Message created successfully in database');
      return NextResponse.json({
        id: message.id,
        question,
        answer,
        chatId,
      });
    } catch (dbError) {
      console.warn('Database error when creating message, falling back to mock data:', dbError);
      
      // If database operation failed, use mock data
      try {
        // Use mockMessageOperations to create a message
        const mockMessage = mockMessageOperations.createMessage(chatId, question, answer);
        
        // If this is the first message, update the chat title in mock data
        if (previousMessages.length === 0) {
          const title = question.length > 30 
            ? question.slice(0, 30) + '...' 
            : question;
          
          try {  
            mockChatOperations.updateChat(chatId, title);
          } catch (titleError) {
            // Non-critical error, just log it
            console.error('Error updating mock chat title:', titleError);
          }
        }
        
        console.log('Message created successfully in mock data');
        return NextResponse.json({
          id: mockMessage.id,
          question,
          answer,
          chatId,
        });
      } catch (mockError) {
        console.error('Error creating message in mock data:', mockError);
        return NextResponse.json(
          { error: `Failed to create message in mock data: ${mockError instanceof Error ? mockError.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error(`Error creating message for chat ${params.chatId}:`, error);
    return NextResponse.json(
      { error: `Failed to create message: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}