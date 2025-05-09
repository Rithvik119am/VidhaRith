"use client";

import { useState, useMemo } from "react";
import { useQuery, useAction } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Assuming you have this
import { Progress } from "@/components/ui/progress"; // Assuming you have this
import { toast } from "sonner";
import {
    AlertCircle,
    BrainCircuit,
    CheckCircle2,
    Info,
    Loader2,
    TrendingDown,
    TrendingUp,
    User,
    Users,
    FileText, // For Response ID
    HelpCircle, // For "Not available"
    BarChart3, // For Analysis section title
} from "lucide-react";

// Helper function to format percentage (no change needed)
const formatPercentage = (value: number | undefined): string => {
    if (typeof value !== 'number' || isNaN(value)) return "N/A";
    return `${value.toFixed(1)}%`;
};

// --- Sub-Components for Better Structure ---

interface PerformanceData {
    correct?: number;
    total?: number;
    percentage?: number;
}

interface TopicPerformanceSummary {
    correct: number;
    total: number;
    percentage: number;
}

interface CollectiveAnalysisData {
    topicPerformanceSummary: TopicPerformanceSummary;
    collectiveWeaknesses: string[];
    collectiveFocusAreas: string[];
}

interface IndividualPerformanceData {
    responseId: string;
    performanceByTopic: TopicPerformanceSummary;
    weakTopics: string[];
    strongTopics: string[];
    individualFocusAreas: string[];
}

interface AnalysisPayload {
    collectiveAnalysis?: CollectiveAnalysisData;
    individualAnalysis?: IndividualPerformanceData[];
}

interface FullAnalysisData {
    _id: Id<"form_responses_analysis">;
    formId: Id<"forms">;
    analysis?: AnalysisPayload | null;
    // Add other fields from your analysis document if any
}


// Skeleton for loading state
const AnalysisSkeletons = () => (
    <div className="space-y-6 mt-6">
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-5 w-1/3 mt-3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
            </CardContent>
        </Card>
        <div>
            <Skeleton className="h-6 w-1/3 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2 mt-1" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </div>
);

// Reusable Info Alert
const InfoAlert = ({ title, description, icon }: { title: string, description: string, icon?: React.ReactNode }) => (
    <Alert variant="default" className="mt-6 bg-sky-50 border-sky-200 text-sky-700">
        {icon || <Info className="h-5 w-5 text-sky-600" />}
        <AlertTitle className="font-semibold">{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
    </Alert>
);

// Performance Meter (Simple Text + Progress Bar)
const PerformanceMeter = ({ correct, total, percentage, label = "Performance" }: { correct?: number, total?: number, percentage?: number, label?: string }) => {
    if (typeof correct !== 'number' || typeof total !== 'number' || typeof percentage !== 'number') {
        return <p className="text-sm text-muted-foreground italic">{label}: Data unavailable</p>;
    }
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{label}: {correct} / {total}</span>
                <Badge variant={percentage > 70 ? "secondary" : percentage > 40 ? "default" : "destructive"} className="text-xs">
                    {formatPercentage(percentage)}
                </Badge>
            </div>
            <Progress value={percentage} className="h-2" />
        </div>
    );
};


// Card for Collective Analysis
const CollectiveAnalysisCard = ({ analysis }: { analysis: CollectiveAnalysisData | undefined }) => {
    if (!analysis) {
        return (
            <Card className="shadow-lg border-blue-200">
                <CardHeader className="bg-blue-50">
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                        <Users className="h-6 w-6" /> Collective Insights
                    </CardTitle>
                    <CardDescription>Overall trends across all responses.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center text-muted-foreground py-8">
                        <HelpCircle className="h-5 w-5 mr-2" />
                        Collective analysis data is not available.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg border-blue-200 transform hover:scale-[1.01] transition-transform duration-300 ease-out">
            <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Users className="h-6 w-6" /> Collective Insights
                </CardTitle>
                <CardDescription>Overall trends from all submitted responses.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <PerformanceMeter
                    label="Overall Performance"
                    correct={analysis.topicPerformanceSummary.correct}
                    total={analysis.topicPerformanceSummary.total}
                    percentage={analysis.topicPerformanceSummary.percentage}
                />
                <div>
                    <h4 className="font-semibold flex items-center gap-2 text-red-600 mb-2">
                        <TrendingDown className="h-5 w-5" /> Collective Weaknesses
                    </h4>
                    {analysis.collectiveWeaknesses.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 pl-2">
                            {analysis.collectiveWeaknesses.map((item, idx) => <li key={`cw-${idx}`}>{item}</li>)}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground italic">No significant collective weaknesses identified.</p>}
                </div>
                <div>
                    <h4 className="font-semibold flex items-center gap-2 text-green-600 mb-2">
                        <TrendingUp className="h-5 w-5" /> Collective Focus Areas
                    </h4>
                    {analysis.collectiveFocusAreas.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 pl-2">
                            {analysis.collectiveFocusAreas.map((item, idx) => <li key={`cf-${idx}`}>{item}</li>)}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground italic">No specific collective focus areas suggested by the AI.</p>}
                </div>
            </CardContent>
             <CardFooter className="bg-gray-50/50 p-3 text-xs text-muted-foreground">
                Analysis based on {analysis.topicPerformanceSummary.total} total graded elements across responses.
            </CardFooter>
        </Card>
    );
};

// Card for Individual Analysis
const IndividualAnalysisCard = ({ individualData }: { individualData: IndividualPerformanceData }) => {
    return (
        <Card className="shadow-lg border-purple-200 transform hover:scale-[1.01] transition-transform duration-300 ease-out">
            <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardTitle className="flex items-center gap-2 text-sm text-purple-700">
                    <FileText className="h-4 w-4" /> Response ID:
                    <code className="text-xs break-all bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">{individualData.responseId}</code>
                </CardTitle>
                <CardDescription className="mt-1">
                     <PerformanceMeter
                        correct={individualData.performanceByTopic.correct}
                        total={individualData.performanceByTopic.total}
                        percentage={individualData.performanceByTopic.percentage}
                    />
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-sm">
                <div>
                    <h5 className="font-semibold flex items-center gap-1.5 text-red-500 mb-1">
                        <TrendingDown className="h-4 w-4" /> Areas for Improvement:
                    </h5>
                    {individualData.weakTopics.length > 0 ? (
                        <ul className="list-disc list-inside mt-1 text-gray-600 space-y-1 pl-2">
                            {individualData.weakTopics.map((item, idx) => <li key={`iw-${idx}`}>{item}</li>)}
                        </ul>
                    ) : <p className="text-muted-foreground italic mt-1">Great job! No specific weak areas identified.</p>}
                </div>
                <div>
                    <h5 className="font-semibold flex items-center gap-1.5 text-green-500 mb-1">
                        <TrendingUp className="h-4 w-4" /> Strong Areas:
                    </h5>
                    {individualData.strongTopics.length > 0 ? (
                        <ul className="list-disc list-inside mt-1 text-gray-600 space-y-1 pl-2">
                            {individualData.strongTopics.map((item, idx) => <li key={`is-${idx}`}>{item}</li>)}
                        </ul>
                    ) : <p className="text-muted-foreground italic mt-1">No specific strong areas highlighted.</p>}
                </div>
                <div>
                    <h5 className="font-semibold flex items-center gap-1.5 text-indigo-500 mb-1">
                        <BrainCircuit className="h-4 w-4" /> Recommended Focus:
                    </h5>
                    {individualData.individualFocusAreas.length > 0 ? (
                        <ul className="list-disc list-inside mt-1 text-gray-600 space-y-1 pl-2">
                            {individualData.individualFocusAreas.map((item, idx) => <li key={`if-${idx}`}>{item}</li>)}
                        </ul>
                    ) : <p className="text-muted-foreground italic mt-1">No specific focus areas suggested by the AI.</p>}
                </div>
            </CardContent>
        </Card>
    );
};

// Main Display for Analysis Data (using Tabs)
const AnalysisDisplay = ({ analysisData }: { analysisData: FullAnalysisData | null | undefined }) => {
    if (!analysisData?.analysis) { // If analysis object itself is null or undefined within analysisData
        return (
             <InfoAlert
                title="Analysis Data Pending"
                description="The analysis results are not yet available. If you've recently generated them, please wait a moment for the data to load. Otherwise, try generating the analysis."
                icon={<BarChart3 className="h-5 w-5 text-sky-600"/>}
            />
        )
    }

    const { collectiveAnalysis, individualAnalysis } = analysisData.analysis;

    return (
        <Tabs defaultValue="collective" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                <TabsTrigger value="collective" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                    <Users className="h-4 w-4 mr-2" /> Collective View
                </TabsTrigger>
                <TabsTrigger value="individual" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                    <User className="h-4 w-4 mr-2" /> Individual View
                </TabsTrigger>
            </TabsList>

            <TabsContent value="collective" className="mt-6">
                <CollectiveAnalysisCard analysis={collectiveAnalysis} />
            </TabsContent>

            <TabsContent value="individual" className="mt-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-purple-700">
                    <User className="h-5 w-5" /> Individual Response Breakdowns
                </h3>
                {individualAnalysis && individualAnalysis.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {individualAnalysis.map((individual, index) => (
                            <IndividualAnalysisCard key={individual.responseId || index} individualData={individual} />
                        ))}
                    </div>
                ) : (
                    <Card className="shadow-sm border-gray-200">
                        <CardContent className="pt-6">
                             <div className="flex items-center justify-center text-muted-foreground py-8">
                                <HelpCircle className="h-5 w-5 mr-2" />
                                No individual analysis data available.
                            </div>
                        </CardContent>
                    </Card>
                )}
            </TabsContent>
        </Tabs>
    );
};


// --- Main Component ---
export default function FormAnalysis({ formId }: { formId: Id<"forms"> }) {
    const analysisData = useQuery(api.form_responses_analysis.getAnalysis, { formId });
    const responses = useQuery(api.form_responses.getFormResponses, { formId });
    const generateAnalysis = useAction(api.form_responses_analysis.generateAnalysis);

    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateAnalysis = async () => {
        setIsGenerating(true);
        toast.info("Starting analysis generation... This may take a moment.", {
            icon: <Loader2 className="h-4 w-4 animate-spin" />,
            duration: 5000, // Give it a bit longer default duration
        });
        try {
            const result = await generateAnalysis({ formId });
            toast.success(result?.message || "Analysis generated successfully! Data will refresh.", {
                icon: <CheckCircle2 className="h-4 w-4" />
            });
        } catch (error: any) {
            console.error("Failed to generate analysis:", error);
            const errorMessage = error?.data?.message || error?.message || (typeof error === 'string' && error) || "An unknown error occurred.";
            toast.error(`Analysis generation failed: ${errorMessage}`, {
                icon: <AlertCircle className="h-4 w-4" />,
                duration: 8000, // Show error for longer
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const isLoadingResponses = responses === undefined;
    const isLoadingAnalysis = analysisData === undefined; // True when the query is first fetching
    const hasResponses = useMemo(() => responses && responses.length > 0, [responses]);

    // Determine the state for rendering UI
    const showLoadingSkeletons = isLoadingAnalysis && analysisData === undefined; // Only initial load
    const showNoResponsesMessage = !isLoadingResponses && !hasResponses;
    const showAnalysisNotYetGenerated = !isLoadingAnalysis && analysisData === null && hasResponses;
    const showAnalysisDisplay = !isLoadingAnalysis && analysisData && analysisData.analysis; // Check if analysis field within data exists


    return (
        <div className="space-y-8 my-8 p-4 md:p-6 bg-slate-50 rounded-lg shadow-md">
            <Card className="shadow-xl border-t-4 border-primary overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold text-primary">
                        <BrainCircuit className="h-7 w-7" /> AI Response Analysis
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-1">
                        Generate and review insights into collective and individual performance based on submitted form responses.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {isLoadingResponses ? (
                         <div className="flex items-center space-x-3">
                            <Skeleton className="h-10 w-48" />
                            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin"/>
                         </div>
                    ) : hasResponses ? (
                        <Button
                            onClick={handleGenerateAnalysis}
                            disabled={isGenerating || isLoadingResponses}
                            size="lg"
                            className="bg-primary hover:bg-primary/90 text-white"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Insights...
                                </>
                            ) : (
                                analysisData ? "Regenerate Analysis" : "Generate Analysis"
                            )}
                        </Button>
                    ) : (
                        <InfoAlert
                            title="No Responses Submitted Yet"
                            description="Analysis cannot be generated until at least one response has been submitted for this form."
                            icon={<FileText className="h-5 w-5 text-sky-600" />}
                        />
                    )}
                </CardContent>
                {isGenerating && (
                    <CardFooter className="text-sm text-muted-foreground p-4 bg-slate-50 border-t">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Please wait while the AI processes the responses. The analysis results will appear below once complete. This can take a few moments depending on the number of responses.
                    </CardFooter>
                )}
            </Card>

            {/* Analysis Display Section */}
            {showLoadingSkeletons && <AnalysisSkeletons />}

            {showNoResponsesMessage && !isLoadingResponses && (
                <div className="mt-6"> {/* This message is already handled by the button section but good to have a placeholder spot if logic changes */}
                    {/* Redundant if the InfoAlert in CardContent is shown, but kept for clarity of states */}
                </div>
            )}

            {showAnalysisNotYetGenerated && (
                 <InfoAlert
                    title="Analysis Not Yet Generated"
                    description="Click the 'Generate Analysis' button above to process the submitted responses and view insights."
                    icon={<BarChart3 className="h-5 w-5 text-sky-600"/>}
                />
            )}

            {showAnalysisDisplay && analysisData && <AnalysisDisplay analysisData={analysisData} />}

        </div>
    );
}