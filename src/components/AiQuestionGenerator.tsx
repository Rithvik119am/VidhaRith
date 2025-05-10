"use client";

import React, { useState } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api'; // Adjust path
import { Id } from '../../convex/_generated/dataModel'; // Adjust path
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react'; // For loading indicator
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea"

interface AiQuestionGeneratorProps {
    formId: Id<"forms">;
}

export default function AiQuestionGenerator({ formId }: AiQuestionGeneratorProps) {
    // Fetch user's uploaded files
    const userFiles = useQuery(api.files.getUserFiles);
    const formDetails = useQuery(api.forms.get, { formId });
    const generateQuestionsAction = useAction(api.aiQuestions.generateQuestions);
    const generateQuestionsURLAction = useAction(api.aiQuestions.generateQuestionsURL);

    const [selectedStorageId, setSelectedStorageId] = useState<Id<"_storage"> | "">("");
    const [numQuestions, setNumQuestions] = useState<number>(5); // Default number
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [url, setUrl] = useState<string>("");
    const [sourceType, setSourceType] = useState<'file' | 'url'>('file');


    const handleGenerateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null); // Clear previous errors

        if (numQuestions <= 0 || !Number.isInteger(numQuestions)) {
            setError("Please enter a positive whole number of questions.");
            toast.error("Please enter a positive whole number of questions.");
            return;
        }

        if (sourceType === 'file' && !selectedStorageId) {
            setError("Please select a file.");
            toast.error("Please select a file.");
            return;
        }

        if (sourceType === 'url' && !url) {
            setError("Please enter a URL.");
            toast.error("Please enter a URL.");
            return;
        }

        setIsLoading(true);
        try {
            let result;
            if (sourceType === 'file' && selectedStorageId) {
                result = await generateQuestionsAction({
                    formId: formId,
                    fileStorageId: selectedStorageId,
                    numberOfQuestions: numQuestions,
                });
            } else if (sourceType === 'url' && url) {
                result = await generateQuestionsURLAction({
                    formId: formId,
                    numberOfQuestions: numQuestions,
                    url: url,
                });
            }else{
                setError("Invalid source type or missing data.");
                toast.error("Invalid source type or missing data.");
                return;
            }

            if (result.success === false && result.error) {
                setError(result.error);
                toast.error(`Generation failed: ${result.error}`);
                return;
            }

            toast.success(`Successfully started generating ${result.count} questions! They will appear in the list shortly.`);
            // Reset form maybe? Or leave values? User preference.
            // setSelectedStorageId("");
            // setNumQuestions(5);
            //setUrl("")
        } catch (err: any) {
            console.error("Failed to trigger question generation:", err);
            const errorMessage = err.data?.message || err.message || "An unexpected error occurred.";
            setError(errorMessage);
            toast.error(`Generation failed: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-md border p-4 md:p-6 space-y-4 bg-secondary/30"> {/* Distinct background */}
            <h3 className="text-lg font-semibold mb-3">Generate Questions with AI</h3>
            <form onSubmit={handleGenerateSubmit} className="space-y-4">

                 {/* Source Type Selection */}
                <div>
                    <Label htmlFor="source-type">Source Type</Label>
                    <Select value={sourceType} onValueChange={(value) => setSourceType(value as 'file' | 'url')} disabled={isLoading}>
                        <SelectTrigger id="source-type">
                            <SelectValue placeholder="Select Source Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="file">File</SelectItem>
                            <SelectItem value="url">URL</SelectItem>
                        </SelectContent>
                    </Select>
                </div>


                {/* File Selection */}
                {sourceType === 'file' && (
                    <div>
                        <Label htmlFor="ai-file-select">Select File Content</Label>
                        {userFiles === undefined && <p className="text-sm text-muted-foreground">Loading files...</p>}
                        {userFiles && userFiles.length === 0 && <p className="text-sm text-muted-foreground">You haven&lsquo;t uploaded any files yet.</p>}
                        {userFiles && userFiles.length > 0 && (
                            <Select
                                value={selectedStorageId}
                                onValueChange={(value) => setSelectedStorageId(value as Id<"_storage">)} // Cast needed
                                required={sourceType === 'file'}
                                disabled={isLoading}
                            >
                                <SelectTrigger id="ai-file-select">
                                    <SelectValue placeholder="Select a file..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {userFiles.map((file) => (
                                        <SelectItem key={file._id} value={file.storageId}>
                                            {file.name} ({file.type})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                )}

                {/* URL Input */}
                {sourceType === 'url' && (
                    <div>
                        <Label htmlFor="url-input">Enter URL</Label>
                         <Textarea
                            id="url-input"
                            placeholder="https://example.com/article"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required={sourceType === 'url'}
                            disabled={isLoading}
                            className="w-full"
                        />
                    </div>
                )}

                {/* Number of Questions */}
                <div>
                    <Label htmlFor="num-questions">Number of Questions to Generate</Label>
                    <Input
                        id="num-questions"
                        type="number"
                        min="1"
                        max="50" // Match backend limit
                        step="1"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(parseInt(e.target.value, 10) || 1)} // Ensure integer, default to 1 on parse error
                        required
                        disabled={isLoading}
                        className="w-full md:w-1/3" // Adjust width
                    />
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={isLoading || (sourceType === 'file' && (!userFiles || userFiles.length === 0 || !selectedStorageId)) || (sourceType === 'url' && !url) || formDetails?.generationStatus === "generating"}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        "Generate Questions"
                    )}
                </Button>

                 {/* Display Error Messages */}
                {error && (
                     <p className="text-sm font-medium text-destructive mt-2">
                         Error: {error}
                     </p>
                 )}
            </form>
             <p className="text-xs text-muted-foreground mt-2">
                Note: AI generation may take a moment. Generated questions will appear in the list above once processed. Assumes file or URL content contains text suitable for question generation.
            </p>
        </div>
    );
}