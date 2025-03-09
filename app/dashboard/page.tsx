"use client";

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Move } from "lucide-react";

interface Note {
  id: string;
  content: string;
  position: { x: number; y: number };
}

export default function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleAddNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      content: "New note...",
      position: { x: 100, y: 100 },
    };
    setNotes([...notes, newNote]);
  };

  const handleMouseDown = (e: React.MouseEvent, noteId: string) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setCurrentNote(noteId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !currentNote || !canvasRef.current) return;

    const canvas = canvasRef.current.getBoundingClientRect();
    
    setNotes(notes.map(note => {
      if (note.id === currentNote) {
        return {
          ...note,
          position: {
            x: e.clientX - canvas.left - 50,
            y: e.clientY - canvas.top - 20,
          },
        };
      }
      return note;
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setCurrentNote(null);
  };

  return (
    <div className="h-full relative">
      <div className="absolute top-4 right-4 z-10">
        <Button onClick={handleAddNote}>
          <Plus className="mr-2 h-4 w-4" /> Add Note
        </Button>
      </div>
      
      <div
        ref={canvasRef}
        className="w-full h-[calc(100vh-8rem)] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {notes.map((note) => (
          <Card
            key={note.id}
            className="absolute cursor-move w-48"
            style={{
              left: `${note.position.x}px`,
              top: `${note.position.y}px`,
              transform: isDragging && currentNote === note.id ? 'scale(1.02)' : 'scale(1)',
              transition: isDragging ? 'none' : 'transform 0.2s',
            }}
          >
            <CardHeader className="p-3">
              <div
                className="flex items-center gap-2"
                onMouseDown={(e) => handleMouseDown(e, note.id)}
              >
                <Move className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Note</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <textarea
                className="w-full bg-transparent border-none focus:outline-none resize-none"
                rows={3}
                value={note.content}
                onChange={(e) => {
                  setNotes(notes.map(n => 
                    n.id === note.id ? { ...n, content: e.target.value } : n
                  ));
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
