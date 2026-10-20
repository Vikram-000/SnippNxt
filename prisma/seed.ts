import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import {
  mockRepositories,
  mockFiles,
  mockIssues,
  mockTestSuites,
  mockDependencies,
  mockActivity,
  mockAIConversations,
} from "../app/_lib/mockData";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Create or ensure default User
  console.log("Seeding default user...");
  const user = await prisma.user.upsert({
    where: { email: "jane@example.com" },
    update: {},
    create: {
      id: "user-1",
      name: "Jane Dev",
      email: "jane@example.com",
      image: "JD",
    },
  });

  // 2. Create sample Folder & Tags for Student Snippet features
  console.log("Seeding folders and tags...");
  const csFolder = await prisma.folder.upsert({
    where: { id: "folder-1" },
    update: {},
    create: {
      id: "folder-1",
      name: "CS101: Data Structures",
      description: "Core algorithms and data structures coursework",
      color: "#8B5CF6",
      userId: user.id,
    },
  });

  const tagAlgo = await prisma.tag.upsert({
    where: { name: "algorithms" },
    update: {},
    create: { name: "algorithms", color: "#8B5CF6" },
  });

  const tagPython = await prisma.tag.upsert({
    where: { name: "python" },
    update: {},
    create: { name: "python", color: "#3572A5" },
  });

  const tagReact = await prisma.tag.upsert({
    where: { name: "react" },
    update: {},
    create: { name: "react", color: "#61DAFB" },
  });

  // 3. Seed Repositories
  console.log("Seeding repositories...");
  for (const repo of mockRepositories) {
    const statusMap: Record<string, "INDEXED" | "ANALYZING" | "PENDING"> = {
      indexed: "INDEXED",
      analyzing: "ANALYZING",
      pending: "PENDING",
    };

    await prisma.repository.upsert({
      where: { id: repo.id },
      update: {},
      create: {
        id: repo.id,
        userId: user.id,
        name: repo.name,
        description: repo.description,
        language: repo.language,
        langColor: repo.langColor,
        branch: repo.branch,
        fileCount: repo.fileCount,
        linesOfCode: repo.linesOfCode,
        status: statusMap[repo.status] ?? "PENDING",
        stars: repo.stars,
        url: repo.url,
      },
    });
  }

  // 4. Seed Files (belong to repo-1 / snippnxt-core)
  console.log("Seeding files...");
  for (const file of mockFiles) {
    await prisma.file.upsert({
      where: {
        repositoryId_path: {
          repositoryId: "repo-1",
          path: file.path,
        },
      },
      update: {},
      create: {
        id: file.id,
        repositoryId: "repo-1",
        name: file.name,
        path: file.path,
        language: file.language,
        size: file.size,
        lines: file.lines,
        content: file.content,
      },
    });
  }

  // 5. Seed Issues (belong to repo-1)
  console.log("Seeding issues...");
  for (const issue of mockIssues) {
    const matchingFile = mockFiles.find((f) => f.path === issue.file);
    const severityMap: Record<string, "ERROR" | "WARNING" | "INFO"> = {
      error: "ERROR",
      warning: "WARNING",
      info: "INFO",
    };
    const statusMap: Record<string, "OPEN" | "RESOLVED" | "IGNORED"> = {
      open: "OPEN",
      resolved: "RESOLVED",
      ignored: "IGNORED",
    };

    await prisma.issue.upsert({
      where: { id: issue.id },
      update: {},
      create: {
        id: issue.id,
        repositoryId: "repo-1",
        fileId: matchingFile ? matchingFile.id : null,
        filePath: issue.file,
        line: issue.line,
        severity: severityMap[issue.severity] ?? "WARNING",
        title: issue.title,
        description: issue.description,
        rule: issue.rule,
        fix: issue.fix,
        status: statusMap[issue.status] ?? "OPEN",
      },
    });
  }

  // 6. Seed TestSuites & TestCases (belong to repo-1)
  console.log("Seeding test suites and test cases...");
  for (const suite of mockTestSuites) {
    const createdSuite = await prisma.testSuite.upsert({
      where: { id: suite.id },
      update: {},
      create: {
        id: suite.id,
        repositoryId: "repo-1",
        name: suite.name,
        file: suite.file,
        total: suite.total,
        passed: suite.passed,
        failed: suite.failed,
        skipped: suite.skipped,
        duration: suite.duration,
      },
    });

    for (const test of suite.tests) {
      const statusMap: Record<string, "PASSED" | "FAILED" | "SKIPPED"> = {
        passed: "PASSED",
        failed: "FAILED",
        skipped: "SKIPPED",
      };

      await prisma.testCase.upsert({
        where: { id: test.id },
        update: {},
        create: {
          id: test.id,
          suiteId: createdSuite.id,
          name: test.name,
          status: statusMap[test.status] ?? "PASSED",
          duration: test.duration,
          error: "error" in test ? (test as { error?: string }).error : null,
        },
      });
    }
  }

  // 7. Seed Dependency Nodes
  console.log("Seeding dependency nodes...");
  for (const dep of mockDependencies) {
    await prisma.dependencyNode.upsert({
      where: { id: dep.id },
      update: {},
      create: {
        id: dep.id,
        repositoryId: "repo-1",
        nodeId: dep.id,
        label: dep.label,
        x: dep.x,
        y: dep.y,
        size: dep.size,
        imports: JSON.stringify(dep.imports),
      },
    });
  }

  // 8. Seed Activity Log
  console.log("Seeding activity log...");
  for (const act of mockActivity) {
    const repoObj = mockRepositories.find((r) => r.name === act.repo);
    const typeMap: Record<string, "INDEXED" | "SEARCH" | "ISSUE" | "AI" | "TEST"> = {
      indexed: "INDEXED",
      search: "SEARCH",
      issue: "ISSUE",
      ai: "AI",
      test: "TEST",
    };

    await prisma.activity.upsert({
      where: { id: act.id },
      update: {},
      create: {
        id: act.id,
        repositoryId: repoObj ? repoObj.id : "repo-1",
        type: typeMap[act.type] ?? "INDEXED",
        message: act.message,
      },
    });
  }

  // 9. Seed AI Conversations
  console.log("Seeding AI conversations...");
  for (const conv of mockAIConversations) {
    await prisma.aIConversation.upsert({
      where: { id: conv.id },
      update: {},
      create: {
        id: conv.id,
        userId: user.id,
        repositoryId: "repo-1",
        title: conv.title,
        lastMessage: conv.lastMessage,
      },
    });
  }

  // 10. Seed Sample Snippet
  console.log("Seeding sample snippet...");
  await prisma.snippet.upsert({
    where: { id: "snippet-1" },
    update: {},
    create: {
      id: "snippet-1",
      userId: user.id,
      title: "Binary Search Implementation",
      description: "Iterative binary search algorithm with O(log n) time complexity.",
      language: "python",
      code: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
      isFavorite: true,
      folderId: csFolder.id,
      tags: {
        connect: [{ name: "algorithms" }, { name: "python" }],
      },
    },
  });

  console.log("✅ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
