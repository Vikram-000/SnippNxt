"use server";

import { prisma } from "@/lib/prisma";

export type IssueSeverity = "error" | "warning" | "info";
export type IssueStatus = "open" | "resolved" | "ignored";

export interface IssueItem {
  id: string;
  severity: IssueSeverity;
  file: string;
  line: number;
  title: string;
  description: string;
  rule: string;
  fix: string;
  status: IssueStatus;
}

export async function getIssues(): Promise<IssueItem[]> {
  try {
    const issues = await prisma.issue.findMany({
      orderBy: { createdAt: "asc" },
    });

    return issues.map((i) => ({
      id: i.id,
      severity: (i.severity.toLowerCase() as IssueSeverity) || "warning",
      file: i.filePath,
      line: i.line,
      title: i.title,
      description: i.description,
      rule: i.rule,
      fix: i.fix ?? "",
      status: (i.status.toLowerCase() as IssueStatus) || "open",
    }));
  } catch (error) {
    console.error("Failed to fetch issues from database:", error);
    throw new Error("Failed to fetch issues");
  }
}

export async function updateIssueStatus(
  id: string,
  status: IssueStatus
): Promise<boolean> {
  try {
    const statusMap: Record<IssueStatus, "OPEN" | "RESOLVED" | "IGNORED"> = {
      open: "OPEN",
      resolved: "RESOLVED",
      ignored: "IGNORED",
    };

    await prisma.issue.update({
      where: { id },
      data: {
        status: statusMap[status] ?? "OPEN",
      },
    });

    return true;
  } catch (error) {
    console.error(`Failed to update issue ${id} status:`, error);
    throw new Error("Failed to update issue status");
  }
}
