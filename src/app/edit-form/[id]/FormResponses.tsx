// --- START OF FILE FormResponses.tsx ---

"use client";
import { useMemo } from "react";
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api'; // Adjust path if needed
import { Id } from "../../../../convex/_generated/dataModel"; // Adjust path if needed
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
    const processedResponses: ProcessedResponse[] | undefined | null = useMemo(() => {
        if (responses === undefined || questions === undefined) {
            // Return undefined if still loading either
            return undefined;
        }
        if (responses === null || questions === null) {
             // Handle potential Convex query errors explicitly if needed, though `undefined` covers loading
             // For now, let's assume null indicates a specific issue like no data found
             // though Convex queries typically return [] for no results, not null.
             // The logic below assumes questions === null or responses === null means an issue.
             console.error("Failed to load responses or questions.");
             return null; // Indicate an error state
        }
        if (responses.length === 0) {
            return []; // No responses to process
        }
        if (questions.length === 0) {
            // Responses exist but no questions found for the form - problematic state for scoring
            console.warn("Responses found, but no questions loaded for this formId:", formId);
             // Returning null to indicate an issue where processing isn't possible
            return null;
        }

        // Create a map for quick question lookup by ID
        const questionsMap = new Map(questions.map(q => [q._id, q]));

        return responses.map((response) => {
            let score = 0;
            const detailedAnswers = response.values.map((submittedAnswer) => {
                const question = questionsMap.get(submittedAnswer.questionId);
                let isCorrect = false;
                let questionText = "Question not found (ID: " + submittedAnswer.questionId + ")"; // Default text with ID
                let correctAnswer = "-"; // Default correct answer

                if (question) {
                    questionText = question.question;
                    correctAnswer = question.answer; // The correct answer from the question definition
                    // Case-insensitive comparison might be desired depending on quiz requirements
                    // Also, trim potentially trailing whitespace from user input and correct answer
                    isCorrect = question.answer.trim() === submittedAnswer.value.trim();
                    if (isCorrect) {
                        score++;
                    }
                } else {
                     console.warn(`Question data not found for ID: ${submittedAnswer.questionId} in response ${response._id}`);
                }

                return {
                    questionId: submittedAnswer.questionId,
                    questionText: questionText,
                    submittedValue: submittedAnswer.value,
                    correctAnswer: correctAnswer,
                    isCorrect: isCorrect,
                };
            });

            return {
                _id: response._id,
                _creationTime: response._creationTime,
                score: score,
                totalQuestions: questions.length, // Use the count of questions fetched for the form
                detailedAnswers: detailedAnswers,
            };
        });

    }, [responses, questions, formId]); // Rerun when responses or questions change

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
             <h2 className="text-xl font-semibold">Responses ({processedResponses.length})</h2> {/* Added heading */}
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