"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Pencil, Trash2, FileDown, Calendar, Frown, ListVideo } from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import SetlistEditor from './setlist-editor';
import { FeedbackDialog } from '@/components/common/FeedbackDialog';
import PDFLoadingOverlay from './pdf-loading-overlay';
import { generateSetlistPDF } from '@/app/setlist/utils/export';

interface SetlistEntry {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  song_count: number;
}

export default function SetlistManagement() {
  const [setlists, setSetlists] = useState<SetlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [feedback, setFeedback] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    open: false,
    title: '',
    message: '',
    type: 'success'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportSetlist, setExportSetlist] = useState<{
    title: string;
    songs: any[];
  } | null>(null);
  
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchSetlists();
  }, []);

  const fetchSetlists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('fetch_setlists', { p_user_id: user.id });

      if (error) throw error;
      setSetlists(data as SetlistEntry[]);
    } catch (error) {
      console.error('Error fetching setlists:', error);
      setFeedback({
        open: true,
        title: 'Error',
        message: 'Failed to fetch setlists. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingId(undefined);
    setIsEditing(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.rpc('delete_setlist', {
        p_setlist_id: id
      });

      if (error) throw error;

      setFeedback({
        open: true,
        title: 'Success',
        message: 'Setlist deleted successfully',
        type: 'success'
      });

      fetchSetlists();
    } catch (error) {
      console.error('Error deleting setlist:', error);
      setFeedback({
        open: true,
        title: 'Error',
        message: 'Failed to delete setlist. Please try again.',
        type: 'error'
      });
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    setEditingId(undefined);
    fetchSetlists();
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(undefined);
  };

  const handleExport = async (id: string) => {
    try {
      const { data: setlistData, error: setlistError } = await supabase
        .from('setlists')
        .select('title')
        .eq('id', id)
        .single();

      if (setlistError) throw setlistError;

      const { data: songsData, error: songsError } = await supabase
        .rpc('fetch_setlist_songs', { p_setlist_id: id });

      if (songsError) throw songsError;

      setExportSetlist({
        title: setlistData.title,
        songs: songsData
      });
      setIsExporting(true);
    } catch (error) {
      console.error('Error preparing setlist for export:', error);
      setFeedback({
        open: true,
        title: 'Error',
        message: 'Failed to prepare setlist for export. Please try again.',
        type: 'error'
      });
    }
  };

  if (isEditing) {
    return (
      <SetlistEditor
        setlistId={editingId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="space-y-4">
      <FeedbackDialog
        open={feedback.open}
        onOpenChange={(open) => setFeedback(prev => ({ ...prev, open }))}
        title={feedback.title}
        message={feedback.message}
        type={feedback.type}
      />

      {isExporting && exportSetlist && (
        <PDFLoadingOverlay
          onComplete={async () => {
            try {
              await generateSetlistPDF(exportSetlist.title, exportSetlist.songs);
            } finally {
              setIsExporting(false);
              setExportSetlist(null);
            }
          }}
        />
      )}

      <div className="flex-row w-full">
        <h1 className="float-left font-mono text-white text-shadow-sm -text-shadow-xl2 text-shadow-y-2 text-shadow-black text-2xl">
          Saved Setlists
        </h1>
        <Button
          onClick={handleCreateNew}
          variant="default"
          className="bg-green-700 text-white hover:bg-green-600 float-right"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Setlist
        </Button>
        <div className="clear-both"></div>
      </div>
      <div className="overflow-x-auto">
      <div className="border-gray-500 border-2 rounded-lg">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="text-lg font-medium bg-[#1F2937] text-gray-100 text-shadow-x-2 text-shadow-y-2 text-shadow-black border-gray-500 border-b-1">
              <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">TTitle</TableHead>
              <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">Songs</TableHead>
              <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">Created</TableHead>
              <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4">Last Updated</TableHead>
              <TableHead className="text-gray-100 bg-[#1F2937] pt-4 pb-4 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-white">
                  Loading...
                </TableCell>
              </TableRow>
            ) : setlists.length === 0 ? (
              <TableRow className="bg-[#111827] hover:bg-[#030817] transition-colors border-gray-500 border-b text-base">
                <TableCell colSpan={5} className="text-center text-lg text-gray-400">
                  <ListVideo className="w-24 h-24 mx-auto text-[#008ffb]" />
                  No setlists found in the database.<br />Click the "Create New Setlist" button above to create one.
                </TableCell>
              </TableRow>
            ) : (
              setlists.map((setlist) => (
              <TableRow className="bg-[#111827] hover:bg-[#030817]  transition-colors border-gray-500 border-b text-base">
                    <TableCell className="font-medium text-gray-400 pt-4 pb-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-[#ff9920] mr-2" />
                        <span>{setlist.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400 pt-4 pb-4">
                        {setlist.song_count}
                        </TableCell>
                      <TableCell className="text-gray-400 pt-4 pb-4">
                          {new Date(setlist.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-gray-400 pt-4 pb-4">
                        {new Date(setlist.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-white text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(setlist.id)}
                        className="hover:bg-[#216930] text-green-400 border-0 hover:text-white hover:shadow-green-400 hover:shadow-sm hover:font-semibold"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(setlist.id)}
                       className="hover:bg-[#2D3748] hover:text-lime-400 hover:shadow-green-400 hover:shadow-sm hover:font-semibold text-white border-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(setlist.id)}
                       className="hover:bg-[#2D3748] hover:text-rose-500 hover:shadow-rose-500 hover:shadow-sm hover:font-semibold text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
            </div>
          </div>
        
      </div>
      )}
