'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetMailTemplate, saveMailTemplate } from '@/lib/actions/mailTemplateActions';
import type { MailTemplateKey } from '@/lib/services/mailTemplates';
import { applyTemplate, previewVars } from '@/lib/services/templateRender';

const LABELS: Record<MailTemplateKey, string> = {
  ack: 'Ticket acknowledgement',
  magic_link: 'Magic Link',
  public_reply: 'Public reply subject',
  csat: 'CSAT survey',
};

export const MailTemplateEditor = ({
  templates,
  brandName,
}: {
  templates: { key: MailTemplateKey; subject: string; body: string; isCustom: boolean }[];
  brandName: string;
}) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const vars = previewVars(brandName);

  return (
    <div className="mb-10 space-y-4">
      <h2 className="font-headline text-lg font-bold text-on-surface">Outbound mail</h2>
      <p className="text-sm text-on-surface-variant">
        Placeholders: {'{brand}'} {'{ticketId}'} {'{inc}'} {'{subject}'} {'{token}'} {'{link}'} {'{goodUrl}'} {'{neutralUrl}'} {'{badUrl}'}.
        Ticket mails must keep {'{token}'} or {'{ticketId}'} so replies still thread. Preview uses INC-0042.
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-4">
        {templates.map((template) => (
          <MailTemplateCard
            key={template.key}
            template={template}
            vars={vars}
            pending={pendingKey === template.key}
            onError={setError}
            onPending={setPendingKey}
            onSaved={() => router.refresh()}
          />
        ))}
      </div>
    </div>
  );
};

const MailTemplateCard = ({
  template,
  vars,
  pending,
  onError,
  onPending,
  onSaved,
}: {
  template: { key: MailTemplateKey; subject: string; body: string; isCustom: boolean };
  vars: ReturnType<typeof previewVars>;
  pending: boolean;
  onError: (message: string | null) => void;
  onPending: (key: string | null) => void;
  onSaved: () => void;
}) => {
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const previewSubject = useMemo(() => applyTemplate(subject, vars, false), [subject, vars]);
  const previewHtml = useMemo(() => applyTemplate(body, vars, true), [body, vars]);

  return (
    <form
      className="space-y-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        onPending(template.key);
        onError(null);
        const result = await saveMailTemplate({ key: template.key, subject, body });
        onPending(null);
        if (!result.success) {
          onError(result.error);
          return;
        }
        onSaved();
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-on-surface">{LABELS[template.key]}</h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {template.isCustom ? 'Custom' : 'Default'}
        </span>
      </div>
      <input
        name="subject"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm"
      />
      {template.key === 'public_reply' ? null : (
        <textarea
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={8}
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 font-mono text-xs"
        />
      )}
      <div className="rounded-xl border border-dashed border-outline-variant/30 bg-surface-container-lowest p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Preview</p>
        <p className="mb-3 text-sm font-medium text-on-surface">{previewSubject}</p>
        {template.key === 'public_reply' ? (
          <p className="text-xs text-on-surface-variant">Body is the public reply the agent writes on the ticket.</p>
        ) : (
          <iframe
            title={`${template.key} preview`}
            sandbox=""
            srcDoc={previewHtml}
            className="h-56 w-full rounded-lg bg-white"
          />
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Save template
        </button>
        {template.isCustom ? (
          <button
            type="button"
            disabled={pending}
            className="text-sm font-bold text-red-600"
            onClick={async () => {
              onPending(template.key);
              await resetMailTemplate(template.key);
              onPending(null);
              onSaved();
            }}
          >
            Reset to default
          </button>
        ) : null}
      </div>
    </form>
  );
};
