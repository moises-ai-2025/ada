import React from 'react';
import { useStore } from '@nanostores/react';
import { providerStore } from '@/lib/stores/provider';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

export function ProviderSelector() {
  const currentProvider = useStore(providerStore);
  const [isProviderMenuOpen, setIsProviderMenuOpen] = React.useState(false);

  return (
    <div className="relative">
      <Button variant="ghost" className="flex justify-between p-1.5 ml-2">
        <div className="flex items-center max-w-[150px] truncate text-sm">
          {currentProvider.model.displayName} {/* Exibe apenas o modelo atual */}
        </div>
        {isProviderMenuOpen ? (
          <ChevronUpIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        ) : (
          <ChevronDownIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        )}
      </Button>
      {/* Menu dropdown removido, pois apenas Google é suportado */}
    </div>
  );
}