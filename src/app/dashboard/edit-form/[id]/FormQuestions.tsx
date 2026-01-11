"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Trash2,
  PlusCircle,
  Edit2,
  XCircle,
  Sparkles,
  HelpCircle,
  GripVertical,
  Check,
  Loader2,
  Lightbulb,
  X
} from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import AiQuestionGenerator from '@/components/AiQuestionGenerator';
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const optionSchema = z.object({
  value: z.string().min(1, { message: "Option cannot be empty." })
});

const formSchema = z.object({
  question: z.string().min(1, { message: "Question cannot be empty." }),
  options: z.array(optionSchema)
    .min(2, { message: "Please provide at least two options." })
    .refine(options => {
      const trimmedOptions = options.map(opt => opt.value.trim().toLowerCase()).filter(opt => opt !== "");
      return new Set(trimmedOptions).size === trimmedOptions.length;
    }, {
      message: "Options must be unique and not empty.",
    }),
  answer: z.string({ required_error: "Please select the correct answer." })
    .min(1, { message: "Please select the correct answer." })
});

type FormSchemaValues = z.infer<typeof formSchema>;

// Sortable Question Card Component
interface SortableQuestionCardProps {
  question: {
    _id: Id<"form_questions">;
    question: string;
    order: bigint;
    selectOptions?: string[];
    answer: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

function SortableQuestionCard({ question, onEdit, onDelete }: SortableQuestionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-quiz-primary/5 transition-all ${
        isDragging ? 'shadow-xl shadow-quiz-primary/10 z-50' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Order Number & Grip */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <div
            {...attributes}
            {...listeners}
            className="text-gray-300 cursor-grab active:cursor-grabbing hover:text-gray-400 transition-colors touch-none"
          >
            <GripVertical className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold text-quiz-primary bg-quiz-light/50 w-7 h-7 rounded-lg flex items-center justify-center">
            {question.order.toString()}
          </span>
        </div>

        {/* Question Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 mb-3 leading-relaxed">
            {question.question}
          </p>
          <div className="flex flex-wrap gap-2">
            {question.selectOptions && question.selectOptions.map((option, optIndex) => {
              const isAnswer = option.trim() === question.answer.trim();
              return (
                <span
                  key={optIndex}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
                    isAnswer
                      ? "bg-quiz-mint/15 text-emerald-700 border border-quiz-mint/30 font-medium"
                      : "bg-gray-50 text-gray-600 border border-gray-100"
                  }`}
                >
                  {isAnswer && <Check className="w-3.5 h-3.5" />}
                  {option}
                </span>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            className="p-2 rounded-lg text-gray-400 hover:text-quiz-primary hover:bg-quiz-light/50 transition-colors"
            title="Edit question"
          >
            <Edit2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete question"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default function FormQuestions({ formId }: { formId: Id<"forms"> }) {
  const formQuestions = useQuery(api.form_questions.getFormQuestions, { formId });
  const addQuestion = useMutation(api.form_questions.addQuestion);
  const updateQuestion = useMutation(api.form_questions.updateQuestion);
  const deleteQuestion = useMutation(api.form_questions.deleteQuestion);
  const reorderQuestions = useMutation(api.form_questions.reorderQuestions);

  // Drag-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Question IDs for sortable context
  const questionIds = useMemo(
    () => formQuestions?.map((q) => q._id) ?? [],
    [formQuestions]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<Id<"form_questions"> | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Id<"form_questions"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tip dismissal state (stored in localStorage)
  const [showTip, setShowTip] = useState(true);

  useEffect(() => {
    const tipDismissed = localStorage.getItem('vidharith_questions_tip_dismissed');
    if (tipDismissed === 'true') {
      setShowTip(false);
    }
  }, []);

  const dismissTip = () => {
    setShowTip(false);
    localStorage.setItem('vidharith_questions_tip_dismissed', 'true');
  };

  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !formQuestions) {
      return;
    }

    const oldIndex = formQuestions.findIndex((q) => q._id === active.id);
    const newIndex = formQuestions.findIndex((q) => q._id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Get reordered array
    const reorderedQuestions = arrayMove(formQuestions, oldIndex, newIndex);
    const newQuestionIds = reorderedQuestions.map((q) => q._id);

    try {
      await reorderQuestions({
        formId,
        questionIds: newQuestionIds,
      });
      toast.success("Questions reordered");
    } catch (error: any) {
      console.error("Failed to reorder questions:", error);
      toast.error("Failed to reorder questions");
    }
  };

  const form = useForm<FormSchemaValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      options: [{ value: "" }, { value: "" }],
      answer: "",
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options"
  });

  const currentOptions = form.watch("options");

  const handleStartEdit = (question: NonNullable<typeof formQuestions>[number]) => {
    setEditingQuestionId(question._id);
    form.reset({
      question: question.question,
      options: question.selectOptions ? question.selectOptions.map(opt => ({ value: opt })) : [],
      answer: question.answer,
    });
    form.clearErrors();
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    form.reset({
      question: "",
      options: [{ value: "" }, { value: "" }],
      answer: "",
    });
    form.clearErrors();
  };

  const handleOpenAddSheet = () => {
    setEditingQuestionId(null);
    form.reset({
      question: "",
      options: [{ value: "" }, { value: "" }],
      answer: "",
    });
    form.clearErrors();
    setShowAddSheet(true);
  };

  const handleCloseSheet = () => {
    setShowAddSheet(false);
    setEditingQuestionId(null);
    form.reset({
      question: "",
      options: [{ value: "" }, { value: "" }],
      answer: "",
    });
    form.clearErrors();
  };

  const handleAddQuestionSubmit = async (values: FormSchemaValues) => {
    setIsSubmitting(true);
    const trimmedValues = {
      ...values,
      question: values.question.trim(),
      options: values.options.map(opt => ({ value: opt.value.trim() })),
      answer: values.answer.trim(),
    };

    const trimmedOptionsArray = trimmedValues.options.map(opt => opt.value).filter(opt => opt !== "");
    if (trimmedOptionsArray.length < 2) {
      toast.error("MCQ questions must have at least two non-empty options.");
      setIsSubmitting(false);
      return;
    }
    if (!trimmedOptionsArray.includes(trimmedValues.answer)) {
      toast.error("The provided answer must be one of the select options.");
      setIsSubmitting(false);
      return;
    }
    const lowerTrimmedOptions = trimmedOptionsArray.map(opt => opt.toLowerCase());
    if (new Set(lowerTrimmedOptions).size !== lowerTrimmedOptions.length) {
      toast.error("Options must be unique and not empty.");
      setIsSubmitting(false);
      return;
    }

    const numberOfExistingQuestions = formQuestions ? formQuestions.length : 0;
    const questionData = {
      formId: formId,
      question: trimmedValues.question,
      order: BigInt(numberOfExistingQuestions + 1),
      type: "mcq" as const,
      selectOptions: trimmedOptionsArray,
      answer: trimmedValues.answer,
    };

    try {
      await addQuestion(questionData);
      toast.success("Question added successfully!");
      handleCloseSheet();
    } catch (error: any) {
      console.error("Failed to add question:", error);
      toast.error(`Failed to add question: ${error.data || error.message || error.toString()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQuestionSubmit = async (values: FormSchemaValues) => {
    if (!editingQuestionId) return;

    setIsSavingEdit(true);
    const trimmedValues = {
      ...values,
      question: values.question.trim(),
      options: values.options.map(opt => ({ value: opt.value.trim() })),
      answer: values.answer.trim(),
    };

    const trimmedOptionsArray = trimmedValues.options.map(opt => opt.value).filter(opt => opt !== "");
    if (trimmedOptionsArray.length < 2) {
      toast.error("MCQ questions must have at least two non-empty options.");
      setIsSavingEdit(false);
      return;
    }
    if (!trimmedOptionsArray.includes(trimmedValues.answer)) {
      toast.error("The provided answer must be one of the select options.");
      setIsSavingEdit(false);
      return;
    }
    const lowerTrimmedOptions = trimmedOptionsArray.map(opt => opt.toLowerCase());
    if (new Set(lowerTrimmedOptions).size !== lowerTrimmedOptions.length) {
      toast.error("Options must be unique and not empty.");
      setIsSavingEdit(false);
      return;
    }

    const questionData = {
      questionInternalId: editingQuestionId,
      question: trimmedValues.question,
      selectOptions: trimmedOptionsArray,
      answer: trimmedValues.answer,
    };

    try {
      await updateQuestion(questionData);
      toast.success("Question updated successfully!");
      handleCloseSheet();
    } catch (error: any) {
      console.error("Failed to update question:", error);
      toast.error(`Failed to update question: ${error.data || error.message || error.toString()}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const initiateDelete = (questionInternalId: Id<"form_questions">) => {
    setQuestionToDelete(questionInternalId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;

    setIsDeleting(true);
    try {
      await deleteQuestion({ questionInternalId: questionToDelete });
      toast.success("Question deleted successfully!");
      if (editingQuestionId === questionToDelete) {
        handleCancelEdit();
      }
    } catch (error: any) {
      console.error("Failed to delete question:", error);
      toast.error(`Failed to delete question: ${error.data || error.message || error.toString()}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setQuestionToDelete(null);
    }
  };

  const isAddMode = editingQuestionId === null;
  const isSheetOpen = showAddSheet || editingQuestionId !== null;
  const submitButtonText = isAddMode ? (isSubmitting ? "Adding..." : "Add Question") : (isSavingEdit ? "Saving..." : "Save Changes");
  const isSubmitDisabled = isAddMode ? isSubmitting || !form.formState.isValid : isSavingEdit || !form.formState.isValid;
  const sheetTitle = isAddMode ? "Add New Question" : "Edit Question";
  const sheetDescription = isAddMode
    ? "Create a new multiple choice question for your quiz."
    : "Update the question, options, or correct answer.";

  useEffect(() => {
    if (editingQuestionId && formQuestions && !formQuestions.find(q => q._id === editingQuestionId)) {
      handleCancelEdit();
    }
  }, [formQuestions, editingQuestionId]);

  // Loading state
  if (formQuestions === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex gap-3">
            <div className="h-12 w-40 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-12 w-36 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-7 w-20 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-7 w-24 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-7 w-16 bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
          <p className="text-sm text-gray-500 mt-1">
            {formQuestions.length} {formQuestions.length === 1 ? 'question' : 'questions'} in this quiz
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(110, 89, 165, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAiGenerator(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white font-semibold rounded-xl shadow-lg shadow-quiz-primary/20 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            <span className="hidden sm:inline">Generate with AI</span>
            <span className="sm:hidden">AI Generate</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenAddSheet}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Add Manually</span>
            <span className="sm:hidden">Add</span>
          </motion.button>
        </div>
      </div>

      {/* Dismissible Tip */}
      <AnimatePresence>
        {showTip && formQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="flex items-center justify-between bg-quiz-light/50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-quiz-primary/10 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-quiz-primary" />
              </div>
              <p className="text-sm text-gray-700">
                <strong>Tip:</strong> Drag questions to reorder them. Students will see questions in a random order during the quiz.
              </p>
            </div>
            <button
              onClick={dismissTip}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {formQuestions.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-6"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-quiz-light to-quiz-accent/30 flex items-center justify-center"
          >
            <HelpCircle className="w-10 h-10 text-quiz-primary" />
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No questions yet
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Start building your quiz by generating questions with AI from your study materials, or add them manually one by one.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(110, 89, 165, 0.2)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAiGenerator(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white font-semibold rounded-xl shadow-lg shadow-quiz-primary/20"
            >
              <Sparkles className="w-5 h-5" />
              Generate with AI
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenAddSheet}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
            >
              <PlusCircle className="w-5 h-5" />
              Add Manually
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Question Cards with Drag-Drop */}
      {formQuestions.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {formQuestions.map((q) => (
                <SortableQuestionCard
                  key={q._id}
                  question={q}
                  onEdit={() => handleStartEdit(q)}
                  onDelete={() => initiateDelete(q._id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* AI Generator Dialog */}
      <Dialog open={showAiGenerator} onOpenChange={setShowAiGenerator}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-quiz-primary" />
              Generate Questions with AI
            </DialogTitle>
            <DialogDescription>
              Upload a file or paste a URL to automatically generate quiz questions from your content.
            </DialogDescription>
          </DialogHeader>
          <AiQuestionGenerator formId={formId} />
        </DialogContent>
      </Dialog>

      {/* Add/Edit Question Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => !open && handleCloseSheet()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{sheetTitle}</SheetTitle>
            <SheetDescription>{sheetDescription}</SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(isAddMode ? handleAddQuestionSubmit : handleUpdateQuestionSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., What is the speed of light?"
                        className="rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Answer Options</FormLabel>
                <p className="text-sm text-gray-500">Add at least 2 options. One must be marked as correct.</p>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`options.${index}.value`}
                      render={({ field: optionField }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="sr-only">Option {index + 1}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={`Option ${index + 1}`}
                              className="rounded-xl"
                              {...optionField}
                            />
                          </FormControl>
                          {form.formState.errors.options?.[index]?.value && (
                            <FormMessage className="mt-1">
                              {form.formState.errors.options[index]?.value?.message}
                            </FormMessage>
                          )}
                        </FormItem>
                      )}
                    />
                    {fields.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const removedOptionValue = form.getValues(`options.${index}.value`);
                          remove(index);
                          if (form.getValues("answer") === removedOptionValue.trim()) {
                            form.setValue("answer", "", { shouldValidate: true });
                            toast.warning("Correct answer removed. Please select a new answer.");
                          }
                          form.trigger(["options", "answer"]);
                        }}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ value: "" })}
                  className="mt-2 rounded-xl"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Option
                </Button>
                {form.formState.errors.options?.root && (
                  <p className="text-sm font-medium text-destructive mt-2">
                    {form.formState.errors.options.root.message}
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="answer"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Correct Answer</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.trigger("answer");
                        }}
                        value={field.value}
                        className="flex flex-col space-y-2"
                      >
                        {currentOptions.filter(opt => opt.value.trim() !== "").map((option, index) => (
                          <FormItem
                            key={`answer-option-${index}`}
                            className="flex items-center space-x-3 space-y-0 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <FormControl>
                              <RadioGroupItem value={option.value.trim()} id={`answer-option-${index}`} />
                            </FormControl>
                            <Label
                              htmlFor={`answer-option-${index}`}
                              className="font-normal cursor-pointer flex-1"
                            >
                              {option.value.trim()}
                            </Label>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    {currentOptions.filter(opt => opt.value.trim() !== "").length === 0 && (
                      <p className="text-sm text-muted-foreground">Enter valid options above to select an answer.</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="flex-1 rounded-xl bg-gradient-to-r from-quiz-primary to-quiz-secondary hover:opacity-90"
                >
                  {(isSubmitting || isSavingEdit) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitButtonText}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseSheet}
                  disabled={isSubmitting || isSavingEdit}
                  className="rounded-xl"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Cancel
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeleting} className="rounded-xl">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="rounded-xl"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
