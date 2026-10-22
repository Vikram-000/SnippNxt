"use server";

import { prisma } from "@/lib/prisma";
import { getActiveAIProvider } from "@/lib/ai";

export type AIConversationItem = {
  id: string;
  title: string;
  lastMessage: string | null;
  time: string;
  repositoryId: string | null;
};

export async function getAIConversations(): Promise<AIConversationItem[]> {
  try {
    const convs = await prisma.aIConversation.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    return convs.map((c) => ({
      id: c.id,
      title: c.title,
      lastMessage: c.lastMessage,
      time: formatTimeAgo(c.updatedAt),
      repositoryId: c.repositoryId,
    }));
  } catch (error) {
    console.error("Failed to fetch AI conversations:", error);
    return [];
  }
}

export async function getProviderStatus(): Promise<{ provider: string; modelName: string }> {
  const provider = getActiveAIProvider();
  if (provider === "gemini") {
    return { provider: "Gemini", modelName: "gemini-1.5-flash" };
  }
  if (provider === "openai") {
    return { provider: "OpenAI", modelName: "gpt-4o-mini" };
  }
  return { provider: "Local Engine", modelName: "offline (Free Gemini API Key supported in .env)" };
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
