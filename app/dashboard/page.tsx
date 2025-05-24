"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Bot, Coins, Loader2, Maximize2, Minimize2, Plus, Send, Settings, Sparkles, Trash, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Chat, Message } from "@/types/chat"
import { useApi } from "@/hooks/useApi"

export default function Dashboard() {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<string>("")
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // Always use Gemini model as requested
  const selectedModel = "gemini"
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Initialize API hook
  const api = useApi()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Fetch chats when component mounts
  useEffect(() => {
    const fetchInitialChats = async () => {
      setIsLoading(true);
      try {
        const fetchedChats = await api.fetchChats();
        setChats(fetchedChats);
        
        // Set active chat to the first chat if available
        if (fetchedChats.length > 0 && !activeChat) {
          setActiveChat(fetchedChats[0].id);
          
          // Load messages for the active chat
          const messages = await api.getChatMessages(fetchedChats[0].id);
          const updatedChats = [...fetchedChats];
          const chatIndex = updatedChats.findIndex(chat => chat.id === fetchedChats[0].id);
          if (chatIndex !== -1) {
            updatedChats[chatIndex].messages = messages;
            setChats(updatedChats);
          }
        }
      } catch (error) {
        console.error('Error fetching initial chats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialChats();
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chats])

  const handleNewChat = async () => {
    try {
      // Create a new chat via API
      const newChat = await api.createChat("New conversation");
      
      // Update local state
      setChats([...chats, newChat]);
      setActiveChat(newChat.id);
      setInput("");
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Find the current chat
    const currentChatIndex = chats.findIndex((chat) => chat.id === activeChat)
    if (currentChatIndex === -1) return

    // Create a copy of the chats array
    const updatedChats = [...chats]

    // Add the user message to the UI immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    updatedChats[currentChatIndex].messages.push(userMessage)

    // Update the chat title if it's the first message
    if (updatedChats[currentChatIndex].messages.length === 1) {
      const newTitle = input.slice(0, 30) + (input.length > 30 ? "..." : "")
      updatedChats[currentChatIndex].title = newTitle
      
      // Update the chat title in the database
      try {
        // Make sure we have a valid chatId before attempting to rename
        if (activeChat && typeof activeChat === 'string' && activeChat.trim() !== '') {
          console.log('Updating chat title for chat ID:', activeChat);
          await api.renameChat(activeChat, newTitle);
        } else {
          console.error('Cannot update chat title: activeChat is undefined or invalid');
        }
      } catch (error) {
        console.error('Error updating chat title:', error)
      }
    }

    // Update UI with user message
    setChats([...updatedChats])
    setInput("")

    // Send message to API
    setIsGenerating(true)
    try {
      // Send message to the API and get response
      const messageResponse = await api.sendMessage(activeChat, input)
      
      // Create assistant message from response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: messageResponse.answer,
      }

      // Update the chat with the assistant's response
      updatedChats[currentChatIndex].messages.push(assistantMessage)
      setChats([...updatedChats])
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Add error message to UI
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, there was an error processing your request. Please try again later.",
      }
      
      updatedChats[currentChatIndex].messages.push(errorMessage)
      setChats([...updatedChats])
    } finally {
      setIsGenerating(false)
    }
  }

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [chatToRename, setChatToRename] = useState<string>("")
  const [newChatTitle, setNewChatTitle] = useState<string>("")

  const handleRenameChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId)
    if (chat) {
      setChatToRename(chatId)
      setNewChatTitle(chat.title)
      setIsRenameDialogOpen(true)
    }
  }

  const handleSaveRename = async () => {
    // Validate inputs
    if (!chatToRename || typeof chatToRename !== 'string' || chatToRename.trim() === '') {
      console.error('Cannot rename chat: chatToRename is undefined or invalid');
      setIsRenameDialogOpen(false);
      setChatToRename("");
      setNewChatTitle("");
      return;
    }
    
    if (!newChatTitle || !newChatTitle.trim()) {
      console.error('Cannot rename chat: newChatTitle is empty');
      return;
    }

    console.log('Renaming chat with ID:', chatToRename, 'to title:', newChatTitle);
    
    try {
      // Update chat title in the API
      await api.renameChat(chatToRename, newChatTitle)

      // Update local state
      const updatedChats = chats.map((chat) => {
        if (chat.id === chatToRename) {
          return { ...chat, title: newChatTitle }
        }
        return chat
      })

      setChats(updatedChats)
    } catch (error) {
      console.error('Error renaming chat:', error)
    } finally {
      setIsRenameDialogOpen(false)
      setChatToRename("")
      setNewChatTitle("")
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    if (confirm("Are you sure you want to delete this chat?")) {
      try {
        // Delete chat via API
        await api.deleteChat(chatId)
        
        // Update local state
        const updatedChats = chats.filter((chat) => chat.id !== chatId)
        setChats(updatedChats)

        // If the active chat is deleted, set a new active chat
        if (activeChat === chatId && updatedChats.length > 0) {
          setActiveChat(updatedChats[0].id)
          
          // Load messages for the new active chat
          const messages = await api.getChatMessages(updatedChats[0].id)
          const newUpdatedChats = [...updatedChats]
          const chatIndex = newUpdatedChats.findIndex(chat => chat.id === updatedChats[0].id)
          if (chatIndex !== -1) {
            newUpdatedChats[chatIndex].messages = messages
            setChats(newUpdatedChats)
          }
        } else if (updatedChats.length === 0) {
          setActiveChat("")
        }
      } catch (error) {
        console.error('Error deleting chat:', error)
        alert('Failed to delete chat. Please try again.')
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  // Load messages when a user selects a chat
  const handleChatSelect = async (chatId: string) => {
    if (chatId === activeChat) return
    
    setActiveChat(chatId)
    setIsLoading(true)
    
    try {
      // Check if we already have messages for this chat
      const chatIndex = chats.findIndex(chat => chat.id === chatId)
      if (chatIndex !== -1 && chats[chatIndex].messages.length > 0) {
        // We already have messages, no need to fetch
        setIsLoading(false)
        return
      }
      
      // Fetch messages for the selected chat
      const messages = await api.getChatMessages(chatId)
      
      // Update the chat with the fetched messages
      const updatedChats = [...chats]
      const updatedChatIndex = updatedChats.findIndex(chat => chat.id === chatId)
      
      if (updatedChatIndex !== -1) {
        updatedChats[updatedChatIndex].messages = messages
        setChats(updatedChats)
      }
    } catch (error) {
      console.error('Error loading chat messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const currentChat = chats.find((chat) => chat.id === activeChat)

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-black text-white">
        <Sidebar className="border-r border-gray-800 bg-gray-950">
          <SidebarHeader className="p-3">
            <Button
              onClick={handleNewChat}
              className="w-full justify-start gap-2 bg-emerald-500 text-black hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" />
              New chat
            </Button>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id} className="group">
                  <div className="flex items-center justify-between w-full">
                    <SidebarMenuButton
                      onClick={() => handleChatSelect(chat.id)}
                      isActive={activeChat === chat.id}
                      className="justify-start gap-2 text-sm flex-1"
                    >
                      <Bot className="h-4 w-4" />
                      <span className="truncate">{chat.title}</span>
                    </SidebarMenuButton>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameChat(chat.id);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-800 p-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="justify-start gap-2 text-sm">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main
          className={cn(
            "relative flex flex-1 flex-col bg-gradient-to-b from-gray-900 to-black transition-all duration-300",
            isFullscreen ? "fixed inset-0 z-50" : "",
          )}
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-400" />
              <span className="font-medium">DeFi Copilot</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-md text-sm text-emerald-400 flex items-center gap-1">
                <Bot className="h-4 w-4" />
                <span>Gemini</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-gray-400 hover:text-white"
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>
            </div>
          </header>

          {/* Main chat area */}
          <div className="flex-1 overflow-y-auto p-4 md:px-20 lg:px-32">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <span className="ml-2 text-gray-400">Loading conversation...</span>
              </div>
            ) : currentChat && currentChat.messages.length > 0 ? (
              <div className="space-y-6">
                {currentChat.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-start gap-4 rounded-lg p-4",
                      message.role === "user" ? "bg-gray-800/50" : "bg-gray-900/50",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        message.role === "user"
                          ? "bg-gray-600"
                          : "bg-emerald-500/20 text-emerald-400",
                      )}
                    >
                      {message.role === "user" ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-5 w-5 text-gray-300"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {message.role === "user" ? "You" : "DeFi Copilot"}
                      </div>
                      <div className="mt-1 whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ))}
                
                {isGenerating && (
                  <div className="flex items-start gap-4 rounded-lg bg-gray-900/50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">DeFi Copilot</div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div
                          className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center">
                <div className="mb-8 rounded-full bg-emerald-500/10 p-4">
                  <Sparkles className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="mb-2 text-2xl font-bold">How can I help with DeFi today?</h2>
                <p className="mb-8 text-center text-gray-400">
                  Ask about yield strategies, token analysis, or market trends
                </p>
                <div className="grid w-full max-w-md gap-3 md:grid-cols-2">
                  {[
                    "Compare ETH staking options",
                    "Analyze AAVE vs Compound",
                    "Explain impermanent loss",
                    "Best yield for stablecoins",
                  ].map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="justify-start border-gray-800 bg-gray-900/50 text-left hover:bg-gray-800"
                      onClick={() => {
                        setInput(suggestion)
                        if (textareaRef.current) {
                          textareaRef.current.focus()
                        }
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-gray-800 p-4 md:px-20 lg:px-32">
            <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-lg border border-gray-800 bg-gray-900 p-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about DeFi strategies, protocols, or market analysis..."
                className="min-h-[60px] max-h-[200px] flex-1 resize-none border-0 bg-transparent p-2 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isGenerating}
                size="icon"
                className="h-10 w-10 shrink-0 rounded-md bg-emerald-500 text-black hover:bg-emerald-600"
              >
                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
            <div className="mt-2 text-center text-xs text-gray-500">
              DeFi Copilot can make mistakes. Consider checking important information.
            </div>
          </div>
        </main>
      </div>
      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="bg-gray-900 border border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <Input
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="Enter new title"
            className="bg-gray-800 border-gray-700 text-white"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSaveRename()
              }
            }}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsRenameDialogOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRename}
              className="bg-emerald-500 text-black hover:bg-emerald-600"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
