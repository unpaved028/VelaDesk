import { getAppearance } from '@/lib/actions/appearanceActions';
import { listCatalogItems } from '@/lib/actions/catalogActions';
import { listMailTemplates } from '@/lib/actions/mailTemplateActions';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AppearanceForm } from '@/components/admin/AppearanceForm';
import { CatalogManager } from '@/components/admin/CatalogManager';
import { LogoUpload } from '@/components/admin/LogoUpload';
import { MailTemplateEditor } from '@/components/admin/MailTemplateEditor';

export const dynamic = 'force-dynamic';

export default async function AdminAppearancePage() {
  const appearance = await getAppearance();
  const catalog = await listCatalogItems();
  const mail = await listMailTemplates();

  if (!appearance.success || !appearance.data) {
    return (
      <div className="custom-scrollbar h-full overflow-y-auto p-8">
        <p className="text-sm text-red-600">{appearance.error || 'Could not load appearance.'}</p>
      </div>
    );
  }

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-6xl">
        <AdminPageHeader
          title="Appearance"
          description="Brand, language, logo, mail copy, and portal catalog for this tenant. Staff UI stays English."
        />
        <AppearanceForm
          name={appearance.data.name}
          brandName={appearance.data.brandName}
          locale={appearance.data.locale}
        />
        <LogoUpload hasLogo={appearance.data.hasLogo} />
        {mail.error ? <p className="mb-4 text-sm text-red-600">{mail.error}</p> : null}
        <MailTemplateEditor
          templates={mail.data ?? []}
          brandName={appearance.data.brandName || appearance.data.name}
        />
        {catalog.error ? <p className="mb-4 text-sm text-red-600">{catalog.error}</p> : null}
        <CatalogManager initialItems={catalog.data ?? []} />
      </div>
    </div>
  );
}
