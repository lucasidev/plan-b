import Link from 'next/link';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { fetchUsersServer } from '@/features/manage-users/api.server';
import { UserTable } from '@/features/manage-users/components/user-table';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Alumnos · Usuarios · planb' };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string | string[];
    status?: string | string[];
    page?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const search = (typeof params.search === 'string' ? params.search : '').trim().slice(0, 254);
  const status =
    typeof params.status === 'string' && ['active', 'pending', 'suspended'].includes(params.status)
      ? params.status
      : 'all';
  const page = Math.min(
    100_000,
    Math.max(1, Number.parseInt(typeof params.page === 'string' ? params.page : '1', 10) || 1),
  );
  const result = await fetchUsersServer(search, status, page);
  const pageHref = (target: number) =>
    `/admin/users?${new URLSearchParams({ search, status, page: String(target) })}`;
  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Usuarios"
        title="Alumnos"
        subtitle="Cuentas, perfil académico y acceso a la plataforma."
      />
      <form
        key={`${search}:${status}`}
        action="/admin/users"
        className="mb-5 flex flex-wrap items-end gap-3"
      >
        <label className="text-sm text-ink-2">
          Buscar por email
          <input
            type="search"
            name="search"
            defaultValue={search}
            maxLength={254}
            className="mt-1 block rounded-md border border-line bg-bg-card px-3 py-2"
          />
        </label>
        <label className="text-sm text-ink-2">
          Estado
          <select
            name="status"
            defaultValue={status}
            className="mt-1 block rounded-md border border-line bg-bg-card px-3 py-2"
          >
            <option value="all">Todos</option>
            <option value="active">Activas</option>
            <option value="pending">Email pendiente</option>
            <option value="suspended">Suspendidas</option>
          </select>
        </label>
        <button type="submit" className="rounded-md bg-ink px-4 py-2 text-sm text-bg-card">
          Buscar
        </button>
        <Link href="/admin/users" className="py-2 text-sm underline">
          Limpiar filtros
        </Link>
      </form>
      <p className="mb-3 text-xs text-ink-3">
        {result.total} cuentas · página {result.page}
      </p>
      <UserTable users={result.items} />
      <nav aria-label="Páginas de usuarios" className="mt-4 flex gap-4 text-sm">
        {page > 1 && (
          <Link href={pageHref(page - 1)} className="underline">
            Anterior
          </Link>
        )}
        {page * result.pageSize < result.total && (
          <Link href={pageHref(page + 1)} className="underline">
            Siguiente
          </Link>
        )}
      </nav>
    </div>
  );
}
