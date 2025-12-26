import { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  projectId: string;
  fieldType: string;
  attachments: string[];
  onAttachmentsChange: (attachments: string[]) => void;
  disabled?: boolean;
}

export function FileUpload({ projectId, fieldType, attachments = [], onAttachmentsChange, disabled }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}/${fieldType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('project-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('project-attachments')
          .getPublicUrl(fileName);

        newUrls.push(data.publicUrl);
      }

      onAttachmentsChange([...attachments, ...newUrls]);
      toast({ title: 'Arquivo(s) enviado(s)!' });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar arquivo',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (url: string) => {
    onAttachmentsChange(attachments.filter(a => a !== url));
  };

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return ImageIcon;
    }
    if (['pdf'].includes(ext || '')) {
      return FileText;
    }
    return File;
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1].slice(0, 30);
  };

  const isImage = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  };

  return (
    <div className="space-y-3">
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {attachments.map((url, index) => {
            const Icon = getFileIcon(url);
            return (
              <div
                key={index}
                className="relative group bg-muted rounded-lg overflow-hidden border border-border"
              >
                {isImage(url) ? (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt="Attachment"
                      className="w-full h-20 object-cover"
                    />
                  </a>
                ) : (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center h-20 p-2 hover:bg-muted/80"
                  >
                    <Icon className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground truncate max-w-full">
                      {getFileName(url)}
                    </span>
                  </a>
                )}
                {!disabled && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemove(url)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!disabled && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-dashed"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Adicionar Arquivos
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
