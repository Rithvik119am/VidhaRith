// FormResponses.tsx
import { useMemo } from "react";
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from "../../../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, XCircle, FileText, Users, TrendingUp, CheckSquare as MedianIcon, Award, AlertTriangle as ZeroScoreIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

type FormAnalysisSummary = {
    totalResponses: number;
    averageScore: number | null;
    medianScore: number | null;
    uniqueQuestionCount: number;
    perfectScores: number;
    zeroScores: number;
};

type AnalysisResult = {
    processedResponses: ProcessedResponse[];
    scoreCounts: { [score: number]: number };
    questionStats: { [questionId: string]: { text: string; totalResponses: number; correctResponses: number } };
    summary: FormAnalysisSummary;
};


interface SummaryStatisticsCardProps {
    summary: FormAnalysisSummary;
}

const StatItem = ({ icon: Icon, label, value, unit = '', subValue = '', className = '' }: { icon: React.ElementType, label: string, value: string | number | null, unit?: string, subValue?: string, className?: string }) => (
    // Using standard muted/50 background color for stat items
    <div className={`flex flex-col p-3 bg-muted/50 rounded-lg shadow-sm min-h-[5rem] justify-center ${className}`}>
        <div className="flex items-center text-muted-foreground mb-1">
            <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="text-xs font-medium truncate" title={label}>{label}</span>
        </div>
        {value !== null && value !== undefined ? (
            <div className="flex items-baseline">
                <p className="text-xl font-semibold text-foreground">
                    {value}
                    {unit && <span className="text-xs font-normal ml-0.5">{unit}</span>}
                </p>
                {subValue && <p className="text-xs text-muted-foreground ml-1">{subValue}</p>}
            </div>
        ) : (
            <p className="text-xl font-semibold text-muted-foreground">-</p>
        )}
    </div>
);

export function SummaryStatisticsCard({ summary }: SummaryStatisticsCardProps) {
    const avgScorePercentage = summary.uniqueQuestionCount > 0 && summary.averageScore !== null
        ? ((summary.averageScore / summary.uniqueQuestionCount) * 100).toFixed(1)
        : null;

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl">Overall Summary</CardTitle>
                 <CardDescription>A quick glance at the form&apos;s performance.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <StatItem icon={Users} label="Total Responses" value={summary.totalResponses} />
                <StatItem icon={FileText} label="Questions in Form" value={summary.uniqueQuestionCount} />
                <StatItem
                    icon={TrendingUp}
                    label="Average Score"
                    value={summary.averageScore !== null ? summary.averageScore.toFixed(1) : '-'}
                    unit={summary.uniqueQuestionCount > 0 ? `/ ${summary.uniqueQuestionCount}` : ''}
                    subValue={avgScorePercentage !== null ? `(${avgScorePercentage}%)` : (summary.uniqueQuestionCount === 0 && summary.totalResponses > 0 ? "(Not Scored)" : "")}
                />
                <StatItem
                    icon={MedianIcon}
                    label="Median Score"
                    value={summary.medianScore !== null ? summary.medianScore : '-'}
                    unit={summary.uniqueQuestionCount > 0 ? `/ ${summary.uniqueQuestionCount}` : ''}
                    subValue={summary.uniqueQuestionCount === 0 && summary.totalResponses > 0 ? "(Not Scored)" : ""}
                />
                <StatItem icon={Award} label="Perfect Scores" value={summary.perfectScores} unit={summary.uniqueQuestionCount > 0 && summary.perfectScores === 1 ? "response" : "responses"}/>
                <StatItem icon={ZeroScoreIcon} label="Zero Scores" value={summary.zeroScores} unit={summary.zeroScores === 1 ? "response" : "responses"} />
            </CardContent>
        </Card>
    );
}

export default function FormResponses({ formId }: { formId: Id<"forms"> }) {
    const responses = useQuery(api.form_responses.getFormResponses, { formId });
    const questions = useQuery(api.form_questions.getFormQuestions, { formId });

    const analysisData = useMemo<AnalysisResult | null | undefined>(() => {
        if (responses === undefined || questions === undefined) {
            return undefined;
        }

        if (questions === null && responses && responses.length > 0) {
            return null;
        }

        const actualQuestions = questions || [];
        const questionsMap = new Map(actualQuestions.map(q => [q._id, q]));
        const actualQuestionsLength = actualQuestions.length;

        if (!responses || responses.length === 0) {
            return {
                processedResponses: [],
                scoreCounts: {},
                questionStats: {},
                summary: {
                    totalResponses: 0,
                    averageScore: null,
                    medianScore: null,
                    uniqueQuestionCount: actualQuestionsLength,
                    perfectScores: 0,
                    zeroScores: 0,
                },
            };
        }

        const scoreCounts: { [score: number]: number } = {};
        const questionStats: { [questionId: string]: { text: string; totalResponses: number; correctResponses: number } } = {};

        const processedResponsesData = responses.map((response) => {
            let score = 0;
            const detailedAnswers = response.values.map((submittedAnswer) => {
                const question = questionsMap.get(submittedAnswer.questionId);
                let isCorrect = false;
                let questionText = `Question data not found (ID: ${submittedAnswer.questionId})`;
                let correctAnswer = "-";

                if (question) {
                    questionText = question.question;
                    correctAnswer = question.answer;
                    isCorrect = question.answer?.trim().toLowerCase() === submittedAnswer.userSelectedOption?.trim().toLowerCase();
                    if (isCorrect) {
                        score++;
                    }

                    const qIdString = submittedAnswer.questionId.toString();
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
                }
                return {
                    questionId: submittedAnswer.questionId,
                    questionText: questionText,
                    submittedValue: submittedAnswer.userSelectedOption,
                    correctAnswer: correctAnswer,
                    isCorrect: isCorrect,
                };
            });

            scoreCounts[score] = (scoreCounts[score] || 0) + 1;

            return {
                _id: response._id,
                _creationTime: response._creationTime,
                score: score,
                totalQuestions: actualQuestionsLength,
                detailedAnswers: detailedAnswers,
            };
        });

        const allScores = processedResponsesData.map(r => r.score);
        const totalScoreSum = allScores.reduce((sum, s) => sum + s, 0);
        const averageScoreValue = processedResponsesData.length > 0 ? totalScoreSum / processedResponsesData.length : null;

        let medianScoreValue: number | null = null;
        if (processedResponsesData.length > 0) {
            const sortedScores = [...allScores].sort((a, b) => a - b);
            const mid = Math.floor(sortedScores.length / 2);
            medianScoreValue = sortedScores.length % 2 !== 0 ? sortedScores[mid] : (sortedScores[mid - 1] + sortedScores[mid]) / 2;
        }

        const perfectScoresCount = actualQuestionsLength > 0 ? allScores.filter(s => s === actualQuestionsLength).length : 0;
        const zeroScoresCount = allScores.filter(s => s === 0).length;

        const summary: FormAnalysisSummary = {
            totalResponses: processedResponsesData.length,
            averageScore: averageScoreValue,
            medianScore: medianScoreValue,
            uniqueQuestionCount: actualQuestionsLength,
            perfectScores: perfectScoresCount,
            zeroScores: zeroScoresCount,
        };

        return {
            processedResponses: processedResponsesData,
            scoreCounts,
            questionStats,
            summary,
        };

    }, [responses, questions]);

    const scoreDistributionData = useMemo(() => {
        if (!analysisData?.scoreCounts || analysisData.processedResponses.length === 0) return [];

        const { scoreCounts, summary } = analysisData;
        const totalQuestionsInForm = summary.uniqueQuestionCount;

        if (totalQuestionsInForm === 0 && analysisData.processedResponses.length > 0) {
            return [{
                scoreLabel: "Not Scored",
                count: analysisData.processedResponses.length,
                label: "Not Scored"
            }];
        }
        if (totalQuestionsInForm === 0) return [];

        const data = [];
        for (let i = 0; i <= totalQuestionsInForm; i++) {
            data.push({
                score: i,
                count: scoreCounts[i] || 0,
                label: `${i}/${totalQuestionsInForm}`
            });
        }
        return data;
    }, [analysisData]);

    const questionPerformanceData = useMemo(() => {
        if (!analysisData?.questionStats) return [];

        return Object.entries(analysisData.questionStats)
            .map(([qId, stats]) => ({
                id: qId,
                text: stats.text,
                correctPercentage: stats.totalResponses > 0 ? (stats.correctResponses / stats.totalResponses) * 100 : 0,
                correctCount: stats.correctResponses,
                totalCount: stats.totalResponses,
            }))
            .sort((a,b) => a.correctPercentage - b.correctPercentage);
    }, [analysisData]);

    if (analysisData === undefined) {
        return (
            <div className="container mx-auto p-4 md:p-6 space-y-6 mt-4">
                <Skeleton className="h-48 w-full" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-72 w-full" />
                    <Skeleton className="h-72 w-full" />
                </div>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    if (analysisData === null) {
        return (
            <div className="container mx-auto p-4 md:p-6 mt-6">
                {/* Using standard semantic colors for error card */}
                <Card className="border-red-500 bg-red-50">
                    <CardHeader>
                        <CardTitle className="flex items-center text-red-700">
                            <AlertCircle className="h-6 w-6 mr-2" />
                            Error Loading Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-red-600">
                        Could not load essential question details to evaluate responses.
                        Please check the form configuration or try again later.
                        If responses exist but questions are missing, analysis cannot be performed.
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { processedResponses, summary, questionStats } = analysisData;
    if (processedResponses.length === 0) {
        const hasQuestions = summary.uniqueQuestionCount > 0;
        return (
            <div className="container mx-auto p-4 md:p-6 mt-6 flex justify-center">
                <Card className="w-full max-w-lg shadow-md">
                    <CardHeader className="items-center text-center">
                        <FileText className="h-16 w-16 text-muted-foreground mb-3" />
                        <CardTitle className="text-xl">
                            {hasQuestions ? "No Responses Yet" : "Form is Empty"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-2">
                        <p className="text-muted-foreground">
                            {hasQuestions
                                ? "This form hasn't received any responses."
                                : "This form currently has no questions defined."}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {hasQuestions
                                ? "Share the form's URL to start collecting data."
                                : "Add questions to the form to enable response collection and analysis."}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8 mt-4">
            <SummaryStatisticsCard summary={summary} />

            {(scoreDistributionData.length > 0 || questionPerformanceData.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {scoreDistributionData.length > 0 && (
                        <Card className="w-full shadow-lg">
                            <CardHeader>
                                <CardTitle>Score Distribution</CardTitle>
                                <CardDescription>
                                    {summary.uniqueQuestionCount > 0
                                        ? `Number of responses achieving each score (out of ${summary.uniqueQuestionCount}).`
                                        : "Distribution of responses (form is not scored)."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        {/* Using theme primary color for bar fill */}
                                        <BarChart data={scoreDistributionData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="label" angle={-20} textAnchor="end" height={50} />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip
                                                formatter={(value, name, props) => [`${value} responses`, `Score: ${props.payload.label}`]}
                                                labelFormatter={(label) => ``}
                                            />
                                            <Bar dataKey="count" name="Responses" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {questionPerformanceData.length > 0 && (
                        <Card className="w-full shadow-lg">
                            <CardHeader>
                                <CardTitle>Question Performance</CardTitle>
                                <CardDescription>Percentage of correct answers per question. Sorted by difficulty.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Using standard muted/20 background for question performance items */}
                                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                    {questionPerformanceData.map((question, idx) => (
                                        <div key={question.id} className="p-3 border rounded-md bg-muted/20">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <p className="font-medium text-sm flex-grow mr-2 leading-tight" title={question.text}>
                                                    {idx + 1}. {question.text}
                                                </p>
                                                <span className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                                                    {question.correctCount}/{question.totalCount} ({Math.round(question.correctPercentage)}%)
                                                </span>
                                            </div>
                                            <Progress
                                                value={question.correctPercentage}
                                                // Using standard semantic colors for progress bar
                                                className={`h-2.5 [&>div]:transition-all [&>div]:duration-500 ${
                                                    question.correctPercentage >= 70 ? '[&>div]:bg-green-500' :
                                                    question.correctPercentage >= 40 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'
                                                }`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            <div>
                <h2 className="text-2xl font-semibold mb-1">Individual Responses</h2>
                <p className="text-muted-foreground mb-4">Total Responses: {processedResponses.length}</p>
                <div className="space-y-6">
                    {processedResponses.map((procResponse) => (
                        <Card key={procResponse._id} className="w-full overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-200">
                            {/* Using standard muted/30 background for card header */}
                            <CardHeader className="bg-muted/30 px-4 py-3 border-b">
                                <div className="flex justify-between items-center gap-2 flex-wrap">
                                    <CardTitle className="text-base md:text-lg font-medium">
                                        Submitted: {new Date(procResponse._creationTime).toLocaleDateString()} {new Date(procResponse._creationTime).toLocaleTimeString()}
                                    </CardTitle>
                                    {procResponse.totalQuestions > 0 ? (
                                        <Badge
                                            // Using standard badge variants which map to theme colors
                                            variant={procResponse.score === procResponse.totalQuestions ? "default" : procResponse.score >= procResponse.totalQuestions * 0.7 ? "secondary" : "destructive"}
                                            className="text-sm px-3 py-1 flex-shrink-0"
                                        >
                                            Score: {procResponse.score} / {procResponse.totalQuestions}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-sm px-3 py-1 flex-shrink-0">
                                            Not Scored
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                {procResponse.detailedAnswers.map((answerDetail, index) => {
                                    const isQuestionMissing = answerDetail.questionText.startsWith("Question data not found");
                                    // Using standard semantic colors for item backgrounds and borders
                                    let itemStyle = "border-gray-200 bg-gray-50"; // Default
                                    let icon = null;

                                    if (isQuestionMissing) {
                                        itemStyle = 'border-yellow-400 bg-yellow-50 text-yellow-700';
                                        icon = <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />;
                                    } else if (procResponse.totalQuestions === 0) {
                                        itemStyle = 'border-blue-200 bg-blue-50 text-blue-700';
                                    } else if (answerDetail.isCorrect) {
                                        itemStyle = 'border-green-300 bg-green-50 text-green-700';
                                        icon = <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />;
                                    } else {
                                        itemStyle = 'border-red-300 bg-red-50 text-red-700';
                                        icon = <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />;
                                    }

                                    return (
                                        <div
                                            key={`${procResponse._id}-q-${answerDetail.questionId}-${index}`}
                                            className={`p-3 rounded-md border ${itemStyle} transition-colors`}
                                        >
                                            <div className="flex justify-between items-start mb-1.5">
                                                {/* Text color adapts based on item style */}
                                                <p className={`font-medium text-sm flex-grow mr-2 leading-tight ${isQuestionMissing || procResponse.totalQuestions === 0 ? 'text-inherit' : 'text-foreground'}`}>
                                                    {index + 1}. {answerDetail.questionText}
                                                </p>
                                                {icon}
                                            </div>
                                            {!isQuestionMissing && procResponse.totalQuestions > 0 && (
                                                <>
                                                    <p className="text-sm">
                                                        Your Answer: <span className={`font-medium ${answerDetail.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                                            {answerDetail.submittedValue || <span className="italic">Not answered</span>}
                                                        </span>
                                                    </p>
                                                    {!answerDetail.isCorrect && answerDetail.correctAnswer !== "-" && (
                                                        <p className="text-sm text-green-700 mt-1">
                                                            Correct Answer: <span className="font-medium">{answerDetail.correctAnswer}</span>
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                            {isQuestionMissing && (
                                                 <p className="text-xs font-medium mt-1">
                                                    Warning: Original question data for this response is missing. This answer does not contribute to the score.
                                                </p>
                                            )}
                                             {procResponse.totalQuestions === 0 && !isQuestionMissing && (
                                                 <p className="text-sm">
                                                    Submitted: <span className="font-medium text-blue-700">{answerDetail.submittedValue || <span className="italic">Not answered</span>}</span>
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}