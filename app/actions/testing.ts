"use server";

import { prisma } from "@/lib/prisma";

export type TestItem = {
  id: string;
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
};

export type TestSuiteItem = {
  id: string;
  name: string;
  file: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  lastRun: string;
  tests: TestItem[];
};

export async function getTestSuites(): Promise<TestSuiteItem[]> {
  try {
    const suites = await prisma.testSuite.findMany({
      include: {
        tests: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return suites.map((s) => ({
      id: s.id,
      name: s.name,
      file: s.file,
      total: s.total,
      passed: s.passed,
      failed: s.failed,
      skipped: s.skipped,
      duration: s.duration,
      lastRun: s.lastRun ? formatTimeAgo(s.lastRun) : "Just now",
      tests: s.tests.map((t) => ({
        id: t.id,
        name: t.name,
        status: (t.status.toLowerCase() as "passed" | "failed" | "skipped") || "passed",
        duration: t.duration,
        error: t.error ?? undefined,
      })),
    }));
  } catch (error) {
    console.error("Failed to fetch test suites from database:", error);
    throw new Error("Failed to fetch test suites");
  }
}

export async function triggerRunTests(): Promise<TestSuiteItem[]> {
  try {
    const now = new Date();
    await prisma.testSuite.updateMany({
      data: {
        lastRun: now,
      },
    });

    return getTestSuites();
  } catch (error) {
    console.error("Failed to trigger test run:", error);
    throw new Error("Failed to trigger test run");
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}
