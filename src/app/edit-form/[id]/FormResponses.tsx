import { useMemo } from "react";
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Define a type for the processed response data
type ProcessedResponse = {
    _id: Id<"form_responses">;
    _creationTime: number;
    score: number;
    totalQuestions: number;
    detailedAnswers: {
        questionId: Id<"form_questions">;
        questionText: string;
        submittedValue: string;
        correctAnswer: string;
        isCorrect: boolean;
    }[];
};

export default function FormResponses({ formId }: { formId: Id<"forms"> }) {

    // 1. Fetch Responses
    const responses = useQuery(api.form_responses.getFormResponses, { formId });

    // 2. Fetch Questions (needed to check answers and get question text)
    const questions = useQuery(api.form_questions.getFormQuestions, { formId });

    // 3. Process data only when both responses and questions are loaded
    const analysisData = useMemo(() => {
        if (responses === undefined || questions === undefined) {
            return undefined; // Still loading
        }
        if (responses === null || questions === null || questions.length === 0) {
            // Handle error/no questions case as before
            return null;
        }
        if (responses.length === 0) {
            return { processedResponses: [], scoreCounts: {}, questionStats: {} }; // No responses
        }

        const questionsMap = new Map(questions.map(q => [q._id, q]));

        // --- Data Structures for Analysis ---
        const scoreCounts: { [score: number]: number } = {};
        // Map questionId to stats: { text: string, totalResponses: number, correctResponses: number }
        const questionStats: { [questionId: string]: { text: string; totalResponses: number; correctResponses: number } } = {};

        const processedResponses = responses.map((response) => {
            let score = 0;
            const detailedAnswers = response.values.map((submittedAnswer) => {
                const question = questionsMap.get(submittedAnswer.questionId);
                let isCorrect = false;
                let questionText = "Question not found (ID: " + submittedAnswer.questionId + ")";
                let correctAnswer = "-";

                if (question) {
                    questionText = question.question;
                    correctAnswer = question.answer;
                    isCorrect = question.answer.trim() === submittedAnswer.userSelectedOption.trim();
                    if (isCorrect) {
                        score++;
                    }

                    // --- Populate questionStats ---
                    const qIdString = submittedAnswer.questionId.toString(); // Use string key for object/map
                    if (!questionStats[qIdString]) {
                        questionStats[qIdString] = {
                            text: questionText,
                            totalResponses: 0,
                            correctResponses: 0,
                        };
                    }
                    questionStats[qIdString].totalResponses++;
                    if (isCorrect) {
                        questionStats[qIdString].correctResponses++;
                    }
                    // --- End Populate questionStats ---

                } else {
                    console.warn(`Question data not found for ID: ${submittedAnswer.questionId} in response ${response._id}`);
                    // Handle this case in stats? Maybe count how many times a question was missing?
                    // For simplicity, we'll just skip updating stats if the question is missing.
                }

                return {
                    questionId: submittedAnswer.questionId,
                    questionText: questionText,
                    submittedValue: submittedAnswer.userSelectedOption,
                    correctAnswer: correctAnswer,
                    isCorrect: isCorrect,
                };
            });

            // --- Populate scoreCounts ---
            scoreCounts[score] = (scoreCounts[score] || 0) + 1;
            // --- End Populate scoreCounts ---


            return {
                _id: response._id,
                _creationTime: response._creationTime,
                score: score,
                totalQuestions: questions.length,
                detailedAnswers: detailedAnswers,
            };
        });

        // Return both processed responses and the calculated stats
        return {
            processedResponses,
            scoreCounts,
            questionStats,
        };

    }, [responses, questions, formId]); // Dependencies remain the same

    // Format score distribution data for the chart
    const scoreDistributionData = useMemo(() => {
        if (!analysisData?.scoreCounts) return [];
        
        const totalQuestions = analysisData.processedResponses[0]?.totalQuestions || 0;
        const data = [];
        
        // Create an entry for each possible score (0 to totalQuestions)
        for (let i = 0; i <= totalQuestions; i++) {
            data.push({
                score: i,
                count: analysisData.scoreCounts[i] || 0,
                label: `${i}/${totalQuestions}`
            });
        }
        
        return data;
    }, [analysisData]);

    // Format question performance data for the visualization
    const questionPerformanceData = useMemo(() => {
        if (!analysisData?.questionStats) return [];
        
        return Object.entries(analysisData.questionStats).map(([qId, stats]) => ({
            id: qId,
            text: stats.text,
            correctPercentage: (stats.correctResponses / stats.totalResponses) * 100,
            correctCount: stats.correctResponses,
            totalCount: stats.totalResponses,
        }));
    }, [analysisData]);

    // Access the data outside the useMemo
    const processedResponses = analysisData?.processedResponses;
    const questionStats = analysisData?.questionStats;

    // --- Loading State ---
    if (processedResponses === undefined) {
        return (
            <div className="space-y-4 mt-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    // --- Error State (e.g., Questions missing but responses exist unexpectedly) ---
    if (processedResponses === null) {
        return (
            <div className="mt-6 text-center text-red-600 flex items-center justify-center gap-2 p-4 border border-red-200 bg-red-50 rounded-md">
                <AlertCircle className="h-5 w-5" />
                Could not load question details to evaluate responses. Please check form configuration.
            </div>
        );
    }

    // --- No Responses State ---
    if (processedResponses.length === 0) {
        return <p className="mt-6 text-center text-muted-foreground">No responses submitted yet. Share the form's URL to collect responses.</p>;
    }

    // --- Display Processed Responses ---
    return (
        <div className="space-y-6 mt-4">
            <h2 className="text-xl font-semibold">Responses ({processedResponses.length})</h2>

            {scoreDistributionData.length > 0 && (
                <Card className="w-full mb-6 shadow-sm">
                    <CardHeader>
                        <CardTitle>Score Distribution</CardTitle>
                        <CardDescription>Number of students achieving each score.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={scoreDistributionData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="label" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip 
                                        formatter={(value) => [`${value} students`, 'Count']}
                                        labelFormatter={(label) => `Score: ${label}`}
                                    />
                                    <Bar 
                                        dataKey="count" 
                                        name="Students" 
                                        fill="#4f46e5" 
                                        radius={[4, 4, 0, 0]} 
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {questionStats && Object.keys(questionStats).length > 0 && (
                <Card className="w-full mb-6 shadow-sm">
                    <CardHeader>
                        <CardTitle>Question Performance</CardTitle>
                        <CardDescription>Percentage of correct answers per question.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {questionPerformanceData.map((question) => (
                                <div key={question.id} className="border p-3 rounded-md">
                                    <p className="font-medium text-sm mb-2">{question.text}</p>
                                    <div className="relative h-8 bg-gray-100 rounded-md overflow-hidden">
                                        <div 
                                            className={`absolute top-0 left-0 h-full flex items-center px-2 ${
                                                question.correctPercentage >= 70 ? 'bg-green-500' :
                                                question.correctPercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${question.correctPercentage}%` }}
                                        >
                                            {question.correctPercentage >= 25 && (
                                                <span className="text-xs font-medium text-white">
                                                    {question.correctCount} correct
                                                </span>
                                            )}
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <p className="text-sm font-medium">
                                                {question.correctCount} / {question.totalCount} correct ({Math.round(question.correctPercentage)}%)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {processedResponses.map((procResponse) => (
                <Card key={procResponse._id} className="w-full overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="bg-muted/30 px-4 py-3 border-b">
                        <div className="flex justify-between items-center gap-4 flex-wrap"> {/* Allow wrapping */}
                            <CardTitle className="text-lg">
                                Submitted: {new Date(procResponse._creationTime).toLocaleDateString()} {new Date(procResponse._creationTime).toLocaleTimeString()}
                            </CardTitle>
                            {/* Only show score badge if there are questions */}
                            {procResponse.totalQuestions > 0 ? (
                                <Badge variant={procResponse.score === procResponse.totalQuestions ? "default" : procResponse.score > 0 ? "secondary" : "destructive"} className="text-sm px-3 py-1 flex-shrink-0">
                                    Score: {procResponse.score} / {procResponse.totalQuestions}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="text-sm px-3 py-1 flex-shrink-0">
                                    No questions found for scoring
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {procResponse.detailedAnswers.map((answerDetail, index) => (
                            <div
                                key={`${procResponse._id}-answer-${index}`} // More robust key
                                className={`p-3 rounded-md border ${
                                    answerDetail.isCorrect && answerDetail.correctAnswer !== "-" && answerDetail.questionText !== "Question not found..."
                                        ? 'border-green-200 bg-green-50/50'
                                        : answerDetail.questionText.startsWith("Question not found")
                                            ? 'border-yellow-200 bg-yellow-50/50' // Indicate missing question data
                                            : 'border-red-200 bg-red-50/50' // Incorrect or no answer
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-medium text-sm text-foreground flex-grow mr-2">
                                        {index + 1}. {answerDetail.questionText}
                                    </p>
                                    {/* Show status icon only if question data was found */}
                                    {!answerDetail.questionText.startsWith("Question not found") && (
                                        answerDetail.isCorrect ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                                        )
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Your Answer: <span className={`font-medium ${answerDetail.isCorrect ? 'text-green-700' : 'text-red-700'}`}>{answerDetail.submittedValue || <span className="italic">Not answered</span>}</span>
                                </p>
                                {/* Only show correct answer if it's not correct and question data was found */}
                                {!answerDetail.isCorrect && !answerDetail.questionText.startsWith("Question not found") && (
                                    <p className="text-sm text-green-700 mt-1">
                                        Correct Answer: <span className="font-medium">{answerDetail.correctAnswer}</span>
                                    </p>
                                )}
                                {answerDetail.questionText.startsWith("Question not found") && (
                                    <p className="text-xs text-yellow-700 mt-1 font-medium">
                                        Warning: Original question data for this response is missing. Score may be inaccurate.
                                    </p>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
} 