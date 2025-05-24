// Mock data service for development when database is not available
// Simple UUID generator function to avoid dependency on uuid package
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Types
interface MockChat {
  id: string;
  title: string;
}

interface MockMessage {
  id: string;
  question: string;
  answer: string;
  chatId: string;
}

// In-memory storage
let chats: MockChat[] = [];
let messages: MockMessage[] = [];

// Initialize with some sample data
const initMockData = () => {
  if (chats.length === 0) {
    // Create a sample chat
    const chatId = uuidv4();
    chats.push({
      id: chatId,
      title: 'Welcome to DeFi Copilot',
    });
    
    // Add a welcome message
    messages.push({
      id: uuidv4(),
      question: 'What can DeFi Copilot help me with?',
      answer: 'I can help you with DeFi strategies, token analysis, market trends, and more. Feel free to ask me anything about decentralized finance!',
      chatId,
    });
  }
};

// Initialize mock data
initMockData();

// Chat operations
export const mockChatOperations = {
  // Get all chats
  getAllChats: () => {
    return [...chats];
  },
  
  // Get a chat by ID
  getChat: (chatId: string) => {
    return chats.find(chat => chat.id === chatId);
  },
  
  // Create a new chat
  createChat: (title: string) => {
    const newChat: MockChat = {
      id: uuidv4(),
      title,
    };
    chats.push(newChat);
    return newChat;
  },
  
  // Update a chat
  updateChat: (chatId: string, title: string) => {
    const chatIndex = chats.findIndex(chat => chat.id === chatId);
    if (chatIndex === -1) {
      throw new Error(`Chat with ID ${chatId} not found`);
    }
    
    chats[chatIndex] = {
      ...chats[chatIndex],
      title,
    };
    
    return chats[chatIndex];
  },
  
  // Delete a chat
  deleteChat: (chatId: string) => {
    const initialLength = chats.length;
    chats = chats.filter(chat => chat.id !== chatId);
    
    // Also delete all messages for this chat
    messages = messages.filter(message => message.chatId !== chatId);
    
    return initialLength !== chats.length;
  },
  
  // Get messages for a chat
  getMessages: (chatId: string) => {
    return messages.filter(message => message.chatId === chatId);
  },
};

// Message operations
export const mockMessageOperations = {
  // Get all messages for a chat
  getChatMessages: (chatId: string) => {
    return messages.filter(message => message.chatId === chatId);
  },
  
  // Create a new message
  createMessage: (chatId: string, question: string, answer: string) => {
    // Check if chat exists
    const chat = mockChatOperations.getChat(chatId);
    if (!chat) {
      throw new Error(`Chat with ID ${chatId} not found`);
    }
    
    const newMessage: MockMessage = {
      id: uuidv4(),
      question,
      answer,
      chatId,
    };
    
    messages.push(newMessage);
    return newMessage;
  },
};

// AI model mock responses
export const mockAIResponse = (question: string, model: string = 'gemini') => {
  // Generate a mock response based on the question
  let response = '';
  
  // Simple keyword-based responses
  if (question.toLowerCase().includes('ethereum') || question.toLowerCase().includes('eth')) {
    response = 'Ethereum is a decentralized blockchain platform that enables the creation of smart contracts and decentralized applications (dApps). ETH is the native cryptocurrency of the Ethereum network.';
  } else if (question.toLowerCase().includes('staking')) {
    response = 'Staking is the process of actively participating in transaction validation on a proof-of-stake blockchain. It typically involves locking up cryptocurrency to support network operations in exchange for rewards.';
  } else if (question.toLowerCase().includes('yield') || question.toLowerCase().includes('farming')) {
    response = 'Yield farming involves lending or staking cryptocurrency assets to generate returns or rewards in the form of additional cryptocurrency. It\'s a way to put your crypto assets to work to generate the highest returns possible.';
  } else if (question.toLowerCase().includes('defi') || question.toLowerCase().includes('decentralized finance')) {
    response = 'Decentralized Finance (DeFi) refers to financial services and applications built on blockchain technology that operate without centralized intermediaries like banks. DeFi aims to create an open, permissionless financial system.';
  } else if (question.toLowerCase().includes('impermanent loss')) {
    response = 'Impermanent loss occurs when the price of tokens inside a liquidity pool changes compared to when they were deposited. The greater the change, the more significant the impermanent loss can be for liquidity providers.';
  } else if (question.toLowerCase().includes('aave') || question.toLowerCase().includes('compound')) {
    response = 'Aave and Compound are leading DeFi lending protocols that allow users to lend and borrow cryptocurrencies. They use algorithmic money markets to set interest rates based on supply and demand.';
  } else {
    response = `This is a mock response for development purposes. You asked: "${question}". In a production environment with proper API keys, you would receive a real response from the ${model} model.`;
  }
  
  return {
    id: uuidv4(),
    model: `mock-${model}`,
    message: {
      role: 'assistant',
      content: response,
    },
    finish_reason: 'mock-complete',
  };
};
