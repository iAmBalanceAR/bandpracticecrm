'use client';

import { useState, useRef, useEffect } from 'react';
import { Lead, Attachment } from '@/app/types/lead';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { useSupabase } from '@/components/providers/supabase-client-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  File,
  Image,
  FileText,
  FileSpreadsheet,
  Download,
  Trash2,
  Loader2,
} from 'lucide-react';

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

interface LeadAttachmentsProps {
  lead: Lead & {
    attachments: Attachment[];
  };
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  'image': <Image className="h-4 w-4" />,
  'pdf': <FileText className="h-4 w-4" />,
  'document': <FileText className="h-4 w-4" />,
  'spreadsheet': <FileSpreadsheet className="h-4 w-4" />,
  'default': <File className="h-4 w-4" />,
};

export default function LeadAttachments({ lead }: LeadAttachmentsProps) {
  const { supabase } = useSupabase();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [attachments, setAttachments] = useState<Attachment[]>(lead.attachments || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<Attachment['type']>('document');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated) {
      toast.error('Please sign in to upload files');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    await handleSubmit(formData, file);
  };

  const handleSubmit = async (formData: FormData, file: File) => {
    setIsUploading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No session found');
      }

      const fileName = file.name;
      const fileType = file.type;
      const filePath = `${session.user.id}/leads/${lead.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      // Create attachment record using RPC
      const { data, error: dbError } = await supabase
        .rpc('create_attachment', {
          attachment_data: {
            lead_id: lead.id,
            file_name: fileName,
            file_type: fileType,
            file_size: file.size,
            type: uploadType,
            file_url: publicUrl
          }
        });

      if (dbError) throw dbError;

      toast.success('Attachment added successfully');
      router.refresh();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error adding attachment:', error);
      toast.error('Failed to add attachment');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to delete files');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this file?');
    if (!confirmed) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No session found');
      }

      const filePath = `${session.user.id}/leads/${lead.id}/${attachment.file_name}`;
      await supabase.storage
        .from('attachments')
        .remove([filePath]);

      // Delete from database using RPC
      const { error } = await supabase
        .rpc('delete_attachment', {
          p_attachment_id: attachment.id
        });

      if (error) throw error;

      toast.success('File deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  // Subscribe to realtime changes
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('lead_attachments_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'attachments',
          filter: `lead_id=eq.${lead.id}`
        }, 
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            setAttachments(prev => [payload.new as Attachment, ...prev]);
          } else if (payload.eventType === 'DELETE' && payload.old.id) {
            setAttachments(prev => prev.filter(attachment => attachment.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.error('Failed to subscribe to attachments changes:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, lead.id, supabase]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">Please sign in to view and manage attachments</p>
      </div>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Attachments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>File Type</Label>
              <Select
                value={uploadType}
                onValueChange={(value) => setUploadType(value as Attachment['type'])}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#1B2559] text-white">
                  <SelectItem value="document" className="cursor-pointer">Document</SelectItem>
                  <SelectItem value="contract" className="cursor-pointer">Contract</SelectItem>
                  <SelectItem value="rider" className="cursor-pointer">Rider</SelectItem>
                  <SelectItem value="image" className="cursor-pointer">Image</SelectItem>
                  <SelectItem value="other" className="cursor-pointer">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {attachments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No attachments yet. Upload your first file above.
              </p>
            ) : (
              attachments
                .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
                .map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {fileTypeIcons[attachment.type] || fileTypeIcons.default}
                      <div>
                        <h4 className="font-medium">{attachment.file_name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatBytes(attachment.file_size)}</span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(attachment.uploaded_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete({
                          ...attachment,
                          type: attachment.type as "image" | "document" | "contract" | "rider" | "other"
                        })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </CardContent>
    </>
  );
} 