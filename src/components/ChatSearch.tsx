import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Filter, Image, FileText, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface ChatFilters {
  search: string;
  showImages: boolean;
  showFiles: boolean;
  showText: boolean;
}

interface ChatSearchProps {
  filters: ChatFilters;
  onFiltersChange: (filters: ChatFilters) => void;
  totalMessages: number;
  filteredCount: number;
}

export const ChatSearch = ({ filters, onFiltersChange, totalMessages, filteredCount }: ChatSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = !filters.showImages || !filters.showFiles || !filters.showText || filters.search;

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar mensagens..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="h-8 pl-8 text-sm"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5"
            onClick={() => onFiltersChange({ ...filters, search: '' })}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant={hasActiveFilters ? "secondary" : "ghost"} size="icon" className="h-8 w-8">
            <Filter className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3" align="end">
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Filtrar por tipo</p>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="filter-text"
                checked={filters.showText}
                onCheckedChange={(checked) => 
                  onFiltersChange({ ...filters, showText: checked as boolean })
                }
              />
              <Label htmlFor="filter-text" className="text-sm flex items-center gap-1.5 cursor-pointer">
                <FileText className="h-3.5 w-3.5" /> Mensagens
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="filter-images"
                checked={filters.showImages}
                onCheckedChange={(checked) => 
                  onFiltersChange({ ...filters, showImages: checked as boolean })
                }
              />
              <Label htmlFor="filter-images" className="text-sm flex items-center gap-1.5 cursor-pointer">
                <Image className="h-3.5 w-3.5" /> Imagens
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="filter-files"
                checked={filters.showFiles}
                onCheckedChange={(checked) => 
                  onFiltersChange({ ...filters, showFiles: checked as boolean })
                }
              />
              <Label htmlFor="filter-files" className="text-sm flex items-center gap-1.5 cursor-pointer">
                <FileText className="h-3.5 w-3.5" /> Arquivos
              </Label>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {hasActiveFilters && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {filteredCount} de {totalMessages}
        </span>
      )}
    </div>
  );
};
