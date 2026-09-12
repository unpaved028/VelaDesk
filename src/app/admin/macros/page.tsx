import { listMacros } from '@/lib/actions/macroActions';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { MacroManager } from '@/components/admin/MacroManager';

export const dynamic = 'force-dynamic';

export default async function AdminMacrosPage() {
  const result = await listMacros();
  const macros = result.data ?? [];

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-6xl">
        <AdminPageHeader
          title="Macros"
          description="Canned replies for this tenant. Agents insert them from the ticket reply box."
        />
        <MacroManager initialMacros={macros} />
      </div>
    </div>
  );
}
