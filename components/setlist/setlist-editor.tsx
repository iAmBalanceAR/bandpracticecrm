"use client"
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GripVertical, X, Plus, FileDown } from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import { FeedbackDialog } from '@/components/common/FeedbackDialog';
import { FeedbackModal } from '../ui/feedback-modal';   
import { generateSetlistPDF } from '@/app/setlist/utils/export';

interface Song {
  id: string;
  title: string;
  duration: string;
  notes: string;
  sort_order: number;
}

interface SetlistEditorProps {
  setlistId?: string;
  onSave: () => void;
  onCancel: () => void;
}

// Add duration formatting utilities
function formatDurationInput(value: string): string {
  // Remove any non-digit characters except colon
  const cleaned = value.replace(/[^\d:]/g, '');
  
  // Handle empty input
  if (!cleaned) return '';
  
  const parts = cleaned.split(':');
  
  // If single number entered, treat as seconds
  if (parts.length === 1) {
    const seconds = parseInt(parts[0]);
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `0:${parts[0].padStart(2, '0')}`;
  }
  
  // Handle MM:SS format
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    const mins = parseInt(minutes);
    const secs = parseInt(seconds);
    
    if (secs >= 60) {
      const totalMinutes = mins + Math.floor(secs / 60);
      const remainingSeconds = secs % 60;
      return `${totalMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${mins}:${seconds.padStart(2, '0')}`;
  }
  
  return cleaned;
}

function durationToInterval(duration: string): string {
  if (!duration) return '0 seconds';
  
  const parts = duration.split(':');
  if (parts.length !== 2) return '0 seconds';
  
  const [minutes, seconds] = parts.map(Number);
  return `${minutes} minutes ${seconds} seconds`;
}

export default function SetlistEditor({ setlistId, onSave, onCancel }: SetlistEditorProps) {
  const [title, setTitle] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [newSong, setNewSong] = useState<Omit<Song, 'id' | 'sort_order'>>({
    title: '',
    duration: '',
    notes: ''
  });
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'warning' | 'delete'
    onConfirm?: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  })
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (setlistId) {
      fetchSetlist();
    }
  }, [setlistId]);

  const fetchSetlist = async () => {
    try {
      // Fetch setlist details
      const { data: setlistData, error: setlistError } = await supabase
        .from('setlists')
        .select('title')
        .eq('id', setlistId)
        .single();

      if (setlistError) throw setlistError;
      if (setlistData) {
        setTitle(setlistData.title);
      }

      // Fetch songs
      const { data: songsData, error: songsError } = await supabase
        .rpc('fetch_setlist_songs', { p_setlist_id: setlistId });

      if (songsError) throw songsError;
      setSongs(songsData as Song[]);
    } catch (error) {
      console.error('Error fetching setlist:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load setlist. Please try again.',
        type: 'error'
      });
    }
  };

  const handleAddSong = async () => {
    if (!newSong.title) {
      setFeedbackModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please enter at least a song title before adding.',
        type: 'error'
      });
      return;
    }

    try {
      if (setlistId) {
        const { data: songData, error } = await supabase.rpc('add_song_to_setlist', {
          p_setlist_id: setlistId,
          p_title: newSong.title,
          p_duration: durationToInterval(newSong.duration || '0:00'),
          p_notes: newSong.notes || '',
          p_sort_order: songs.length
        });

        if (error) throw error;

        setSongs([...songs, { ...newSong, id: songData, sort_order: songs.length }]);
      } else {
        setSongs([...songs, { ...newSong, id: Date.now().toString(), sort_order: songs.length }]);
      }

      setNewSong({ title: '', duration: '', notes: '' });
    } catch (error) {
      console.error('Error adding song:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to add song. Please try again.',
        type: 'error'
      });
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    try {
      const items = Array.from(songs);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      // Update sort_order for all affected items
      const updatedItems = items.map((item, index) => ({
        ...item,
        sort_order: index
      }));

      setSongs(updatedItems);

      if (setlistId) {
        // Update positions in database
        const { error } = await supabase.rpc('update_song_positions', {
          p_songs: updatedItems.map(item => ({
            id: item.id,
            sort_order: item.sort_order
          }))
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating song positions:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update song order. Please try again.',
        type: 'error'
      });
    }
  };

  const handleRemoveSong = async (songId: string, index: number) => {
    try {
      if (setlistId) {
        const { error } = await supabase.rpc('delete_song_from_setlist', {
          p_song_id: songId
        });

        if (error) throw error;
      }

      const updatedSongs = songs.filter((_, i) => i !== index);
      setSongs(updatedSongs);
    } catch (error) {
      console.error('Error removing song:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to remove song. Please try again.',
        type: 'error'
      });
    }
  };

  const handleSave = async () => {
    if (!title) {
      setFeedbackModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please enter a setlist title.',
        type: 'error'
      });
      return;
    }

    try {
      if (setlistId) {
        // Update existing setlist
        const { error: updateError } = await supabase.rpc('update_setlist', {
          p_setlist_id: setlistId,
          p_title: title
        });

        if (updateError) throw updateError;
      } else {
        // Create new setlist
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error: createError } = await supabase.rpc('create_setlist', {
          p_user_id: user.id,
          p_title: title,
          p_songs: songs.map(song => ({
            title: song.title,
            duration: song.duration,
            notes: song.notes,
            sort_order: song.sort_order
          }))
        });

        if (createError) throw createError;
      }

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: `Setlist ${setlistId ? 'updated' : 'created'} successfully`,
        type: 'success'
      });

      // Wait for feedback to be shown before closing
      setTimeout(() => {
        onSave();
      }, 1500);
    } catch (error) {
      console.error('Error saving setlist:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Error',
        message: `Failed to ${setlistId ? 'update' : 'create'} setlist. Please try again.`,
        type: 'error'
      });
    }
  };

  const handleExportClick = () => {
    setShowExportConfirm(true);
  };

  const handleExportConfirm = async () => {
    setShowExportConfirm(false);
    try {
      setFeedbackModal({
        isOpen: true,
        title: 'Generating PDF',
        message: 'Please wait while we generate your PDF...',
        type: 'warning'
      });

      await generateSetlistPDF(title, songs, {
        includeNotes: true
      });

      setFeedbackModal({
        isOpen: true,
        title: 'Success',
        message: 'PDF has been generated and downloaded successfully.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error exporting setlist:', error);
      setFeedbackModal({
        isOpen: true,
        title: 'Export Failed',
        message: 'There was an error generating the PDF. Please try again.',
        type: 'error'
      });
    }
  };

  return (
    <div className="space-y-4">
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
        onConfirm={feedbackModal.onConfirm}
      />

      <FeedbackModal
        isOpen={showExportConfirm}
        onClose={() => setShowExportConfirm(false)}
        title="Export Setlist"
        message={`Are you sure you want to export "${title}" as a PDF?`}
        type="warning"
        onConfirm={handleExportConfirm}
      />

      <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-mono text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">
          {setlistId ? 'Edit Setlist' : 'Create New Setlist'}
      </h1>
      </div>
      <Card className="bg-[#1B254B] border-blue-500/50 border">
        <CardHeader>
          <CardTitle>Setlist Title:</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Setlist Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-white bg-transparent "
            title="Enter a Title fro this Setlist."
          />
        </CardContent>
      </Card>
      <Card className="bg-[#1B254B]  border-blue-500/50 border">
        <CardHeader>
          <CardTitle className="text-white">Songs</CardTitle>

          <p className="text-sm text-gray-400">
            Enter song informmation and click "+" to add song to the setlist.  Songs can be dragged and dropped once added to reorder.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr,100px,1fr,40px] gap-2">
              <Input
                placeholder="Song Title"
                value={newSong.title}
                onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                className="text-white bg-transparent "
                title="Enter Song Title"
              />
              <Input
                placeholder="MM:SS"
                value={newSong.duration}
                onChange={(e) => setNewSong({ ...newSong, duration: formatDurationInput(e.target.value) })}
                className="text-white bg-transparent"
                title="Enter duration in MM:SS format (e.g., 3:45)"
              />
              <Input
                placeholder="Notes"
                value={newSong.notes}
                onChange={(e) => setNewSong({ ...newSong, notes: e.target.value })}
                className="text-white bg-transparent"
                title="Add a note for this song"
              />
              <Button
                onClick={handleAddSong}
                variant="ghost"
                size="icon"
                title="Click + to addd to Setlist"
                className="text-white hover:font-bold bg-blue-700 border-green-400 hover:bg-green-600 border"
              >
                <Plus className="h-[45px] w-[45px]" />
              </Button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="songs">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {songs.map((song, index) => (
                      <Draggable key={song.id} draggableId={song.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="grid grid-cols-[1fr,100px,1fr,40px] gap-2 items-center bg-[#111C44] p-2 mb-2 rounded-md  border-blue-500/50 border"
                          >
                            <div className="flex items-center gap-2">
                              <span {...provided.dragHandleProps}>
                                <GripVertical className="h-4 w-4 text-gray-500" />
                              </span>
                              <span className="text-white">{song.title}</span>
                            </div>
                            <span className="text-white">{song.duration}</span>
                            <span className="text-white truncate">{song.notes}</span>
                            <Button
                              onClick={() => handleRemoveSong(song.id, index)}
                              variant="ghost"
                              size="icon"
                              className="text-white hover:bg-red-600 hover:text-black h-[17px] w-[17px] p-4 bg-red-800 border-white/40 border rounded-sm"
                            >
                              <X className="" />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 mt-6">
        <Button
          onClick={onCancel}
          variant="destructive"
          className="bg-red-900 hover:bg-red-800 text-white"
        >
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={handleExportClick}
            variant="outline"
            className="ap-2 bg-blue-700 text-white text-shadow-x-2 text-shadow-y-2 text-shadow-black  border-black border cursor-pointer"
            disabled={!title || songs.length === 0}
          >
            <FileDown className="h-4 w-4 text-white"/>
            Export PDF
          </Button>
          <Button
            onClick={handleSave}
            variant="default"
            className="bg-green-800 hover:bg-green-700 text-white"
          >
            {setlistId ? 'Update' : 'Create'} Setlist
          </Button>
        </div>
      </div>
    </div>
  );
} 