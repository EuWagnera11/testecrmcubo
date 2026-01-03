import { useState, useEffect, useCallback } from 'react';
import { Download, Loader2, FileText, Settings2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface PDFExportOptions {
  orientation: 'portrait' | 'landscape';
  quality: 'normal' | 'high' | 'max';
  includeHeader: boolean;
  includeFooter: boolean;
  includePageNumbers: boolean;
  margins: boolean;
  theme: 'light' | 'dark' | 'auto';
}

interface PDFExportDialogProps {
  contentRef: React.RefObject<HTMLDivElement>;
  fileName?: string;
  title?: string;
  subtitle?: string;
  logoUrl?: string;
  trigger?: React.ReactNode;
  showOptionsButton?: boolean;
}

const defaultOptions: PDFExportOptions = {
  orientation: 'portrait',
  quality: 'high',
  includeHeader: true,
  includeFooter: true,
  includePageNumbers: true,
  margins: true,
  theme: 'dark', // Always dark
};

export function PDFExportDialog({ 
  contentRef, 
  fileName = 'relatorio',
  title = 'Relatório',
  subtitle,
  logoUrl,
  trigger,
  showOptionsButton = true,
}: PDFExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<PDFExportOptions>(defaultOptions);
  const [customFileName, setCustomFileName] = useState(fileName);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const { toast } = useToast();

  const getScaleForQuality = (forPreview = false) => {
    if (forPreview) return 1; // Lower scale for preview
    switch (options.quality) {
      case 'max': return 3;
      case 'high': return 2;
      default: return 1.5;
    }
  };

  const getBackgroundColor = () => {
    // Always use dark background
    return '#0a0a0a';
  };

  const generatePreview = useCallback(async () => {
    if (!contentRef.current || !isOpen) return;
    
    setIsGeneratingPreview(true);
    
    try {
      const element = contentRef.current;
      const bgColor = getBackgroundColor();
      
      const canvas = await html2canvas(element, {
        scale: getScaleForQuality(true),
        useCORS: true,
        logging: false,
        backgroundColor: bgColor,
        allowTaint: true,
      });

      const url = canvas.toDataURL('image/png', 0.8);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [contentRef, isOpen]);

  // Generate preview when dialog opens or theme changes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        generatePreview();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setPreviewUrl(null);
    }
  }, [isOpen, options.theme, generatePreview]);

  const handleExport = async () => {
    if (!contentRef.current) {
      toast({
        title: 'Erro',
        description: 'Conteúdo não encontrado para exportação.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      const element = contentRef.current;
      const scale = getScaleForQuality();
      const bgColor = getBackgroundColor();
      
      // Create canvas with settings
      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: bgColor,
        allowTaint: true,
        imageTimeout: 15000,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);

      // PDF dimensions based on orientation
      const isLandscape = options.orientation === 'landscape';
      const pageWidth = isLandscape ? 297 : 210;
      const pageHeight = isLandscape ? 210 : 297;
      
      // Calculate margins
      const marginX = options.margins ? 10 : 0;
      const marginTop = options.margins ? (options.includeHeader ? 25 : 10) : 0;
      const marginBottom = options.margins ? (options.includeFooter ? 20 : 10) : 0;
      
      const contentWidth = pageWidth - (marginX * 2);
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
      const contentHeight = pageHeight - marginTop - marginBottom;

      const pdf = new jsPDF({
        orientation: options.orientation === 'landscape' ? 'l' : 'p',
        unit: 'mm',
        format: 'a4',
      });

      // Add metadata
      pdf.setProperties({
        title: title,
        subject: subtitle || 'Relatório exportado',
        author: 'Sistema de Gestão',
        creator: 'PDF Export',
      });

      // Set dark background for entire page
      const setPageBackground = () => {
        pdf.setFillColor(10, 10, 10);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      };

      let heightLeft = imgHeight;
      let position = marginTop;
      let pageNumber = 1;

      const addHeaderFooter = (pageNum: number, totalPages: number) => {
        // Dark theme colors - no background rectangles, just text
        const textColor = 220;
        const mutedColor = 150;

        // Header text only (background already dark from setPageBackground)
        if (options.includeHeader && options.margins) {
          pdf.setFontSize(12);
          pdf.setTextColor(textColor, textColor, textColor);
          pdf.text(title, marginX, 12);
          
          if (subtitle) {
            pdf.setFontSize(9);
            pdf.setTextColor(mutedColor, mutedColor, mutedColor);
            pdf.text(subtitle, marginX, 17);
          }
          
          // Date on the right
          pdf.setFontSize(8);
          pdf.setTextColor(mutedColor, mutedColor, mutedColor);
          const dateText = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
          const dateWidth = pdf.getTextWidth(dateText);
          pdf.text(dateText, pageWidth - marginX - dateWidth, 12);
        }

        // Footer text only
        if (options.includeFooter && options.margins) {
          pdf.setFontSize(8);
          pdf.setTextColor(mutedColor, mutedColor, mutedColor);
          
          if (options.includePageNumbers) {
            const pageText = `Página ${pageNum} de ${totalPages}`;
            const textWidth = pdf.getTextWidth(pageText);
            pdf.text(pageText, (pageWidth - textWidth) / 2, pageHeight - 6);
          }
          
          // Generated by text
          pdf.text('Gerado automaticamente pelo sistema', marginX, pageHeight - 6);
        }
      };

      // Calculate total pages
      const totalPages = Math.ceil(imgHeight / contentHeight);

      // First page
      setPageBackground();
      pdf.addImage(imgData, 'PNG', marginX, position, contentWidth, imgHeight);
      addHeaderFooter(pageNumber, totalPages);
      heightLeft -= contentHeight;

      // Additional pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + marginTop;
        pdf.addPage();
        pageNumber++;
        setPageBackground();
        pdf.addImage(imgData, 'PNG', marginX, position, contentWidth, imgHeight);
        addHeaderFooter(pageNumber, totalPages);
        heightLeft -= contentHeight;
      }

      // Generate filename with date
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const finalFileName = `${customFileName}-${dateStr}.pdf`;
      
      pdf.save(finalFileName);
      
      toast({
        title: 'PDF Exportado!',
        description: `Arquivo "${finalFileName}" salvo com sucesso.`,
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Erro na Exportação',
        description: 'Ocorreu um erro ao gerar o PDF. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Quick export without opening dialog
  const handleQuickExport = async () => {
    setOptions(defaultOptions);
    setCustomFileName(fileName);
    await handleExport();
  };

  if (!showOptionsButton) {
    return (
      <Button onClick={handleQuickExport} disabled={isExporting} variant="outline">
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </>
        )}
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
            <Settings2 className="h-3 w-3 ml-1 opacity-50" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exportar PDF
          </DialogTitle>
          <DialogDescription>
            Configure as opções e visualize o resultado antes de exportar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Options Column */}
          <div className="space-y-5">
            {/* File Name */}
            <div className="space-y-2">
              <Label htmlFor="fileName">Nome do Arquivo</Label>
              <Input
                id="fileName"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder="relatorio"
              />
            </div>

            {/* Orientation */}
            <div className="space-y-3">
              <Label>Orientação</Label>
              <RadioGroup
                value={options.orientation}
                onValueChange={(v) => setOptions({ ...options, orientation: v as 'portrait' | 'landscape' })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="portrait" id="portrait" />
                  <Label htmlFor="portrait" className="cursor-pointer">Retrato</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="landscape" id="landscape" />
                  <Label htmlFor="landscape" className="cursor-pointer">Paisagem</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-3">
              <Label>Orientação</Label>
              <RadioGroup
                value={options.orientation}
                onValueChange={(v) => setOptions({ ...options, orientation: v as 'portrait' | 'landscape' })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="portrait" id="portrait" />
                  <Label htmlFor="portrait" className="cursor-pointer">Retrato</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="landscape" id="landscape" />
                  <Label htmlFor="landscape" className="cursor-pointer">Paisagem</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Quality */}
            <div className="space-y-3">
              <Label>Qualidade</Label>
              <RadioGroup
                value={options.quality}
                onValueChange={(v) => setOptions({ ...options, quality: v as 'normal' | 'high' | 'max' })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal" className="cursor-pointer">Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high" className="cursor-pointer">Alta</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="max" id="max" />
                  <Label htmlFor="max" className="cursor-pointer">Máxima</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Toggle Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="includeHeader" className="cursor-pointer">Incluir Cabeçalho</Label>
                <Switch
                  id="includeHeader"
                  checked={options.includeHeader}
                  onCheckedChange={(checked) => setOptions({ ...options, includeHeader: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="includeFooter" className="cursor-pointer">Incluir Rodapé</Label>
                <Switch
                  id="includeFooter"
                  checked={options.includeFooter}
                  onCheckedChange={(checked) => setOptions({ ...options, includeFooter: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pageNumbers" className="cursor-pointer">Numerar Páginas</Label>
                <Switch
                  id="pageNumbers"
                  checked={options.includePageNumbers}
                  onCheckedChange={(checked) => setOptions({ ...options, includePageNumbers: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="margins" className="cursor-pointer">Incluir Margens</Label>
                <Switch
                  id="margins"
                  checked={options.margins}
                  onCheckedChange={(checked) => setOptions({ ...options, margins: checked })}
                />
              </div>
            </div>
          </div>

          {/* Preview Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Pré-visualização
              </Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPreview(!showPreview)}
                className="h-8"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {showPreview && (
              <div className="relative border border-border rounded-lg overflow-hidden bg-muted/30">
                {isGeneratingPreview ? (
                  <div className="flex items-center justify-center h-80">
                    <div className="text-center space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Gerando pré-visualização...</p>
                    </div>
                  </div>
                ) : previewUrl ? (
                  <ScrollArea className="h-80">
                    <div className="p-2">
                      <img 
                        src={previewUrl} 
                        alt="Preview do PDF" 
                        className="w-full rounded shadow-sm"
                      />
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center h-80">
                    <p className="text-sm text-muted-foreground">Carregando preview...</p>
                  </div>
                )}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              A pré-visualização mostra como o conteúdo será capturado. Cabeçalho e rodapé serão adicionados no PDF final.
            </p>
          </div>
        </div>

        <div className="flex justify-between gap-3 pt-2 border-t">
          <Button 
            variant="ghost" 
            onClick={generatePreview}
            disabled={isGeneratingPreview}
            size="sm"
          >
            {isGeneratingPreview ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Atualizar Preview
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
