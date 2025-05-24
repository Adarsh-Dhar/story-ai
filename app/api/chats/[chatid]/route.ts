import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockChatOperations } from "@/lib/mock-data";

interface ChatParams {
  params: {
    chatid: string;
  };
}

export async function GET(req: NextRequest, { params }: ChatParams) {
  try {
    const { chatid } = params;

    try {
      // Try to get chat from database
      const chat = await prisma.chat.findUnique({
        where: {
          id: chatid,
        },
        include: {
          messages: true,
        },
      });

      if (chat) {
        return NextResponse.json(chat);
      }
    } catch (dbError) {
      console.warn('Database error, falling back to mock data:', dbError);
    }
    
    // If database operation failed or chat not found, try mock data
    const mockChat = mockChatOperations.getChat(chatid);
    
    if (!mockChat) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }
    
    // Get messages for this chat from mock data
    const mockMessages = mockChatOperations.getAllChats();
    
    return NextResponse.json({
      ...mockChat,
      messages: mockMessages,
    });
  } catch (error) {
    console.error(`Error fetching chat ${params.chatid}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: ChatParams) {
  try {
    const { chatid } = params;
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const updatedChat = await prisma.chat.update({
      where: {
        id: chatid,
      },
      data: {
        title,
      },
    });

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error(`Error updating chat ${params.chatid}:`, error);
    return NextResponse.json(
      { error: "Failed to update chat" },
      { status: 500 }
    );
  }
}

// Add PATCH method to support renaming chats from the frontend
export async function PATCH(req: NextRequest, { params }: ChatParams) {
  try {
    // Extract and validate chatid
    const { chatid } = params;
    console.log('PATCH request received for chat with ID:', chatid);
    
    if (!chatid) {
      console.error('chatid is undefined in PATCH request');
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body:', requestBody);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    
    const { title } = requestBody;
    console.log('Attempting to update chat title to:', title);

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }
    
    let updatedChat;
    
    try {
      // Check if chat exists before updating
      const existingChat = await prisma.chat.findUnique({
        where: {
          id: chatid,
        },
      });
      
      if (existingChat) {
        // Update the chat in the database
        updatedChat = await prisma.chat.update({
          where: {
            id: chatid,
          },
          data: {
            title,
          },
        });
        
        console.log('Chat updated successfully in database:', updatedChat);
        return NextResponse.json(updatedChat);
      }
    } catch (dbError) {
      console.warn('Database error, falling back to mock data:', dbError);
    }
    
    // If database operation failed or chat not found, try mock data
    try {
      // Check if chat exists in mock data
      const mockChat = mockChatOperations.getChat(chatid);
      
      if (!mockChat) {
        console.error(`Chat with ID ${chatid} not found in mock data`);
        return NextResponse.json(
          { error: "Chat not found" },
          { status: 404 }
        );
      }
      
      // Update the chat in mock data
      const updatedMockChat = mockChatOperations.updateChat(chatid, title);
      console.log('Chat updated successfully in mock data:', updatedMockChat);
      return NextResponse.json(updatedMockChat);
    } catch (mockError) {
      const mockErrorMessage = mockError instanceof Error ? mockError.message : 'Unknown mock error';
      console.error(`Error updating chat in mock data:`, mockErrorMessage);
      return NextResponse.json(
        { error: `Failed to update chat: ${mockErrorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error updating chat ${params?.chatid} with PATCH:`, error);
    return NextResponse.json(
      { error: `Failed to update chat: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: ChatParams) {
  try {
    const { chatid } = params;
    
    try {
      // First try to delete from database
      // Delete all messages associated with the chat
      await prisma.message.deleteMany({
        where: {
          chatId: chatid,
        },
      });

      // Then delete the chat
      await prisma.chat.delete({
        where: {
          id: chatid,
        },
      });
      
      console.log(`Chat ${chatid} successfully deleted from database`);
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.warn('Database error, falling back to mock data:', dbError);
    }
    
    // If database operation failed, try mock data
    try {
      // Check if chat exists in mock data
      const mockChat = mockChatOperations.getChat(chatid);
      
      if (!mockChat) {
        console.error(`Chat with ID ${chatid} not found in mock data`);
        return NextResponse.json(
          { error: "Chat not found" },
          { status: 404 }
        );
      }
      
      // Delete the chat from mock data
      const deleted = mockChatOperations.deleteChat(chatid);
      
      if (deleted) {
        console.log(`Chat ${chatid} successfully deleted from mock data`);
        return NextResponse.json({ success: true });
      } else {
        console.error(`Failed to delete chat ${chatid} from mock data`);
        return NextResponse.json(
          { error: "Failed to delete chat from mock data" },
          { status: 500 }
        );
      }
    } catch (mockError) {
      const mockErrorMessage = mockError instanceof Error ? mockError.message : 'Unknown mock error';
      console.error(`Error deleting chat from mock data:`, mockErrorMessage);
      return NextResponse.json(
        { error: `Failed to delete chat: ${mockErrorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error deleting chat ${params?.chatid}:`, error);
    return NextResponse.json(
      { error: `Failed to delete chat: ${errorMessage}` },
      { status: 500 }
    );
  }
}