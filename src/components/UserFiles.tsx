"use client";

import React, { useState, useRef, ChangeEvent, DragEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Trash2,
  Loader2,
  FileText,
  Download,
  Calendar,
  HardDrive,
  CloudUpload,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function UserFiles() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

  const handleFileSelection = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File is too large. Max size is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    if (!file.type.includes("pdf")) {
      toast.error("Only PDF files are accepted.");
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
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
      if (typeof postUrl !== "string") {
        throw new Error(postUrl.error);
      }

      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }

      const { storageId } = await result.json();
      if (!storageId) {
        throw new Error("Upload completed but failed to get storage ID.");
      }

      const status = await sendFile({
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
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("File upload process failed:", error);
      toast.error(`Upload failed: ${error.message || "An unknown error occurred"}`);
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
      toast.error(`Failed to delete file: ${error.message || "An unknown error occurred"}`);
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

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = viewingFile.name;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Download started for "${viewingFile.name}"`);
    } catch (error: any) {
      toast.error(`Failed to start download: ${error.message || "An unknown error occurred"}`);
    } finally {
      setIsFetchingDownloadUrl(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Your Files</h1>
        <p className="text-gray-500 mt-1">
          Upload PDF materials to generate AI-powered quizzes
        </p>
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
          disabled={isUploading}
        />

        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          animate={{
            borderColor: isDragging ? "#6E59A5" : selectedFile ? "#4ECDC4" : "#e5e7eb",
            backgroundColor: isDragging ? "rgba(110, 89, 165, 0.05)" : selectedFile ? "rgba(78, 205, 196, 0.05)" : "white",
          }}
          className={`relative rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer ${
            !selectedFile && "hover:border-quiz-primary hover:bg-quiz-light/20"
          }`}
        >
          <div className="flex flex-col items-center justify-center text-center">
            {selectedFile ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-quiz-mint/20 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-quiz-mint" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex items-center gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(110, 89, 165, 0.2)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUploadClick();
                    }}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white font-semibold rounded-xl shadow-lg shadow-quiz-primary/20 disabled:opacity-50 transition-all"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload File
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <>
                <motion.div
                  animate={{ y: isDragging ? -5 : 0 }}
                  className="w-16 h-16 mx-auto rounded-2xl bg-quiz-light flex items-center justify-center mb-4"
                >
                  <CloudUpload className="w-8 h-8 text-quiz-primary" />
                </motion.div>
                <p className="font-semibold text-gray-900 mb-1">
                  {isDragging ? "Drop your file here" : "Drag & drop your PDF"}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse (max {MAX_FILE_SIZE_MB} MB)
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <FileText className="w-4 h-4" />
                  <span>PDF files only</span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Files List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Files</h2>

        {userFiles === undefined && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 border border-gray-100 space-y-3"
              >
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {userFiles && userFiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {userFiles.map((file, index) => (
                <motion.div
                  key={file._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)" }}
                  className="group bg-white rounded-xl border border-gray-100 p-4 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-quiz-coral/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-quiz-coral" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => handleViewFileClick(file)}
                        className="text-left w-full"
                      >
                        <p className="font-medium text-gray-900 truncate hover:text-quiz-primary transition-colors">
                          {file.name}
                        </p>
                      </button>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(file._creationTime)}
                        </span>
                      </div>
                    </div>
                    <AlertDialog
                      open={deletingFileId === file._id}
                      onOpenChange={(isOpen) => !isOpen && setDeletingFileId(null)}
                    >
                      <AlertDialogTrigger asChild>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteClick(file._id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this file?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete{" "}
                            <span className="font-semibold text-gray-900">
                              &ldquo;{userFiles.find((f) => f._id === deletingFileId)?.name}&rdquo;
                            </span>
                            . This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={() => setDeletingFileId(null)}
                            disabled={isDeleting}
                            className="rounded-xl"
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600 rounded-xl"
                          >
                            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {userFiles && userFiles.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200"
          >
            <HardDrive className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No files uploaded yet</p>
            <p className="text-sm text-gray-400">Upload your first PDF to get started</p>
          </motion.div>
        )}
      </motion.div>

      {/* File Details Dialog */}
      <Dialog open={viewingFile !== null} onOpenChange={(isOpen) => !isOpen && setViewingFile(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-quiz-coral/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-quiz-coral" />
              </div>
              <span className="truncate">{viewingFile?.name}</span>
            </DialogTitle>
            <DialogDescription>File details and download options</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">Type</span>
              <span className="font-medium text-gray-900">{viewingFile?.type}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">Uploaded</span>
              <span className="font-medium text-gray-900">
                {viewingFile ? new Date(viewingFile._creationTime).toLocaleString() : "-"}
              </span>
            </div>
          </div>

          <DialogFooter>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownloadClick}
              disabled={isFetchingDownloadUrl || !viewingFile}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white font-semibold rounded-xl shadow-lg shadow-quiz-primary/20 disabled:opacity-50 transition-all"
            >
              {isFetchingDownloadUrl ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isFetchingDownloadUrl ? "Getting URL..." : "Download File"}
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
