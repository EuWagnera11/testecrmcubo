import { useState, useRef } from 'react';
import { Download, Loader2, FileText, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
  const { toast } = useToast();

  const getScaleForQuality = () => {
    switch (options.quality) {
      case 'max': return 3;
      case 'high': return 2;
      default: return 1.5;
    }
  };

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
      
      // Create canvas with high quality settings
      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
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

      let heightLeft = imgHeight;
      let position = marginTop;
      let pageNumber = 1;

      const addHeaderFooter = (pageNum: number, totalPages: number) => {
        // Header
        if (options.includeHeader && options.margins) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(0, 0, pageWidth, 20, 'F');
          
          pdf.setFontSize(12);
          pdf.setTextColor(50, 50, 50);
          pdf.text(title, marginX, 12);
          
          if (subtitle) {
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.text(subtitle, marginX, 17);
          }
          
          // Date on the right
          pdf.setFontSize(8);
          pdf.setTextColor(120, 120, 120);
          const dateText = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
          const dateWidth = pdf.getTextWidth(dateText);
          pdf.text(dateText, pageWidth - marginX - dateWidth, 12);
        }

        // Footer
        if (options.includeFooter && options.margins) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
          
          pdf.setFontSize(8);
          pdf.setTextColor(120, 120, 120);
          
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
      pdf.addImage(imgData, 'PNG', marginX, position, contentWidth, imgHeight);
      addHeaderFooter(pageNumber, totalPages);
      heightLeft -= contentHeight;

      // Additional pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + marginTop;
        pdf.addPage();
        pageNumber++;
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exportar PDF
          </DialogTitle>
          <DialogDescription>
            Configure as opções de exportação do relatório.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Name */}
          <div className="space-y-2">
            <Label htmlFor="fileName">Nome do Arquivo</Label>
            <Input
              id="fileName"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder="relatorio"
            />
            <p className="text-xs text-muted-foreground">
              A data será adicionada automaticamente ao nome.
            </p>
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
          <div className="space-y-4">
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

        <div className="flex justify-end gap-3">
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
      </DialogContent>
    </Dialog>
  );
}
