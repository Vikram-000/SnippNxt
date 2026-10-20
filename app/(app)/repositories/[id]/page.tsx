import { Suspense } from 'react';
import RepoDetailClient from './RepoDetailClient';
import { getRepositories, getRepositoryDetail } from '@/app/actions/repositories';

export async function generateStaticParams() {
  const repos = await getRepositories();
  return repos.map(r => ({ id: r.id }));
}

export default function RepoDetailPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 500, borderRadius: 12 }} />}>
      <RepoDetailContent paramsPromise={props.params} />
    </Suspense>
  );
}

async function RepoDetailContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const initialData = await getRepositoryDetail(id);
  return <RepoDetailClient repoId={id} initialData={initialData} />;
}
