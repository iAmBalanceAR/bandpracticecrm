'use client';

import { useState, useRef } from 'react';
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
import createClient from '@/utils/supabase/client';
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<Attachment['type']>('document');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `leads/${lead.id}/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      // Create attachment record
      const { error: dbError } = await supabase
        .from('attachments')
        .insert([{
          lead_id: lead.id,
          type: uploadType,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
        }]);

      if (dbError) throw dbError;

      toast.success('File uploaded successfully');
      router.refresh();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    const confirmed = window.confirm('Are you sure you want to delete this file?');
    if (!confirmed) return;

    try {
      // Delete from storage
      const filePath = new URL(attachment.file_url).pathname.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('attachments')
          .remove([`leads/${lead.id}/${filePath}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachment.id);

      if (error) throw error;

      toast.success('File deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

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
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="rider">Rider</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
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
            {lead.attachments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No attachments yet. Upload your first file above.
              </p>
            ) : (
              lead.attachments
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
                        onClick={() => handleDelete(attachment)}
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