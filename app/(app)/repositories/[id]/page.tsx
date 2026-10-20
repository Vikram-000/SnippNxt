import { Suspense } from 'react';
import RepoDetailClient from './RepoDetailClient';
import { mockRepositories } from '../../../_lib/mockData';

export function generateStaticParams() {
  return mockRepositories.map(r => ({ id: r.id }));
}

export default async function RepoDetailPage(props: PageProps<'/repositories/[id]'>) {
  const { id } = await props.params;
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 500, borderRadius: 12 }} />}>
      <RepoDetailClient repoId={id} />
    </Suspense>
  );
}
