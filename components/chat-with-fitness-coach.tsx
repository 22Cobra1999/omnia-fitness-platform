"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Message {
  sender: "user" | "coach"
  content: string
  timestamp: Date
}

export function ChatWithFitnessCoach() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "coach",
      content: "Hi there! I'm your fitness coach. How can I assist you with your workout routine today?",
      timestamp: new Date(),
    },
  ])
  const [newMessage, setNewMessage] = useState("")

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, { sender: "user", content: newMessage, timestamp: new Date() }])
      setNewMessage("")
      // Simulate coach response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "coach",
            content:
              "Thanks for reaching out. I'll review your recent workout data and provide some tailored advice shortly.",
            timestamp: new Date(),
          },
        ])
      }, 1000)
    }
  }

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="flex-grow mb-4 p-4 border rounded-md">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} mb-4`}>
            {message.sender === "coach" && (
              <Avatar className="w-8 h-8 mr-2">
                <AvatarImage src="/fitness-coach-avatar.png" alt="Fitness Coach" />
                <AvatarFallback>FC</AvatarFallback>
              </Avatar>
            )}
            <div
              className={`p-2 rounded-lg ${message.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}
            >
              <p>{message.content}</p>
              <span className="text-xs opacity-50">{message.timestamp.toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </ScrollArea>
      <div className="flex">
        <Input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow mr-2"
        />
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </div>
  )
}
