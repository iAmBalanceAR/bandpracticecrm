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
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from 'date-fns';
import { useSupabase } from '@/components/providers/supabase-client-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  UploadCloud,
  File,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  Download,
  Trash2,
  Loader2,
  X,
} from 'lucide-react';
import { FeedbackModal } from '@/components/ui/feedback-modal';

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
  onUpdate?: () => void;
}

type FeedbackModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'delete';
  onConfirm?: () => Promise<void>;
};

const fileTypeIcons: Record<string, React.ReactNode> = {
  'image': <ImageIcon className="h-6 w-6 text-green-500" />,
  'pdf': <FileText className="h-6 w-6 text-blue-500" />,
  'document': <FileText className="h-6 w-6 text-blue-500" />,
  'spreadsheet': <FileSpreadsheet className="h-6 w-6 text-emerald-500" />,
  'default': <File className="h-6 w-6 text-gray-500" />,
};

export default function LeadAttachments({ lead, onUpdate }: LeadAttachmentsProps) {
  const { supabase } = useSupabase();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<Attachment['type']>('document');
  const [selectedImage, setSelectedImage] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated) {
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Please sign in to upload files',
        type: 'error'
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    await handleSubmit(formData, file);
  };

  const handleSubmit = async (formData: FormData, file: File) => {
    setIsUploading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('No authenticated user found');
      }

      const fileName = file.name;
      const fileType = file.type;
      const filePath = `${user.id}/leads/${lead.id}/${fileName}`;

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

      onUpdate?.();
      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: 'Attachment added successfully',
        type: 'success'
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error adding attachment:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to add attachment',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!isAuthenticated) {
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Please sign in to delete files',
        type: 'error'
      });
      return;
    }

    setFeedbackModal({
      isOpen: true,
      title: 'Delete Attachment',
      message: 'Are you sure you want to delete this file?',
      type: 'delete',
      onConfirm: async () => {
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();

          if (userError || !user) {
            throw new Error('No authenticated user found');
          }

          const filePath = `${user.id}/leads/${lead.id}/${attachment.file_name}`;
          await supabase.storage
            .from('attachments')
            .remove([filePath]);

          // Delete from database using RPC
          const { error } = await supabase
            .rpc('delete_attachment', {
              p_attachment_id: attachment.id
            });

          if (error) throw error;

          onUpdate?.();
          setFeedbackModal({
            isOpen: true,
            title: 'Success',
            message: 'File deleted successfully',
            type: 'success'
          });
        } catch (error) {
          console.error('Error deleting file:', error);
          setFeedbackModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete file',
            type: 'error'
          });
        }
      }
    });
  };

  const handleFileClick = (attachment: Attachment) => {
    if (attachment.file_type.startsWith('image/')) {
      setSelectedImage(attachment);
    } else {
      window.open(attachment.file_url, '_blank');
    }
  };

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
        <p className="text-sm text-gray-400">Choose the file type from the dropdown menu, the clickk "Upload File" to select the file. Uploads limited to standard image formats as well as .pdf, .doc, .docx, .xls and .xlsx file types. Limit upload size to 2mb or smaller.</p>
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
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center ap-2 bg-blue-700 text-white text-shadow-x-2 text-shadow-y-2 text-shadow-black  border-black border cursor-pointer"
              >
                <UploadCloud className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {!lead.attachments?.length ? (
              <p className="text-center text-muted-foreground py-4">
                No attachments yet. Upload your first file above.
              </p>
            ) : (
              lead.attachments
                .sort((a, b) => {
                  const dateA = new Date(a.uploaded_at).getTime();
                  const dateB = new Date(b.uploaded_at).getTime();
                  return dateB - dateA;
                })
                .map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 p-3 bg-[#0A1129] border border-white/40 rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-[2px]">
                      {fileTypeIcons[attachment.type] || fileTypeIcons.default}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="border-r pr-4 border-blue-500 font-medium text-lg capitalize whitespace-nowrap">
                          {attachment.type}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-muted-foreground truncate">
                            {attachment.file_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatBytes(attachment.file_size)} • {formatDistanceToNow(new Date(attachment.uploaded_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleFileClick(attachment)}
                        className="hover:bg-[#2D3748] hover:text-blue-500 hover:shadow-blue-500 hover:shadow-sm hover:font-semibold text-blue-500"
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(attachment)}
                        className="hover:bg-[#2D3748] hover:text-rose-500 hover:shadow-rose-500 hover:shadow-sm hover:font-semibold text-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </CardContent>

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
        onConfirm={feedbackModal.onConfirm}
      />

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl bg-[#1B2559] border-blue-500 p-0">
          <div className="relative w-full h-full max-h-[80vh] overflow-hidden rounded-lg">
            {selectedImage && (
              <>
                <div className="absolute top-6 right-6 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedImage(null)}
                    className="bg-black/70 border-gray-500/50 border hover:border-red-700/50 hover:bg-white hover:text-black text-white rounded-sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative w-full h-full flex items-center justify-center bg-black/50 p-4">
                  <img
                    src={selectedImage.file_url}
                    alt={selectedImage.file_name}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-white text-sm">
                  {selectedImage.file_name}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 