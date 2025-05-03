"use client";

import { useState } from "react";
import { useQuery, useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api'; // Adjust path if needed
import { Id } from "../../../../convex/_generated/dataModel"; // Adjust path if needed
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertCircle, BrainCircuit, CheckCircle2, Info, Loader2, TrendingDown, TrendingUp, User, Users } from "lucide-react"; // Import relevant icons

// Helper function to format percentage
const formatPercentage = (value: number | undefined) => {
    if (typeof value !== 'number' || isNaN(value)) return "N/A";
    return `${value.toFixed(1)}%`;
};

export default function FormAnalysis({ formId }: { formId: Id<"forms"> }) {

    // Fetch existing analysis data
    const analysisData = useQuery(api.form_responses_analysis.getAnalysis, { formId });
    // Fetch responses to check if analysis can be generated
    const responses = useQuery(api.form_responses.getFormResponses, { formId });
    // Get the action to trigger analysis generation
    const generateAnalysis = useAction(api.form_responses_analysis.generateAnalysis);

    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateAnalysis = async () => {
        setIsGenerating(true);
        toast.info("Starting analysis generation... This may take a moment.", {
             icon: <Loader2 className="h-4 w-4 animate-spin" />
        });
        try {
            const result = await generateAnalysis({ formId });
            toast.success(result?.message || "Analysis generated successfully!", {
                 icon: <CheckCircle2 className="h-4 w-4" />
            });
            // The useQuery for analysisData should refetch automatically
        } catch (error: any) {
            console.error("Failed to generate analysis:", error);
            toast.error(`Analysis generation failed: ${error?.data?.message || error?.message || error.toString()}`, {
                 icon: <AlertCircle className="h-4 w-4" />
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const hasResponses = responses && responses.length > 0;
    const isLoadingResponses = responses === undefined;
    const isLoadingAnalysis = analysisData === undefined; // Separate loading state for analysis

    return (
        <div className="space-y-6 mt-4">
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-primary" /> AI Response Analysis
                    </CardTitle>
                    <CardDescription>
                        Generate insights into collective and individual performance based on submitted responses.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingResponses ? (
                         <Skeleton className="h-10 w-48" />
                    ) : hasResponses ? (
                        <Button
                            onClick={handleGenerateAnalysis}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                                </>
                            ) : (
                                "Generate / Regenerate Analysis"
                            )}
                        </Button>
                    ) : (
                        <Alert variant="default">
                            <Info className="h-4 w-4" />
                            <AlertTitle>No Responses Yet</AlertTitle>
                            <AlertDescription>
                                Analysis cannot be generated until at least one response has been submitted.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
                 {isGenerating && (
                     <CardFooter className="text-sm text-muted-foreground">
                        Please wait while the AI processes the responses. The analysis results will appear below once complete.
                     </CardFooter>
                 )}
            </Card>

            {/* Analysis Display Section */}
            {isLoadingAnalysis && !analysisData && ( // Show skeleton only if loading and no data yet
                <div className="space-y-4 mt-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            )}

             {/* Handle case where analysis is explicitly null (e.g., no record exists yet or query error) */}
            {!isLoadingAnalysis && analysisData === null && hasResponses && (
                <Alert variant="default" className="mt-6">
                    <Info className="h-4 w-4"/>
                    <AlertTitle>Analysis Not Generated</AlertTitle>
                    <AlertDescription>
                        Click the button above to generate the initial analysis for the submitted responses.
                    </AlertDescription>
                </Alert>
            )}

             {/* Display Analysis Data if available */}
            {!isLoadingAnalysis && analysisData && (
                <div className="space-y-6 mt-6">
                     {/* Collective Analysis */}
                     <Card className="shadow-sm border-blue-200">
                        <CardHeader className="bg-blue-50/50">
                           <CardTitle className="flex items-center gap-2 text-blue-800">
                               <Users className="h-5 w-5" /> Collective Analysis
                            </CardTitle>
                             <CardDescription>Overall trends across all responses.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                           {analysisData.analysis?.collectiveAnalysis ? (
                              <>
                                 <div className="flex items-center gap-2">
                                    <strong>Overall Performance:</strong>
                                    <Badge variant="secondary" className="text-sm">
                                       Correct: {analysisData.analysis.collectiveAnalysis.topicPerformanceSummary.correct} / {analysisData.analysis.collectiveAnalysis.topicPerformanceSummary.total}
                                       ({formatPercentage(analysisData.analysis.collectiveAnalysis.topicPerformanceSummary.percentage)})
                                    </Badge>
                                 </div>
                                 <div>
                                    <strong className="flex items-center gap-1 text-red-700"><TrendingDown className="h-4 w-4" /> Collective Weaknesses:</strong>
                                    {analysisData.analysis.collectiveAnalysis.collectiveWeaknesses.length > 0 ? (
                                        <ul className="list-disc list-inside mt-1 text-sm text-muted-foreground space-y-1">
                                            {analysisData.analysis.collectiveAnalysis.collectiveWeaknesses.map((item, idx) => <li key={`cw-${idx}`}>{item}</li>)}
                                        </ul>
                                    ) : <p className="text-sm text-muted-foreground italic mt-1">None identified.</p>}
                                 </div>
                                 <div>
                                    <strong className="flex items-center gap-1 text-green-700"><TrendingUp className="h-4 w-4" /> Collective Focus Areas:</strong>
                                    {analysisData.analysis.collectiveAnalysis.collectiveFocusAreas.length > 0 ? (
                                       <ul className="list-disc list-inside mt-1 text-sm text-muted-foreground space-y-1">
                                          {analysisData.analysis.collectiveAnalysis.collectiveFocusAreas.map((item, idx) => <li key={`cf-${idx}`}>{item}</li>)}
                                       </ul>
                                    ) : <p className="text-sm text-muted-foreground italic mt-1">No specific focus areas suggested.</p>}
                                 </div>
                              </>
                           ) : <p className="text-muted-foreground italic">Collective analysis data not available.</p>}
                        </CardContent>
                     </Card>

                    {/* Individual Analysis */}
                    <h3 className="text-lg font-semibold pt-4">Individual Response Analysis</h3>
                     {analysisData.analysis?.individualAnalysis && analysisData.analysis.individualAnalysis.length > 0 ? (
                        analysisData.analysis.individualAnalysis.map((individual, index) => (
                             <Card key={individual.responseId || index} className="shadow-sm border-purple-200">
                                <CardHeader className="bg-purple-50/50">
                                    <CardTitle className="flex items-center gap-2 text-sm text-purple-800">
                                        <User className="h-4 w-4" /> Response ID: <code className="text-xs break-all">{individual.responseId}</code>
                                    </CardTitle>
                                    <CardDescription>
                                         Performance:
                                          <Badge variant="outline" className="ml-2 text-xs">
                                            {individual.performanceByTopic.correct} / {individual.performanceByTopic.total} correct ({formatPercentage(individual.performanceByTopic.percentage)})
                                          </Badge>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3 text-sm">
                                    <div>
                                        <strong className="flex items-center gap-1 text-red-600"><TrendingDown className="h-4 w-4"/> Weak Topics/Questions:</strong>
                                        {individual.weakTopics.length > 0 ? (
                                            <ul className="list-disc list-inside mt-1 text-muted-foreground space-y-1">
                                                {individual.weakTopics.map((item, idx) => <li key={`iw-${idx}`}>{item}</li>)}
                                            </ul>
                                        ) : <p className="text-muted-foreground italic mt-1">None identified.</p>}
                                    </div>
                                     <div>
                                        <strong className="flex items-center gap-1 text-green-600"><TrendingUp className="h-4 w-4"/> Strong Topics/Questions:</strong>
                                         {individual.strongTopics.length > 0 ? (
                                            <ul className="list-disc list-inside mt-1 text-muted-foreground space-y-1">
                                                {individual.strongTopics.map((item, idx) => <li key={`is-${idx}`}>{item}</li>)}
                                            </ul>
                                        ) : <p className="text-muted-foreground italic mt-1">None identified.</p>}
                                    </div>
                                     <div>
                                        <strong className="flex items-center gap-1 text-indigo-600"><BrainCircuit className="h-4 w-4"/> Focus Areas:</strong>
                                         {individual.individualFocusAreas.length > 0 ? (
                                            <ul className="list-disc list-inside mt-1 text-muted-foreground space-y-1">
                                                {individual.individualFocusAreas.map((item, idx) => <li key={`if-${idx}`}>{item}</li>)}
                                            </ul>
                                        ) : <p className="text-muted-foreground italic mt-1">No specific focus areas suggested.</p>}
                                    </div>
                                </CardContent>
                             </Card>
                        ))
                    ) : (
                        <p className="text-muted-foreground italic mt-4 text-center">No individual analysis data available.</p>
                    )}
                </div>
            )}
        </div>
    );
}
