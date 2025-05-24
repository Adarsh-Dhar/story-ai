import { Chat, Message } from "@/types/chat";

// API hook for all DeFi Copilot API interactions
export const useApi = () => {
  // Fetch all chats
  const fetchChats = async (): Promise<Chat[]> => {
    try {
      const response = await fetch('/api/chats');
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Transform the data to match the Chat type
      return data.map((chat: any) => ({
        id: chat.id,
        title: chat.title,
        model: 'gemini', // Default model
        messages: chat.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.question ? 'user' : 'assistant',
          content: msg.question || msg.answer,
        })),
      }));
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  };

  // Create a new chat
  const createChat = async (title: string): Promise<Chat> => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        title: data.title,
        model: 'gemini',
        messages: [],
      };
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  };

  // Delete a chat
  const deleteChat = async (chatId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  };

  // Rename a chat
  const renameChat = async (chatId: string, title: string): Promise<Chat> => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',  // Using PATCH method as implemented in the API
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        title: data.title,
        model: 'gemini',
        messages: [],
      };
    } catch (error) {
      console.error('Error renaming chat:', error);
      throw error;
    }
  };

  // Send a message and get a response
  const sendMessage = async (chatId: string, question: string): Promise<{ question: string; answer: string }> => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, model: 'gemini' }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Get messages for a chat
  const getChatMessages = async (chatId: string): Promise<Message[]> => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform the data to match the Message type
      const messages: Message[] = [];
      data.forEach((msg: any) => {
        if (msg.question) {
          messages.push({
            id: `${msg.id}-q`,
            role: 'user',
            content: msg.question,
          });
        }
        if (msg.answer) {
          messages.push({
            id: `${msg.id}-a`,
            role: 'assistant',
            content: msg.answer,
          });
        }
      });
      
      return messages;
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }
  };

  return {
    fetchChats,
    createChat,
    deleteChat,
    renameChat,
    sendMessage,
    getChatMessages,
  };
};
