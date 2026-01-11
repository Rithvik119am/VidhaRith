"use client";

import { useMemo, useState } from "react";
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from "../../../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, TrendingUp, Clock, Award, Target,
    ChevronDown, ChevronUp, CheckCircle2, XCircle,
    AlertCircle, Download, Filter, Search, ArrowUpDown,
    BarChart3, Sparkles, FileText, AlertTriangle, Inbox
} from "lucide-react";

// Types
type ProcessedResponse = {
    _id: Id<"form_responses">;
    _creationTime: number;
    sessionStartTime?: number;
    timeTaken: number | null;
    score: number;
    totalQuestions: number;
    scorePercentage: number;
    detailedAnswers: DetailedAnswer[];
};

type DetailedAnswer = {
    questionId: Id<"form_questions">;
    questionText: string;
    submittedValue: string;
    correctAnswer: string;
    isCorrect: boolean;
};

type QuestionStats = {
    questionId: string;
    questionText: string;
    correctCount: number;
    totalAttempts: number;
    correctPercentage: number;
    answerDistribution: Record<string, number>;
    mostCommonWrongAnswer: string | null;
    difficulty: 'easy' | 'medium' | 'hard';
};

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'fastest' | 'slowest';

// Animated Counter Component
const AnimatedCounter = ({ value, suffix = "", prefix = "", decimals = 0 }: {
    value: number;
    suffix?: string;
    prefix?: string;
    decimals?: number;
}) => {
    const [displayValue, setDisplayValue] = useState(0);

    useMemo(() => {
        const duration = 1000;
        const steps = 30;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(current);
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <span>
            {prefix}{decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue)}{suffix}
        </span>
    );
};

// Score Badge Component
const ScoreBadge = ({ score, total }: { score: number; total: number }) => {
    const percentage = total > 0 ? (score / total) * 100 : 0;

    let bgColor = "bg-red-100 text-red-700 border-red-200";
    let emoji = "";

    if (percentage >= 90) {
        bgColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
        emoji = "";
    } else if (percentage >= 70) {
        bgColor = "bg-yellow-100 text-yellow-700 border-yellow-200";
        emoji = "";
    } else if (percentage >= 50) {
        bgColor = "bg-orange-100 text-orange-700 border-orange-200";
        emoji = "";
    }

    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${bgColor}`}>
            {emoji} {score}/{total} ({Math.round(percentage)}%)
        </span>
    );
};

// Format time helper
const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Metrics Card Component
const MetricsCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    gradient,
    delay = 0
}: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
    subValue?: string;
    gradient: string;
    delay?: number;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="relative group"
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity`} />
        <div className="relative bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            {subValue && (
                <p className="text-xs text-gray-400 mt-1">{subValue}</p>
            )}
        </div>
    </motion.div>
);

// Score Distribution Bar Component
const ScoreDistributionBar = ({
    score,
    count,
    maxCount,
    total,
    delay
}: {
    score: number;
    count: number;
    maxCount: number;
    total: number;
    delay: number;
}) => {
    const percentage = (score / total) * 100;
    const width = maxCount > 0 ? (count / maxCount) * 100 : 0;

    let barColor = "from-red-400 to-red-500";
    if (percentage >= 90) barColor = "from-emerald-400 to-emerald-500";
    else if (percentage >= 70) barColor = "from-yellow-400 to-yellow-500";
    else if (percentage >= 50) barColor = "from-orange-400 to-orange-500";

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="flex items-center gap-3"
        >
            <span className="w-12 text-sm text-gray-600 font-medium text-right">{score}/{total}</span>
            <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ delay: delay + 0.2, duration: 0.6, ease: "easeOut" }}
                    className={`h-full bg-gradient-to-r ${barColor} rounded-lg`}
                />
                {count > 0 && (
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-700">
                        {count} response{count !== 1 ? 's' : ''}
                    </span>
                )}
            </div>
        </motion.div>
    );
};

// Question Performance Card Component
const QuestionPerformanceCard = ({
    question,
    index,
    delay
}: {
    question: QuestionStats;
    index: number;
    delay: number;
}) => {
    const [expanded, setExpanded] = useState(false);

    let difficultyColor = "bg-red-100 text-red-700";
    let difficultyLabel = "Hard";
    if (question.difficulty === 'easy') {
        difficultyColor = "bg-emerald-100 text-emerald-700";
        difficultyLabel = "Easy";
    } else if (question.difficulty === 'medium') {
        difficultyColor = "bg-yellow-100 text-yellow-700";
        difficultyLabel = "Medium";
    }

    let barColor = "bg-red-500";
    if (question.correctPercentage >= 70) barColor = "bg-emerald-500";
    else if (question.correctPercentage >= 40) barColor = "bg-yellow-500";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        >
            <div
                className="p-4 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            Q{index + 1}: {question.questionText}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor}`}>
                            {difficultyLabel}
                        </span>
                        <motion.div
                            animate={{ rotate: expanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        </motion.div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${question.correctPercentage}%` }}
                            transition={{ delay: delay + 0.2, duration: 0.6 }}
                            className={`h-full ${barColor} rounded-full`}
                        />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-16 text-right">
                        {Math.round(question.correctPercentage)}%
                    </span>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                    {question.correctCount}/{question.totalAttempts} correct answers
                </p>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-100 bg-gray-50 px-4 py-3"
                    >
                        <p className="text-xs font-medium text-gray-600 mb-2">Answer Distribution:</p>
                        <div className="space-y-1">
                            {Object.entries(question.answerDistribution)
                                .sort((a, b) => b[1] - a[1])
                                .map(([answer, count]) => {
                                    const pct = (count / question.totalAttempts) * 100;
                                    return (
                                        <div key={answer} className="flex items-center gap-2">
                                            <div className="w-32 text-xs text-gray-600 truncate" title={answer}>
                                                {answer}
                                            </div>
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-quiz-primary rounded-full"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 w-10 text-right">
                                                {Math.round(pct)}%
                                            </span>
                                        </div>
                                    );
                                })}
                        </div>
                        {question.mostCommonWrongAnswer && (
                            <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-100">
                                <p className="text-xs text-red-600">
                                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                                    Most common wrong answer: <strong>{question.mostCommonWrongAnswer}</strong>
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Response Card Component
const ResponseCard = ({
    response,
    index,
    delay
}: {
    response: ProcessedResponse;
    index: number;
    delay: number;
}) => {
    const [expanded, setExpanded] = useState(false);
    const date = new Date(response._creationTime);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden"
        >
            <div
                className="p-5 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-quiz-primary to-quiz-secondary flex items-center justify-center text-white font-bold">
                            #{index + 1}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">
                                {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {response.timeTaken && (
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Time: {formatTime(response.timeTaken)}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {response.totalQuestions > 0 ? (
                            <ScoreBadge score={response.score} total={response.totalQuestions} />
                        ) : (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                                Not Scored
                            </span>
                        )}
                        <motion.div
                            animate={{ rotate: expanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        </motion.div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-100"
                    >
                        <div className="p-5 space-y-3">
                            {response.detailedAnswers.map((answer, idx) => (
                                <div
                                    key={`${response._id}-${answer.questionId}-${idx}`}
                                    className={`p-4 rounded-xl border ${
                                        answer.isCorrect
                                            ? 'bg-emerald-50 border-emerald-200'
                                            : 'bg-red-50 border-red-200'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <p className="font-medium text-gray-900 text-sm">
                                            Q{idx + 1}: {answer.questionText}
                                        </p>
                                        {answer.isCorrect ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                        )}
                                    </div>
                                    <div className="text-sm">
                                        <p className={answer.isCorrect ? 'text-emerald-700' : 'text-red-700'}>
                                            <span className="font-medium">Answer:</span> {answer.submittedValue || <em>Not answered</em>}
                                        </p>
                                        {!answer.isCorrect && answer.correctAnswer !== "-" && (
                                            <p className="text-emerald-700 mt-1">
                                                <span className="font-medium">Correct:</span> {answer.correctAnswer}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Loading Skeleton Component
const LoadingSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                    <div className="h-8 bg-gray-200 rounded w-24" />
                </div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-80">
                <div className="h-6 bg-gray-200 rounded w-40 mb-6" />
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-8 bg-gray-200 rounded" />
                    ))}
                </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-80">
                <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// Empty State Component
const EmptyState = ({ hasQuestions }: { hasQuestions: boolean }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-20"
    >
        <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-quiz-primary/10 to-quiz-secondary/10 flex items-center justify-center">
                <Inbox className="w-12 h-12 text-quiz-primary" />
            </div>
            <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-quiz-secondary/20 flex items-center justify-center"
            >
                <Sparkles className="w-3 h-3 text-quiz-secondary" />
            </motion.div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
            {hasQuestions ? "No Responses Yet" : "Form is Empty"}
        </h3>
        <p className="text-gray-500 text-center max-w-md mb-6">
            {hasQuestions
                ? "Share your quiz link to start collecting responses. Analytics will appear here once students submit their answers."
                : "This form has no questions. Add questions to start collecting responses."}
        </p>
        <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
            </div>
            <span>+</span>
            <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span>Insights</span>
            </div>
            <span>+</span>
            <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>Trends</span>
            </div>
        </div>
    </motion.div>
);

// Main Component
export default function FormResponses({ formId }: { formId: Id<"forms"> }) {
    const responses = useQuery(api.form_responses.getFormResponses, { formId });
    const questions = useQuery(api.form_questions.getFormQuestions, { formId });

    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Process all data
    const analysisData = useMemo(() => {
        if (responses === undefined || questions === undefined) {
            return undefined;
        }

        if (questions === null && responses && responses.length > 0) {
            return null;
        }

        const actualQuestions = questions || [];
        const questionsMap = new Map(actualQuestions.map(q => [q._id, q]));
        const totalQuestionsCount = actualQuestions.length;

        if (!responses || responses.length === 0) {
            return {
                processedResponses: [] as ProcessedResponse[],
                questionStats: [] as QuestionStats[],
                summary: {
                    totalResponses: 0,
                    averageScore: null as number | null,
                    averagePercentage: null as number | null,
                    medianScore: null as number | null,
                    perfectScores: 0,
                    zeroScores: 0,
                    averageTimeTaken: null as number | null,
                    totalQuestionsCount,
                    passingCount: 0,
                },
                scoreCounts: {} as Record<number, number>,
            };
        }

        const scoreCounts: Record<number, number> = {};
        const questionStatsMap: Record<string, {
            text: string;
            totalResponses: number;
            correctResponses: number;
            answerDistribution: Record<string, number>;
            correctAnswer: string;
        }> = {};
        const timeTakenList: number[] = [];

        const processedResponses: ProcessedResponse[] = responses.map((response) => {
            let score = 0;
            const sessionStart = (response as { sessionStartTime?: number }).sessionStartTime;
            const timeTaken = sessionStart ? (response._creationTime - sessionStart) / 1000 : null;

            if (timeTaken && timeTaken > 0 && timeTaken < 7200) {
                timeTakenList.push(timeTaken);
            }

            const detailedAnswers = response.values.map((submittedAnswer) => {
                const question = questionsMap.get(submittedAnswer.questionId);
                let isCorrect = false;
                let questionText = `Question not found`;
                let correctAnswer = "-";

                if (question) {
                    questionText = question.question;
                    correctAnswer = question.answer;
                    isCorrect = question.answer?.trim().toLowerCase() === submittedAnswer.userSelectedOption?.trim().toLowerCase();
                    if (isCorrect) score++;

                    const qIdString = submittedAnswer.questionId.toString();
                    if (!questionStatsMap[qIdString]) {
                        questionStatsMap[qIdString] = {
                            text: questionText,
                            totalResponses: 0,
                            correctResponses: 0,
                            answerDistribution: {},
                            correctAnswer: correctAnswer,
                        };
                    }
                    questionStatsMap[qIdString].totalResponses++;
                    if (isCorrect) questionStatsMap[qIdString].correctResponses++;

                    const answer = submittedAnswer.userSelectedOption || "Not answered";
                    questionStatsMap[qIdString].answerDistribution[answer] =
                        (questionStatsMap[qIdString].answerDistribution[answer] || 0) + 1;
                }

                return {
                    questionId: submittedAnswer.questionId,
                    questionText,
                    submittedValue: submittedAnswer.userSelectedOption,
                    correctAnswer,
                    isCorrect,
                };
            });

            scoreCounts[score] = (scoreCounts[score] || 0) + 1;
            const scorePercentage = totalQuestionsCount > 0 ? (score / totalQuestionsCount) * 100 : 0;

            return {
                _id: response._id,
                _creationTime: response._creationTime,
                sessionStartTime: sessionStart,
                timeTaken,
                score,
                totalQuestions: totalQuestionsCount,
                scorePercentage,
                detailedAnswers,
            };
        });

        // Calculate statistics
        const allScores = processedResponses.map(r => r.score);
        const totalScoreSum = allScores.reduce((sum, s) => sum + s, 0);
        const averageScore = processedResponses.length > 0 ? totalScoreSum / processedResponses.length : null;
        const averagePercentage = averageScore !== null && totalQuestionsCount > 0
            ? (averageScore / totalQuestionsCount) * 100
            : null;

        let medianScore: number | null = null;
        if (processedResponses.length > 0) {
            const sortedScores = [...allScores].sort((a, b) => a - b);
            const mid = Math.floor(sortedScores.length / 2);
            medianScore = sortedScores.length % 2 !== 0
                ? sortedScores[mid]
                : (sortedScores[mid - 1] + sortedScores[mid]) / 2;
        }

        const perfectScores = totalQuestionsCount > 0
            ? allScores.filter(s => s === totalQuestionsCount).length
            : 0;
        const zeroScores = allScores.filter(s => s === 0).length;
        const passingCount = allScores.filter(s => totalQuestionsCount > 0 && (s / totalQuestionsCount) >= 0.7).length;

        const averageTimeTaken = timeTakenList.length > 0
            ? timeTakenList.reduce((a, b) => a + b, 0) / timeTakenList.length
            : null;

        // Process question stats
        const questionStats: QuestionStats[] = Object.entries(questionStatsMap).map(([qId, stats]) => {
            const correctPct = stats.totalResponses > 0
                ? (stats.correctResponses / stats.totalResponses) * 100
                : 0;

            let difficulty: 'easy' | 'medium' | 'hard' = 'hard';
            if (correctPct >= 70) difficulty = 'easy';
            else if (correctPct >= 40) difficulty = 'medium';

            // Find most common wrong answer
            let mostCommonWrongAnswer: string | null = null;
            let maxWrongCount = 0;
            Object.entries(stats.answerDistribution).forEach(([answer, count]) => {
                if (answer.toLowerCase() !== stats.correctAnswer.toLowerCase() && count > maxWrongCount) {
                    maxWrongCount = count;
                    mostCommonWrongAnswer = answer;
                }
            });

            return {
                questionId: qId,
                questionText: stats.text,
                correctCount: stats.correctResponses,
                totalAttempts: stats.totalResponses,
                correctPercentage: correctPct,
                answerDistribution: stats.answerDistribution,
                mostCommonWrongAnswer,
                difficulty,
            };
        }).sort((a, b) => a.correctPercentage - b.correctPercentage);

        return {
            processedResponses,
            questionStats,
            summary: {
                totalResponses: processedResponses.length,
                averageScore,
                averagePercentage,
                medianScore,
                perfectScores,
                zeroScores,
                averageTimeTaken,
                totalQuestionsCount,
                passingCount,
            },
            scoreCounts,
        };
    }, [responses, questions]);

    // Sort and filter responses
    const sortedResponses = useMemo(() => {
        if (!analysisData?.processedResponses) return [];

        let sorted = [...analysisData.processedResponses];

        switch (sortBy) {
            case 'newest':
                sorted.sort((a, b) => b._creationTime - a._creationTime);
                break;
            case 'oldest':
                sorted.sort((a, b) => a._creationTime - b._creationTime);
                break;
            case 'highest':
                sorted.sort((a, b) => b.scorePercentage - a.scorePercentage);
                break;
            case 'lowest':
                sorted.sort((a, b) => a.scorePercentage - b.scorePercentage);
                break;
            case 'fastest':
                sorted.sort((a, b) => (a.timeTaken || Infinity) - (b.timeTaken || Infinity));
                break;
            case 'slowest':
                sorted.sort((a, b) => (b.timeTaken || 0) - (a.timeTaken || 0));
                break;
        }

        return sorted;
    }, [analysisData?.processedResponses, sortBy]);

    // Export to CSV
    const exportToCSV = () => {
        if (!analysisData?.processedResponses.length) return;

        const headers = ['Response #', 'Date', 'Score', 'Percentage', 'Time Taken'];
        const rows = analysisData.processedResponses.map((r, i) => [
            i + 1,
            new Date(r._creationTime).toLocaleString(),
            `${r.score}/${r.totalQuestions}`,
            `${Math.round(r.scorePercentage)}%`,
            r.timeTaken ? formatTime(r.timeTaken) : 'N/A',
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `responses-${formId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Loading state
    if (analysisData === undefined) {
        return <LoadingSkeleton />;
    }

    // Error state
    if (analysisData === null) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-6"
            >
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-800 mb-1">Error Loading Data</h3>
                        <p className="text-red-600 text-sm">
                            Could not load question details to evaluate responses. Please check the form configuration.
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    const { summary, questionStats, scoreCounts } = analysisData;

    // Empty state
    if (analysisData.processedResponses.length === 0) {
        return <EmptyState hasQuestions={summary.totalQuestionsCount > 0} />;
    }

    const maxScoreCount = Math.max(...Object.values(scoreCounts), 1);

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-quiz-primary" />
                        Responses Overview
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {summary.totalResponses} total response{summary.totalResponses !== 1 ? 's' : ''}
                        {summary.totalResponses > 0 && (
                            <span> &bull; Last response {new Date(sortedResponses[0]?._creationTime || 0).toLocaleDateString()}</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </motion.button>
                </div>
            </motion.div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricsCard
                    icon={Users}
                    label="Total Responses"
                    value={<AnimatedCounter value={summary.totalResponses} />}
                    subValue={summary.passingCount > 0 ? `${summary.passingCount} passing (70%+)` : undefined}
                    gradient="from-quiz-primary to-quiz-secondary"
                    delay={0}
                />
                <MetricsCard
                    icon={TrendingUp}
                    label="Average Score"
                    value={
                        summary.averagePercentage !== null
                            ? <AnimatedCounter value={summary.averagePercentage} suffix="%" decimals={1} />
                            : "-"
                    }
                    subValue={summary.averageScore !== null ? `${summary.averageScore.toFixed(1)}/${summary.totalQuestionsCount}` : undefined}
                    gradient="from-quiz-mint to-emerald-400"
                    delay={0.1}
                />
                <MetricsCard
                    icon={Award}
                    label="Perfect Scores"
                    value={<AnimatedCounter value={summary.perfectScores} />}
                    subValue={summary.totalResponses > 0 ? `${Math.round((summary.perfectScores / summary.totalResponses) * 100)}% of responses` : undefined}
                    gradient="from-quiz-sunny to-amber-400"
                    delay={0.2}
                />
                <MetricsCard
                    icon={Clock}
                    label="Average Time"
                    value={summary.averageTimeTaken ? formatTime(summary.averageTimeTaken) : "N/A"}
                    subValue={summary.averageTimeTaken ? "per response" : "No time data"}
                    gradient="from-quiz-sky to-blue-400"
                    delay={0.3}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Distribution */}
                {Object.keys(scoreCounts).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Score Distribution</h3>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    90%+
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    70-89%
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    &lt;70%
                                </span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {[...Array(summary.totalQuestionsCount + 1)].map((_, score) => (
                                <ScoreDistributionBar
                                    key={score}
                                    score={score}
                                    count={scoreCounts[score] || 0}
                                    maxCount={maxScoreCount}
                                    total={summary.totalQuestionsCount}
                                    delay={0.5 + score * 0.05}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Question Performance */}
                {questionStats.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Question Performance</h3>
                            <span className="text-xs text-gray-500">Sorted by difficulty</span>
                        </div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {questionStats.map((q, idx) => (
                                <QuestionPerformanceCard
                                    key={q.questionId}
                                    question={q}
                                    index={idx}
                                    delay={0.6 + idx * 0.05}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Individual Responses */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Individual Responses</h3>
                    <div className="flex items-center gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-quiz-primary/20"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="highest">Highest Score</option>
                            <option value="lowest">Lowest Score</option>
                            <option value="fastest">Fastest</option>
                            <option value="slowest">Slowest</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    {sortedResponses.map((response, idx) => (
                        <ResponseCard
                            key={response._id}
                            response={response}
                            index={idx}
                            delay={0.8 + idx * 0.02}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
