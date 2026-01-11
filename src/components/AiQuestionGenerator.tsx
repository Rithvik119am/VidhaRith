"use client";

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { useQuery, useAction, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2,
  Upload,
  FileText,
  Link,
  FolderOpen,
  CloudUpload,
  Check,
  Circle,
  Sparkles,
  Minus,
  Plus
} from 'lucide-react';
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

interface AiQuestionGeneratorProps {
  formId: Id<"forms">;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type SourceType = 'upload' | 'existing' | 'url';

export default function AiQuestionGenerator({ formId }: AiQuestionGeneratorProps) {
  const userFiles = useQuery(api.files.getUserFiles);
  const formDetails = useQuery(api.forms.get, { formId });
  const generateQuestionsAction = useAction(api.aiQuestions.generateQuestions);
  const generateQuestionsURLAction = useAction(api.aiQuestions.generateQuestionsURL);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const sendFile = useMutation(api.files.sendFile);

  const [sourceType, setSourceType] = useState<SourceType>('upload');
  const [selectedStorageId, setSelectedStorageId] = useState<Id<"_storage"> | "">("");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string>("");

  // Inline upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedStorageId, setUploadedStorageId] = useState<Id<"_storage"> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Progress states
  const [progressStep, setProgressStep] = useState(0);

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
    setUploadedStorageId(null);
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

  const uploadFile = async (): Promise<Id<"_storage"> | null> => {
    if (!selectedFile) return null;

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

      setUploadedStorageId(storageId);
      return storageId;
    } catch (error: any) {
      console.error("File upload process failed:", error);
      toast.error(`Upload failed: ${error.message || "An unknown error occurred"}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setProgressStep(0);

    if (numQuestions <= 0 || !Number.isInteger(numQuestions)) {
      setError("Please enter a positive whole number of questions.");
      toast.error("Please enter a positive whole number of questions.");
      return;
    }

    if (sourceType === 'existing' && !selectedStorageId) {
      setError("Please select a file.");
      toast.error("Please select a file.");
      return;
    }

    if (sourceType === 'upload' && !selectedFile && !uploadedStorageId) {
      setError("Please upload a file first.");
      toast.error("Please upload a file first.");
      return;
    }

    if (sourceType === 'url' && !url) {
      setError("Please enter a URL.");
      toast.error("Please enter a URL.");
      return;
    }

    setIsLoading(true);

    try {
      let storageIdToUse: Id<"_storage"> | null = null;

      // Step 1: Upload file if needed
      if (sourceType === 'upload') {
        setProgressStep(1);
        if (uploadedStorageId) {
          storageIdToUse = uploadedStorageId;
        } else {
          storageIdToUse = await uploadFile();
          if (!storageIdToUse) {
            setIsLoading(false);
            return;
          }
        }
      } else if (sourceType === 'existing') {
        setProgressStep(1);
        storageIdToUse = selectedStorageId as Id<"_storage">;
      } else {
        setProgressStep(1);
      }

      // Step 2: Generate questions
      setProgressStep(2);

      let result;
      if (sourceType === 'url') {
        result = await generateQuestionsURLAction({
          formId: formId,
          numberOfQuestions: numQuestions,
          url: url,
        });
      } else if (storageIdToUse) {
        result = await generateQuestionsAction({
          formId: formId,
          fileStorageId: storageIdToUse,
          numberOfQuestions: numQuestions,
        });
      } else {
        setError("No valid source selected.");
        toast.error("No valid source selected.");
        setIsLoading(false);
        return;
      }

      // Step 3: Complete
      setProgressStep(3);

      if (result.success === false && result.error) {
        setError(result.error);
        toast.error(`Generation failed: ${result.error}`);
        return;
      }

      toast.success(`Successfully generated ${result.count} questions!`);

      // Reset form
      setSelectedFile(null);
      setUploadedStorageId(null);
      setUrl("");
      setSelectedStorageId("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (err: any) {
      console.error("Failed to trigger question generation:", err);
      const errorMessage = err.data?.message || err.message || "An unexpected error occurred.";
      setError(errorMessage);
      toast.error(`Generation failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgressStep(0), 2000);
    }
  };

  const sourceTypes: { value: SourceType; label: string; icon: React.ReactNode }[] = [
    { value: 'upload', label: 'Upload New', icon: <Upload className="w-4 h-4" /> },
    { value: 'existing', label: 'My Files', icon: <FolderOpen className="w-4 h-4" /> },
    { value: 'url', label: 'URL', icon: <Link className="w-4 h-4" /> },
  ];

  const isFormDisabled = isLoading || isUploading || formDetails?.generationStatus === "generating";

  const canSubmit = () => {
    if (isFormDisabled) return false;
    if (numQuestions <= 0) return false;
    if (sourceType === 'upload' && !selectedFile && !uploadedStorageId) return false;
    if (sourceType === 'existing' && !selectedStorageId) return false;
    if (sourceType === 'url' && !url.trim()) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-quiz-light/50 rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-quiz-primary/10 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5 text-quiz-primary" />
                </motion.div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Generating {numQuestions} questions...</p>
                <p className="text-sm text-gray-500">Analyzing your content with AI</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { step: 1, label: sourceType === 'upload' ? 'Uploading file' : 'Reading content' },
                { step: 2, label: 'Generating questions' },
                { step: 3, label: 'Saving to form' },
              ].map(({ step, label }) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    progressStep >= step
                      ? 'bg-quiz-mint text-white'
                      : progressStep === step - 1
                      ? 'bg-quiz-primary/20 text-quiz-primary'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {progressStep > step ? (
                      <Check className="w-4 h-4" />
                    ) : progressStep === step ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Circle className="w-3 h-3" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    progressStep >= step ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Source Type Tabs */}
      {!isLoading && (
        <form onSubmit={handleGenerateSubmit} className="space-y-6">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl max-w-fit">
            {sourceTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setSourceType(type.value)}
                disabled={isFormDisabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  sourceType === type.value
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {type.icon}
                <span className="hidden sm:inline">{type.label}</span>
              </button>
            ))}
          </div>

          {/* Upload New Tab Content */}
          <AnimatePresence mode="wait">
            {sourceType === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                  disabled={isFormDisabled}
                />

                <motion.div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !selectedFile && !isFormDisabled && fileInputRef.current?.click()}
                  animate={{
                    borderColor: isDragging ? "#6E59A5" : selectedFile ? "#4ECDC4" : "#e5e7eb",
                    backgroundColor: isDragging ? "rgba(110, 89, 165, 0.05)" : selectedFile ? "rgba(78, 205, 196, 0.05)" : "white",
                  }}
                  className={`relative rounded-xl border-2 border-dashed p-6 transition-all ${
                    !selectedFile && !isFormDisabled ? "cursor-pointer hover:border-quiz-primary hover:bg-quiz-light/20" : ""
                  }`}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    {selectedFile ? (
                      <div className="space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-xl bg-quiz-mint/20 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-quiz-mint" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            setUploadedStorageId(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <motion.div
                          animate={{ y: isDragging ? -3 : 0 }}
                          className="w-12 h-12 mx-auto rounded-xl bg-quiz-light flex items-center justify-center mb-3"
                        >
                          <CloudUpload className="w-6 h-6 text-quiz-primary" />
                        </motion.div>
                        <p className="font-medium text-gray-900 text-sm mb-1">
                          {isDragging ? "Drop your file here" : "Drag & drop your PDF"}
                        </p>
                        <p className="text-xs text-gray-500">
                          or click to browse (max {MAX_FILE_SIZE_MB} MB)
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Existing Files Tab Content */}
            {sourceType === 'existing' && (
              <motion.div
                key="existing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Label htmlFor="ai-file-select" className="mb-2 block">Select from your uploaded files</Label>
                {userFiles === undefined && (
                  <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                )}
                {userFiles && userFiles.length === 0 && (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <FolderOpen className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No files uploaded yet</p>
                    <button
                      type="button"
                      onClick={() => setSourceType('upload')}
                      className="text-sm text-quiz-primary hover:underline mt-1"
                    >
                      Upload a file now
                    </button>
                  </div>
                )}
                {userFiles && userFiles.length > 0 && (
                  <Select
                    value={selectedStorageId}
                    onValueChange={(value) => setSelectedStorageId(value as Id<"_storage">)}
                    disabled={isFormDisabled}
                  >
                    <SelectTrigger id="ai-file-select" className="rounded-xl">
                      <SelectValue placeholder="Select a file..." />
                    </SelectTrigger>
                    <SelectContent>
                      {userFiles.map((file) => (
                        <SelectItem key={file._id} value={file.storageId}>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-quiz-coral" />
                            {file.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </motion.div>
            )}

            {/* URL Tab Content */}
            {sourceType === 'url' && (
              <motion.div
                key="url"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Label htmlFor="url-input" className="mb-2 block">Enter a URL to extract content from</Label>
                <Textarea
                  id="url-input"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isFormDisabled}
                  className="w-full rounded-xl resize-none"
                  rows={2}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Number of Questions */}
          <div>
            <Label htmlFor="num-questions" className="mb-2 block">Number of Questions</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setNumQuestions(Math.max(1, numQuestions - 5))}
                disabled={isFormDisabled || numQuestions <= 1}
                className="rounded-xl h-10 w-10"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                id="num-questions"
                type="number"
                min="1"
                max="50"
                step="1"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value, 10) || 1)}
                disabled={isFormDisabled}
                className="w-20 text-center rounded-xl"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setNumQuestions(Math.min(50, numQuestions + 5))}
                disabled={isFormDisabled || numQuestions >= 50}
                className="rounded-xl h-10 w-10"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-500">1-50 questions</span>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            type="submit"
            disabled={!canSubmit()}
            className="w-full rounded-xl bg-gradient-to-r from-quiz-primary to-quiz-secondary hover:opacity-90 h-12 text-base font-semibold"
          >
            {isLoading || isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isUploading ? "Uploading..." : "Generating..."}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate {numQuestions} Questions
              </>
            )}
          </Button>

          {error && (
            <p className="text-sm font-medium text-destructive">
              Error: {error}
            </p>
          )}

          <p className="text-xs text-gray-500 text-center">
            AI will analyze your content and generate multiple choice questions automatically.
          </p>
        </form>
      )}
    </div>
  );
}
