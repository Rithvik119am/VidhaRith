// --- START OF FILE FormResponses.tsx ---

"use client";
import { useMemo } from "react";
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api'; // Adjust path if needed
import { Id } from "../../../../../convex/_generated/dataModel"; // Adjust path if needed
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"; // Icons

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


    // Access the data outside the useMemo
    const processedResponses = analysisData?.processedResponses;
    const scoreCounts = analysisData?.scoreCounts;
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

            {scoreCounts && Object.keys(scoreCounts).length > 0 && (
                <Card className="w-full mb-6 shadow-sm">
                    <CardHeader>
                        <CardTitle>Score Distribution</CardTitle>
                        <CardDescription>Number of students achieving each score.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Render your Chart Component for Score Distribution here */}
                        {/* Example placeholder: */}
                        <div className="h-48 bg-gray-100 flex items-center justify-center rounded-md">
                            {/* Your Score Distribution Chart Component */}
                            <p>Score Distribution Chart Goes Here</p>
                        </div>
                        {/* You would pass scoreCounts data to your chart component */}
                        {/* <BarChart data={...} /> or similar */}
                    </CardContent>
                </Card>
            )}

            {questionStats && Object.keys(questionStats).length > 0 && (
                <Card className="w-full mb-6 shadow-sm">
                    <CardHeader>
                        <CardTitle>Question Performance</CardTitle>
                        <CardDescription>Number of correct answers per question.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Render your Chart Component(s) for Question Correctness here */}
                        {/* Example placeholder: */}
                        <div className="space-y-4">
                            {Object.entries(questionStats).map(([qId, stats]) => (
                                <div key={qId} className="border p-3 rounded-md">
                                    <p className="font-medium text-sm mb-2">{stats.text}</p>
                                    {/* Your Question Correctness Chart/Visualization (e.g., a small bar indicating correct vs total) */}
                                    <div className="h-8 bg-gray-100 flex items-center justify-center rounded-md">
                                        <p className="text-sm">{stats.correctResponses} / {stats.totalResponses} correct</p>
                                    </div>
                                    {/* You would pass stats data to a chart component */}
                                    {/* <PieChart data={...} /> or <BarChart data={...} /> */}
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
                                Submitted: {new Date(procResponse._creationTime).toISOString()} {/* Use date-fns */}
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