import { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Image as ImageIcon, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Helper to get signed URL from stored path
const getSignedUrl = async (storedPath: string): Promise<string | null> => {
  // Handle legacy public URLs
  if (storedPath.startsWith('http')) {
    // Convert old public URL to path format for migration
    const match = storedPath.match(/project-attachments\/(.+)$/);
    if (match) {
      const { data } = await supabase.storage
        .from('project-attachments')
        .createSignedUrl(match[1], 3600); // 1 hour expiration
      return data?.signedUrl || storedPath;
    }
    return storedPath;
  }
  
  // Handle new format: bucket:path
  if (storedPath.startsWith('project-attachments:')) {
    const filePath = storedPath.replace('project-attachments:', '');
    const { data } = await supabase.storage
      .from('project-attachments')
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl || null;
  }
  
  return storedPath;
};

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

        // Store the file path instead of public URL - we'll generate signed URLs when displaying
        newUrls.push(`project-attachments:${fileName}`);
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

  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Generate signed URLs for all attachments
  useEffect(() => {
    const generateSignedUrls = async () => {
      const urls: Record<string, string> = {};
      for (const attachment of attachments) {
        const signedUrl = await getSignedUrl(attachment);
        if (signedUrl) {
          urls[attachment] = signedUrl;
        }
      }
      setSignedUrls(urls);
    };
    
    if (attachments.length > 0) {
      generateSignedUrls();
    }
  }, [attachments]);

  const handleRemove = (storedPath: string) => {
    onAttachmentsChange(attachments.filter(a => a !== storedPath));
  };

  const getFileIcon = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return ImageIcon;
    }
    if (['pdf'].includes(ext || '')) {
      return FileText;
    }
    return File;
  };

  const getFileName = (path: string) => {
    // Handle new format: bucket:path
    const cleanPath = path.includes(':') ? path.split(':')[1] : path;
    const parts = cleanPath.split('/');
    return parts[parts.length - 1].slice(0, 30);
  };

  const isImage = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  };

  return (
    <div className="space-y-3">
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {attachments.map((storedPath, index) => {
            const Icon = getFileIcon(storedPath);
            const displayUrl = signedUrls[storedPath];
            
            if (!displayUrl) {
              return (
                <div key={index} className="relative bg-muted rounded-lg overflow-hidden border border-border h-20 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              );
            }
            
            return (
              <div
                key={index}
                className="relative group bg-muted rounded-lg overflow-hidden border border-border"
              >
                {isImage(storedPath) ? (
                  <a href={displayUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={displayUrl}
                      alt="Attachment"
                      className="w-full h-20 object-cover"
                    />
                  </a>
                ) : (
                  <a
                    href={displayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center h-20 p-2 hover:bg-muted/80"
                  >
                    <Icon className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground truncate max-w-full">
                      {getFileName(storedPath)}
                    </span>
                  </a>
                )}
                {!disabled && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemove(storedPath)}
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
