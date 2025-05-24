import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockChatOperations } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  try {
    try {
      // Try to get chats from database
      const chats = await prisma.chat.findMany({
        include: {
          messages: true,
        },
        orderBy: {
          id: 'desc',
        },
      });
      
      // If we successfully retrieved chats from the database, return them
      return NextResponse.json(chats);
    } catch (dbError) {
      console.warn('Database error when fetching chats, falling back to mock data:', dbError);
    }
    
    // If database operation failed, try mock data
    try {
      // Get chats from mock data
      const mockChats = mockChatOperations.getAllChats();
      console.log(`Retrieved ${mockChats.length} mock chats`);
      
      // For each chat, get its messages
      const chatsWithMessages = mockChats.map(chat => {
        const messages = mockChatOperations.getMessages(chat.id);
        return {
          ...chat,
          messages,
        };
      });
      
      return NextResponse.json(chatsWithMessages);
    } catch (mockError) {
      console.error('Error fetching mock chats:', mockError);
      return NextResponse.json(
        { error: "Failed to fetch chats from mock data" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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
    
    const { title } = requestBody;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    try {
      // Try to create chat in database
      const chat = await prisma.chat.create({
        data: {
          title,
        },
      });
      
      console.log('Chat created successfully in database:', chat);
      return NextResponse.json(chat);
    } catch (dbError) {
      console.warn('Database error when creating chat, falling back to mock data:', dbError);
      
      // If database operation failed, use mock data
      try {
        // Create chat in mock data
        const mockChat = mockChatOperations.createChat(title);
        console.log('Chat created successfully in mock data:', mockChat);
        return NextResponse.json(mockChat);
      } catch (mockError) {
        console.error('Error creating chat in mock data:', mockError);
        return NextResponse.json(
          { error: `Failed to create chat in mock data: ${mockError instanceof Error ? mockError.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}