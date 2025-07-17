import * as React from "react";
import { useState } from "react";
import { X, Plus, File, FileText, Image, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uri: string;
}

interface FileContextProps {
  files: FileItem[];
  onFilesChange: (files: FileItem[]) => void;
}

const readFilesAsFileItems = (fileList: File[]): Promise<FileItem[]> => {
  return Promise.all(
    fileList.map(file => {
      return new Promise<FileItem>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          resolve({
            id: Date.now().toString() + Math.random(),
            name: file.name,
            type: file.type,
            size: file.size,
            uri: ""
          });
        };

        reader.onerror = () => reject(reader.error);

        reader.readAsText(file); // TODO: handle for non-text files
      });
    })
  );
};

export function FileContext({ files, onFilesChange }: FileContextProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.includes('text') || type.includes('json') || type.includes('xml')) return FileText;
    if (type.includes('javascript') || type.includes('typescript') || type.includes('html') || type.includes('css')) return Code;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const fileItems = await readFilesAsFileItems(selectedFiles);
    onFilesChange([...files, ...fileItems]);
    event.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const fileItems = await readFilesAsFileItems(droppedFiles);
    onFilesChange([...files, ...fileItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter(file => file.id !== id));
  };

  return (
    <div className="border border-border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">File Context</span>
        <Badge variant="secondary" className="text-xs">
          {files.length} files
        </Badge>
      </div>

      {files.length > 0 && (
        <ScrollArea className="flex-1 max-h-32 overflow-y-auto">
          <div className="space-y-2">
            {files.map((file) => {
              const IconComponent = getFileIcon(file.type);
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded-md group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/*<div*/}
      {/*  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${*/}
      {/*    isDragOver*/}
      {/*      ? 'border-primary bg-primary/5'*/}
      {/*      : 'border-muted-foreground/25 hover:border-muted-foreground/50'*/}
      {/*  } pointer-events-none opacity-50`}*/}
      {/*  onDragOver={handleDragOver}*/}
      {/*  onDragLeave={handleDragLeave}*/}
      {/*  onDrop={handleDrop}*/}
      {/*>*/}
      {/*  <div className="flex flex-col items-center gap-2">*/}
      {/*    <Plus className="h-5 w-5 text-muted-foreground" />*/}
      {/*    <div>*/}
      {/*      <p className="text-sm text-muted-foreground">*/}
      {/*        Drop files here or{' '}*/}
      {/*        <label className="text-primary hover:text-primary/80 cursor-pointer underline">*/}
      {/*          browse*/}
      {/*          <input*/}
      {/*            type="file"*/}
      {/*            multiple*/}
      {/*            className="hidden"*/}
      {/*            onChange={handleFileInput}*/}
      {/*            //accept=".txt,.js,.ts,.jsx,.tsx,.json,.md,.py,.html,.css,.xml"*/}
      {/*          />*/}
      {/*        </label>*/}
      {/*      </p>*/}
      {/*      <p className="text-xs text-muted-foreground mt-1">*/}
      {/*        Supports code, text, and image files*/}
      {/*      </p>*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*</div>*/}
    </div>
  );
}
