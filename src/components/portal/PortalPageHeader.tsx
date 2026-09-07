import React from 'react';

interface PortalPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PortalPageHeader = ({ title, description, actions }: PortalPageHeaderProps) => {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="w-full md:w-auto">{actions}</div> : null}
    </header>
  );
};
