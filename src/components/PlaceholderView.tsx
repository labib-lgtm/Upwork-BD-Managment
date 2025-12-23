import React from 'react';
import { User } from '@/types';
import { Inbox, Package } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
  description: string;
  icon: 'inbox' | 'package';
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title, description, icon }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6">
          {icon === 'inbox' ? (
            <Inbox className="w-10 h-10 text-muted-foreground" />
          ) : (
            <Package className="w-10 h-10 text-muted-foreground" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground max-w-md">
          {description}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
          Coming Soon
        </div>
      </div>
    </div>
  );
};
