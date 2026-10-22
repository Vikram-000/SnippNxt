import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const TAG_PALETTE = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B',
  '#EC4899', '#6366F1', '#14B8A6', '#06B6D4'
];

function pickTagColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
}

// GET /api/snippets - Fetch snippets, folders, and tags for VS Code Extension
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId');
    const tag = searchParams.get('tag');
    const query = searchParams.get('search');

    const where: any = { isArchived: false };
    if (folderId) where.folderId = folderId;
    if (tag) {
      where.tags = {
        some: { name: tag.toLowerCase() },
      };
    }
    if (query) {
      const q = query.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { code: { contains: q } },
        { tags: { some: { name: { contains: q } } } },
      ];
    }

    const [snippets, folders, tags] = await Promise.all([
      prisma.snippet.findMany({
        where,
        include: {
          folder: true,
          tags: true,
          repository: true,
        },
        orderBy: [{ isFavorite: 'desc' }, { updatedAt: 'desc' }],
      }),
      prisma.folder.findMany({
        include: {
          _count: { select: { snippets: { where: { isArchived: false } } } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.tag.findMany({
        include: {
          _count: { select: { snippets: { where: { isArchived: false } } } },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({
      snippets: snippets.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        code: s.code,
        language: s.language,
        isFavorite: s.isFavorite,
        folderId: s.folderId,
        folderName: s.folder?.name ?? null,
        folderColor: s.folder?.color ?? null,
        tags: s.tags.map((t) => t.name),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      folders: folders.map((f) => ({
        id: f.id,
        name: f.name,
        color: f.color,
        icon: f.icon,
        snippetCount: f._count.snippets,
      })),
      tags: tags.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        snippetCount: t._count.snippets,
      })),
    });
  } catch (error) {
    console.error('API /api/snippets GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch snippets' }, { status: 500 });
  }
}

// POST /api/snippets - Save snippet from VS Code Extension
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, code, language, folderId, tags, description } = body;

    if (!title || !code) {
      return NextResponse.json(
        { error: 'Title and code are required fields' },
        { status: 400 }
      );
    }

    const tagNames: string[] = Array.isArray(tags) ? tags : [];
    const tagConnectOrCreate = tagNames
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .map((name) => ({
        where: { name },
        create: {
          name,
          color: pickTagColor(name),
        },
      }));

    const user = await prisma.user.findFirst();

    const created = await prisma.snippet.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        code,
        language: (language || 'plaintext').toLowerCase(),
        folderId: folderId || null,
        userId: user?.id || null,
        tags: {
          connectOrCreate: tagConnectOrCreate,
        },
      },
      include: {
        folder: true,
        tags: true,
      },
    });

    return NextResponse.json({
      success: true,
      snippet: {
        id: created.id,
        title: created.title,
        description: created.description,
        code: created.code,
        language: created.language,
        folderId: created.folderId,
        folderName: created.folder?.name ?? null,
        tags: created.tags.map((t) => t.name),
      },
    });
  } catch (error) {
    console.error('API /api/snippets POST error:', error);
    return NextResponse.json({ error: 'Failed to create snippet' }, { status: 500 });
  }
}
