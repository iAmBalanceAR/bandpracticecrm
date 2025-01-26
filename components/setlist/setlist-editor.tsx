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
import { generateSetlistPDF } from '@/app/setlist/utils/export';

interface Song {
  id: string;
  title: string;
  duration: string;
  key: string;
  notes: string;
  sort_order: number;
}

interface SetlistEditorProps {
  setlistId?: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function SetlistEditor({ setlistId, onSave, onCancel }: SetlistEditorProps) {
  const [title, setTitle] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [newSong, setNewSong] = useState<Omit<Song, 'id' | 'sort_order'>>({
    title: '',
    duration: '',
    key: '',
    notes: ''
  });
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
      setFeedback({
        open: true,
        title: 'Error',
        message: 'Failed to load setlist. Please try again.',
        type: 'error'
      });
    }
  };

  const handleAddSong = async () => {
    if (!newSong.title) return;

    try {
      if (setlistId) {
        const { data: songData, error } = await supabase.rpc('add_song_to_setlist', {
          p_setlist_id: setlistId,
          p_title: newSong.title,
          p_duration: newSong.duration,
          p_key: newSong.key,
          p_notes: newSong.notes,
          p_sort_order: songs.length
        });

        if (error) throw error;

        setSongs([...songs, { ...newSong, id: songData, sort_order: songs.length }]);
      } else {
        // For new setlists, just add to local state
        setSongs([...songs, { ...newSong, id: Date.now().toString(), sort_order: songs.length }]);
      }

      setNewSong({ title: '', duration: '', key: '', notes: '' });
    } catch (error) {
      console.error('Error adding song:', error);
      setFeedback({
        open: true,
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
      setFeedback({
        open: true,
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
      setFeedback({
        open: true,
        title: 'Error',
        message: 'Failed to remove song. Please try again.',
        type: 'error'
      });
    }
  };

  const handleSave = async () => {
    if (!title) return;

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
            key: song.key,
            notes: song.notes,
            sort_order: song.sort_order
          }))
        });

        if (createError) throw createError;
      }

      setFeedback({
        open: true,
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
      setFeedback({
        open: true,
        title: 'Error',
        message: `Failed to ${setlistId ? 'update' : 'create'} setlist. Please try again.`,
        type: 'error'
      });
    }
  };

  const handleExport = async () => {
    if (!title || songs.length === 0) {
      setFeedback({
        open: true,
        title: 'Error',
        message: 'Cannot export empty setlist. Please add songs first.',
        type: 'error'
      });
      return;
    }

    try {
      await generateSetlistPDF(title, songs);
    } catch (error) {
      console.error('Error exporting setlist:', error);
      setFeedback({
        open: true,
        title: 'Error',
        message: 'Failed to export setlist. Please try again.',
        type: 'error'
      });
    }
  };

  return (
    <div className="space-y-4">
      <FeedbackDialog
        open={feedback.open}
        onOpenChange={(open) => setFeedback(prev => ({ ...prev, open }))}
        title={feedback.title}
        message={feedback.message}
        type={feedback.type}
      />

      <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-mono text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-black">
          {setlistId ? 'Edit Setlist' : 'Create New Setlist'}
      </h1>
      </div>

      <Input
        placeholder="Setlist Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-white bg-transparent "
      />

      <Card className="bg-[#1B254B] border-none">
        <CardHeader>
          <CardTitle className="text-white">Songs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr,100px,100px,1fr,40px] gap-2">
              <Input
                placeholder="Song Title"
                value={newSong.title}
                onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                className="text-white bg-transparent "
              />
              <Input
                placeholder="Duration"
                value={newSong.duration}
                onChange={(e) => setNewSong({ ...newSong, duration: e.target.value })}
                className="text-white bg-transparent "
              />
              <Input
                placeholder="Key"
                value={newSong.key}
                onChange={(e) => setNewSong({ ...newSong, key: e.target.value })}
                className="text-white bg-transparent "
              />
              <Input
                placeholder="Notes"
                value={newSong.notes}
                onChange={(e) => setNewSong({ ...newSong, notes: e.target.value })}
                className="text-white bg-transparent"
              />
              <Button
                onClick={handleAddSong}
                variant="ghost"
                size="icon"
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
                            className="grid grid-cols-[1fr,100px,100px,1fr,40px] gap-2 items-center bg-[#111C44] p-2 mb-2 rounded-md"
                          >
                            <div className="flex items-center gap-2">
                              <span {...provided.dragHandleProps}>
                                <GripVertical className="h-4 w-4 text-gray-500" />
                              </span>
                              <span className="text-white">{song.title}</span>
                            </div>
                            <span className="text-white">{song.duration}</span>
                            <span className="text-white">{song.key}</span>
                            <span className="text-white truncate">{song.notes}</span>
                            <Button
                              onClick={() => handleRemoveSong(song.id, index)}
                              variant="ghost"
                              size="icon"
                              className="text-white hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
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
            onClick={handleExport}
            variant="outline"
            className="gap-2  text-slate-700 hover:text-slate-800 bg-neutral-300 hover:bg-neutral-400"
            disabled={!title || songs.length === 0}
          >
            <FileDown className="h-4 w-4 text-red-700 hover:text-red-800 "/>
            Export PDF
          </Button>
          <Button
            onClick={handleSave}
            variant="default"
            className="bg-green-800 hover:bg-green-700 text-white"
            disabled={!title}
          >
            {setlistId ? 'Update' : 'Create'} Setlist
          </Button>
        </div>
      </div>
    </div>
  );
} 