import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const AdminPageHeader = ({ title, description, actions }: AdminPageHeaderProps) => {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
};
