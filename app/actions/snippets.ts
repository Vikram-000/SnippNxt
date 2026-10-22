"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type SnippetItem = {
  id: string;
  title: string;
  description: string | null;
  code: string;
  language: string;
  isFavorite: boolean;
  isArchived: boolean;
  folderId: string | null;
  folderName?: string | null;
  folderColor?: string | null;
  repositoryId?: string | null;
  repositoryName?: string | null;
  tags: { id: string; name: string; color: string | null }[];
  createdAt: string;
  updatedAt: string;
};

export type FolderItem = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  snippetCount: number;
  createdAt: string;
};

export type TagItem = {
  id: string;
  name: string;
  color: string | null;
  snippetCount: number;
};

const TAG_PALETTE = [
  "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B",
  "#EC4899", "#6366F1", "#14B8A6", "#06B6D4"
];

function pickTagColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_PALETTE.length;
  return TAG_PALETTE[index];
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore when called outside of Next.js active request context
  }
}

export async function getSnippets(filters?: {
  folderId?: string;
  tag?: string;
  search?: string;
  favorite?: boolean;
  language?: string;
}): Promise<SnippetItem[]> {
  try {
    const where: any = {
      isArchived: false,
    };

    if (filters?.folderId) {
      where.folderId = filters.folderId;
    }

    if (filters?.tag) {
      where.tags = {
        some: {
          name: filters.tag.toLowerCase(),
        },
      };
    }

    if (filters?.favorite !== undefined) {
      where.isFavorite = filters.favorite;
    }

    if (filters?.language && filters.language !== "all") {
      where.language = filters.language.toLowerCase();
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { code: { contains: q } },
        {
          tags: {
            some: {
              name: { contains: q },
            },
          },
        },
      ];
    }

    const snippets = await prisma.snippet.findMany({
      where,
      include: {
        folder: true,
        repository: true,
        tags: true,
      },
      orderBy: [
        { isFavorite: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return snippets.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      code: s.code,
      language: s.language,
      isFavorite: s.isFavorite,
      isArchived: s.isArchived,
      folderId: s.folderId,
      folderName: s.folder?.name ?? null,
      folderColor: s.folder?.color ?? null,
      repositoryId: s.repositoryId,
      repositoryName: s.repository?.name ?? null,
      tags: s.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to fetch snippets:", error);
    throw new Error("Failed to fetch snippets");
  }
}

export async function getSnippetById(id: string): Promise<SnippetItem | null> {
  try {
    const s = await prisma.snippet.findUnique({
      where: { id },
      include: {
        folder: true,
        repository: true,
        tags: true,
      },
    });

    if (!s) return null;

    return {
      id: s.id,
      title: s.title,
      description: s.description,
      code: s.code,
      language: s.language,
      isFavorite: s.isFavorite,
      isArchived: s.isArchived,
      folderId: s.folderId,
      folderName: s.folder?.name ?? null,
      folderColor: s.folder?.color ?? null,
      repositoryId: s.repositoryId,
      repositoryName: s.repository?.name ?? null,
      tags: s.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error(`Failed to fetch snippet ${id}:`, error);
    throw new Error(`Failed to fetch snippet ${id}`);
  }
}

export async function createSnippet(data: {
  title: string;
  description?: string;
  code: string;
  language: string;
  folderId?: string | null;
  tags?: string[];
  isFavorite?: boolean;
}): Promise<SnippetItem> {
  try {
    const tagConnectOrCreate = (data.tags || [])
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .map((name) => ({
        where: { name },
        create: {
          name,
          color: pickTagColor(name),
        },
      }));

    // Find default demo user if exists
    const user = await prisma.user.findFirst();

    const created = await prisma.snippet.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        code: data.code,
        language: (data.language || "typescript").toLowerCase(),
        isFavorite: data.isFavorite ?? false,
        folderId: data.folderId || null,
        userId: user?.id || null,
        tags: {
          connectOrCreate: tagConnectOrCreate,
        },
      },
      include: {
        folder: true,
        repository: true,
        tags: true,
      },
    });

    safeRevalidatePath("/snippets");
    return {
      id: created.id,
      title: created.title,
      description: created.description,
      code: created.code,
      language: created.language,
      isFavorite: created.isFavorite,
      isArchived: created.isArchived,
      folderId: created.folderId,
      folderName: created.folder?.name ?? null,
      folderColor: created.folder?.color ?? null,
      repositoryId: created.repositoryId,
      repositoryName: created.repository?.name ?? null,
      tags: created.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Failed to create snippet:", error);
    throw new Error("Failed to create snippet");
  }
}

export async function updateSnippet(
  id: string,
  data: {
    title?: string;
    description?: string;
    code?: string;
    language?: string;
    folderId?: string | null;
    tags?: string[];
    isFavorite?: boolean;
    isArchived?: boolean;
  }
): Promise<SnippetItem> {
  try {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description.trim() || null;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.language !== undefined) updateData.language = data.language.toLowerCase();
    if (data.folderId !== undefined) updateData.folderId = data.folderId || null;
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
    if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;

    if (data.tags !== undefined) {
      const tagConnectOrCreate = data.tags
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .map((name) => ({
          where: { name },
          create: {
            name,
            color: pickTagColor(name),
          },
        }));

      updateData.tags = {
        set: [],
        connectOrCreate: tagConnectOrCreate,
      };
    }

    const updated = await prisma.snippet.update({
      where: { id },
      data: updateData,
      include: {
        folder: true,
        repository: true,
        tags: true,
      },
    });

    safeRevalidatePath("/snippets");
    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      code: updated.code,
      language: updated.language,
      isFavorite: updated.isFavorite,
      isArchived: updated.isArchived,
      folderId: updated.folderId,
      folderName: updated.folder?.name ?? null,
      folderColor: updated.folder?.color ?? null,
      repositoryId: updated.repositoryId,
      repositoryName: updated.repository?.name ?? null,
      tags: updated.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error(`Failed to update snippet ${id}:`, error);
    throw new Error(`Failed to update snippet ${id}`);
  }
}

export async function deleteSnippet(id: string): Promise<boolean> {
  try {
    await prisma.snippet.delete({
      where: { id },
    });
    safeRevalidatePath("/snippets");
    return true;
  } catch (error) {
    console.error(`Failed to delete snippet ${id}:`, error);
    throw new Error(`Failed to delete snippet ${id}`);
  }
}

export async function toggleFavoriteSnippet(id: string): Promise<boolean> {
  try {
    const existing = await prisma.snippet.findUnique({
      where: { id },
      select: { isFavorite: true },
    });
    if (!existing) throw new Error("Snippet not found");

    const updated = await prisma.snippet.update({
      where: { id },
      data: { isFavorite: !existing.isFavorite },
      select: { isFavorite: true },
    });

    safeRevalidatePath("/snippets");
    return updated.isFavorite;
  } catch (error) {
    console.error(`Failed to toggle favorite on snippet ${id}:`, error);
    throw new Error(`Failed to toggle favorite on snippet ${id}`);
  }
}

export async function getFolders(): Promise<FolderItem[]> {
  try {
    const folders = await prisma.folder.findMany({
      include: {
        _count: {
          select: {
            snippets: {
              where: { isArchived: false },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return folders.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      color: f.color,
      icon: f.icon,
      snippetCount: f._count.snippets,
      createdAt: f.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to fetch folders:", error);
    throw new Error("Failed to fetch folders");
  }
}

export async function createFolder(data: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}): Promise<FolderItem> {
  try {
    const user = await prisma.user.findFirst();
    const created = await prisma.folder.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        color: data.color || "#8B5CF6",
        icon: data.icon || "📁",
        userId: user?.id || null,
      },
      include: {
        _count: {
          select: { snippets: true },
        },
      },
    });

    safeRevalidatePath("/snippets");
    return {
      id: created.id,
      name: created.name,
      description: created.description,
      color: created.color,
      icon: created.icon,
      snippetCount: created._count.snippets,
      createdAt: created.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("Failed to create folder:", error);
    throw new Error("Failed to create folder");
  }
}

export async function deleteFolder(id: string): Promise<boolean> {
  try {
    await prisma.folder.delete({
      where: { id },
    });
    safeRevalidatePath("/snippets");
    return true;
  } catch (error) {
    console.error(`Failed to delete folder ${id}:`, error);
    throw new Error(`Failed to delete folder ${id}`);
  }
}

export async function getTags(): Promise<TagItem[]> {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            snippets: {
              where: { isArchived: false },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      snippetCount: t._count.snippets,
    }));
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    throw new Error("Failed to fetch tags");
  }
}

export async function createTag(name: string, color?: string): Promise<TagItem> {
  try {
    const cleanName = name.trim().toLowerCase();
    const tag = await prisma.tag.upsert({
      where: { name: cleanName },
      update: {},
      create: {
        name: cleanName,
        color: color || pickTagColor(cleanName),
      },
      include: {
        _count: {
          select: { snippets: true },
        },
      },
    });

    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      snippetCount: tag._count.snippets,
    };
  } catch (error) {
    console.error(`Failed to create tag ${name}:`, error);
    throw new Error(`Failed to create tag ${name}`);
  }
}
