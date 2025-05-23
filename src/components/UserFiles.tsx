"use client";

import React, { useState, useRef, ChangeEvent } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from '../../convex/_generated/dataModel';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";


import { Upload, Trash2, Loader2, File as FileIcon, DownloadIcon } from 'lucide-react';

import { toast } from "sonner";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function UserFiles() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [deletingFileId, setDeletingFileId] = useState<Id<"files"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [viewingFile, setViewingFile] = useState<Doc<"files"> | null>(null);
  const [isFetchingDownloadUrl, setIsFetchingDownloadUrl] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null); 
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const sendFile = useMutation(api.files.sendFile);
  const userFiles = useQuery(api.files.getUserFiles, {});
  const deleteFile = useMutation(api.files.deleteFile);

  const getDownloadUrl = useMutation(api.files.getDownloadUrl); 

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`File is too large. Max size is ${MAX_FILE_SIZE_MB} MB.`);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; 
        }
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile) {
      toast.warning("Please select a file first.");
      return;
    }

    setIsUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      if (typeof postUrl !=="string"){
        throw new Error(postUrl.error)
      }
      

      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!result.ok) {
         const errorBody = await result.text();
         console.error("Upload failed:", result.statusText, errorBody);
        throw new Error(`Upload failed: ${result.statusText}`);
      }

      const { storageId } = await result.json();
      if (!storageId) {
           console.error("Upload response did not contain storageId:", await result.text());
           throw new Error("Upload completed but failed to get storage ID.");
      }

      const status=await sendFile({
        storageId,
        name: selectedFile.name,
        type: selectedFile.type,
      });
      if (status.error) {
        throw new Error(`Failed to save file metadata: ${status.error}`);
      }

      toast.success(`"${selectedFile.name}" uploaded successfully!`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
        console.error("File upload process failed:", error);
        const errorMessage = error.data?.message || error.message || "An unknown error occurred";
        toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

 const handleDeleteClick = (fileId: Id<"files">) => {
    setDeletingFileId(fileId);
  };

  const confirmDelete = async () => {
      if (!deletingFileId) return;

      setIsDeleting(true);
      try {
          await deleteFile({ fileId: deletingFileId });
          toast.success("File deleted successfully!");
          setDeletingFileId(null); 
      } catch (error: any) {
          console.error("Failed to delete file:", error);
          const errorMessage = error.data?.message || error.message || "An unknown error occurred";
          toast.error(`Failed to delete file: ${errorMessage}`);
      } finally {
          setIsDeleting(false);
      }
  };

    const handleViewFileClick = (file: Doc<"files">) => {
        setViewingFile(file); 
    };
    const handleDownloadClick = async () => {
        if (!viewingFile) return;

        setIsFetchingDownloadUrl(true);
        try {
            const downloadUrl = await getDownloadUrl({ fileId: viewingFile._id });

            if (!downloadUrl) {
                 throw new Error("Received no download URL from backend.");
            }

            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = viewingFile.name; 
            link.target = '_blank'; 
            link.rel = 'noopener noreferrer'; 

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);

            toast.success(`Download attempted for "${viewingFile.name}"`); 

        } catch (error: any) {
             console.error("Failed to get download URL or download:", error);
             const errorMessage = error.data?.message || error.message || "An unknown error occurred";
             toast.error(`Failed to start download: ${errorMessage}`);
        } finally {
             setIsFetchingDownloadUrl(false);
        }
    };


    return (
        <div className="container mx-auto py-8 space-y-6">
             <h2 className="text-2xl font-bold">Your Files</h2>

             <Card>
    <CardHeader>
        <CardTitle>Upload a New File</CardTitle>
        <CardDescription>Select a file (max {MAX_FILE_SIZE_MB} MB) and click Upload.</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            accept=".pdf"
            className="flex-grow hidden" 
            disabled={isUploading}
        />
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full sm:w-auto">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isUploading ? "Uploading..." : "Select and Upload File"}
        </Button>

        {selectedFile && (
             <div className="flex-grow text-sm text-gray-600 truncate">
                 Selected: {selectedFile.name}
             </div>
        )}
         
        <Button onClick={handleUploadClick} disabled={!selectedFile || isUploading} className="w-full sm:w-auto">
             {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
             {isUploading ? "Uploading..." : "Initiate Upload"}
         </Button>

    </CardContent>
</Card>

             <h3 className="text-xl font-semibold">Uploaded Files</h3>

            {userFiles === undefined && ( 
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            )}

            {userFiles && userFiles.length > 0 && ( 
                <Card>
                    <CardContent className="p-0">
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Uploaded</TableHead>
                                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {userFiles.map((file) => (
                                    <TableRow key={file._id}>
                                        <TableCell className="font-medium">
                                            <button
                                                onClick={() => handleViewFileClick(file)}
                                                className="flex items-center gap-2 hover:underline text-primary text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={isDeleting || isUploading} 
                                            >
                                                 <FileIcon className="h-4 w-4 text-muted-foreground" />
                                                 {file.name}
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{file.type}</TableCell>
                                         <TableCell className="text-muted-foreground text-sm">
                                            {new Date(file._creationTime).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog open={deletingFileId === file._id} onOpenChange={(isOpen) => !isOpen && setDeletingFileId(null)}>
                                                <AlertDialogTrigger asChild>
                                                     <Button
                                                         variant="ghost"
                                                         size="icon"
                                                         aria-label={`Delete file "${file.name}"`}
                                                         onClick={() => handleDeleteClick(file._id)}
                                                          disabled={isDeleting && deletingFileId === file._id}
                                                     >
                                                          {isDeleting && deletingFileId === file._id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            )}
                                                     </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the file
                                                            <span className="font-semibold"> &ldquo;{userFiles.find(f => f._id === deletingFileId)?.name}&ldquo; </span>
                                                            from storage and remove its record.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel onClick={() => setDeletingFileId(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
                                                             {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

             {userFiles && userFiles.length === 0 && ( 
                <div className="text-center p-6 border rounded-md bg-muted/20">
                    <p className="text-muted-foreground">You haven&quot;t uploaded any files yet.</p>
                </div>
            )}

            <Dialog open={viewingFile !== null} onOpenChange={(isOpen) => !isOpen && setViewingFile(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>File Details</DialogTitle>
                         <DialogDescription>
                             {viewingFile?.name}
                         </DialogDescription>
                    </DialogHeader>

                     <div className="space-y-2">
                         <div>
                             <span className="font-semibold">Type:</span> {viewingFile?.type}
                         </div>
                         <div>
                             <span className="font-semibold">Uploaded:</span> {viewingFile ? new Date(viewingFile._creationTime).toLocaleString() : '-'}
                         </div>
                     </div>

                    <DialogFooter>
                        <Button onClick={handleDownloadClick} disabled={isFetchingDownloadUrl || !viewingFile}>
                             {isFetchingDownloadUrl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadIcon className="mr-2 h-4 w-4" />}
                             {isFetchingDownloadUrl ? "Getting URL..." : "Download File"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}