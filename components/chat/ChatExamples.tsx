"use client"
import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ExamplePrompt {
  text: string;
  description: string;
  image: string;
}

interface ChatExamplesProps {
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
}

const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  { 
    text: 'Develop a task management system using a Kanban layout, allowing users to create, move, and complete tasks intuitively.', 
    description: 'Create a Kanban task manager',
    image: '/placeholder.svg?height=200&width=400&text=Dashboard'
  },
  { 
    text: 'Develop a website where users can create personalized diets by entering their food preferences and nutritional goals. The system should generate a weekly meal plan and allow users to customize each meal according to their needs and preferences.', 
    description: 'Create an appointment scheduling app',
    image: '/placeholder.svg?height=200&width=400&text=Fitness+App'
  },
  { 
    text: 'Build an application that allows users to schedule, view, and manage daily appointments, with support for notifications and calendar synchronization.', 
    description: 'Create a scalable GraphQL API using Node.js, Express, and Apollo Server',
    image: '/placeholder.svg?height=200&width=400&text=GraphQL+API'
  },
  { 
    text: 'Implement authentication with NextAuth.js', 
    description: 'Add secure, customizable authentication to your Next.js application',
    image: '/placeholder.svg?height=200&width=400&text=NextAuth.js'
  },
  { 
    text: 'Create a real-time chat with Socket.io', 
    description: 'Build a real-time chat application using React and Socket.io',
    image: '/placeholder.svg?height=200&width=400&text=Real-time+Chat'
  },
  { 
    text: 'Develop a Vue.js e-commerce site', 
    description: 'Build a modern e-commerce website with Vue.js, Vuex, and Vue Router',
    image: '/placeholder.svg?height=200&width=400&text=E-commerce+Site'
  },
];

export const ChatExamples: React.FC<ChatExamplesProps> = ({ sendMessage }) => {
  return (
    <div className="w-full max-w-full mx-auto mt-8 px-4 sm:px-6 lg:px-8" id="examples">
      <h2 className="text-xl font-light text-start mb-2">Templates</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXAMPLE_PROMPTS.map((examplePrompt, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="p-0">
              <Image
                src={"/template.jpg"}
                alt={examplePrompt.text}
                width={200}
                height={200}
                className="w-full h-48 object-cover"
              />
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-lg mb-2">{examplePrompt.text}</CardTitle>
              <CardDescription>{examplePrompt.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={(event) => sendMessage?.(event, examplePrompt.text)}
                className="w-full bg-accent"
              >
                Try this prompt
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

