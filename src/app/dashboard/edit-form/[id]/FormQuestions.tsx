"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from "../../../../../convex/_generated/dataModel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, PlusCircle, CheckCircle, Edit2, Save, XCircle } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import AiQuestionGenerator from '@/components/AiQuestionGenerator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

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

export default function FormQuestions({ formId }: { formId: Id<"forms"> }) {
  const formQuestions = useQuery(api.form_questions.getFormQuestions, { formId });
  const addQuestion = useMutation(api.form_questions.addQuestion);
  const updateQuestion = useMutation(api.form_questions.updateQuestion);
  const deleteQuestion = useMutation(api.form_questions.deleteQuestion);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<Id<"form_questions"> | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Id<"form_questions"> | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);


  const form = useForm<FormSchemaValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      options: [{ value: "" }, { value: "" }],
      answer: "",
    },
    mode: "onChange",
  });

  const { fields, append, remove, replace } = useFieldArray({
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

  useEffect(() => {
    if (editingQuestionId && editFormRef.current) {
      editFormRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [editingQuestionId]);

  const handleCancelEdit = () => {
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
        form.reset({
            question: "",
            options: [{ value: "" }, { value: "" }],
            answer: "",
        });
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
          handleCancelEdit();
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
  const submitButtonText = isAddMode ? (isSubmitting ? "Adding..." : "Add Question") : (isSavingEdit ? "Saving..." : "Save Changes");
  const isSubmitDisabled = isAddMode ? isSubmitting || !form.formState.isValid : isSavingEdit || !form.formState.isValid;
  const formTitle = isAddMode ? "Add New Question" : "Edit Question";

  useEffect(() => {
    if (editingQuestionId && formQuestions && !formQuestions.find(q => q._id === editingQuestionId)) {
      console.log("Edited question no longer exists in the list, cancelling edit.");
      handleCancelEdit();
    }
  }, [formQuestions, editingQuestionId]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Form Questions (MCQ)</h2>

      <div>
        <h3 className="text-lg font-semibold mb-3">Existing Questions</h3>
        <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Options (Correct Answer Marked)</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formQuestions === undefined && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Loading questions...
                    </TableCell>
                  </TableRow>
                )}
                 {formQuestions && formQuestions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No questions added yet.
                    </TableCell>
                  </TableRow>
                )}
                {formQuestions && formQuestions.map((q) => (
                  <TableRow key={q._id} className={editingQuestionId === q._id ? "bg-primary/5" : ""}>
                    <TableCell>{q.order.toString()}</TableCell>
                    <TableCell className="font-medium">{q.question}</TableCell>
                    <TableCell className="text-sm text-muted-foreground space-y-1">
                      {q.selectOptions && q.selectOptions.length > 0 ? (
                        q.selectOptions.map((option, optIndex) => {
                          const trimmedOption = option.trim();
                          const trimmedAnswer = q.answer.trim();
                          const isAnswer = trimmedOption === trimmedAnswer;
                         const textColorClass = isAnswer ? 'text-green-600 font-semibold' : 'text-muted-foreground';
                          return (
                            <div key={optIndex} className={`flex items-center ${textColorClass}`}>
                              {isAnswer ? <CheckCircle className="mr-1 h-3 w-3" /> : <span className="inline-block w-3 mr-1"></span>}
                              <span>➤ {trimmedOption}</span>
                            </div>
                          );
                        })
                      ) : (
                        <span>No options defined.</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {editingQuestionId !== q._id && (
                           <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(q)}
                            aria-label={`Edit question ${q.order}`}
                            title={`Edit question ${q.order}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                      )}
                       <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => initiateDelete(q._id)}
                        aria-label={`Delete question ${q.order}`}
                        title={`Delete question ${q.order}`}
                         disabled={editingQuestionId === q._id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>
      </div>

      {isAddMode && (
         <AiQuestionGenerator formId={formId} />
      )}

      <div ref={editFormRef} className="rounded-md border p-4 md:p-6 space-y-6 bg-muted/20">
         <h3 className="text-lg font-semibold mb-4">{formTitle}</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(isAddMode ? handleAddQuestionSubmit : handleUpdateQuestionSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Text</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., What is the speed of light?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Options</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start space-x-2">
                   <FormField
                      control={form.control}
                      name={`options.${index}.value`}
                      render={({ field: optionField }) => (
                         <FormItem className="flex-grow">
                             <FormLabel className="sr-only">Option {index + 1}</FormLabel>
                            <FormControl>
                                <Input placeholder={`Option ${index + 1}`} {...optionField} />
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
                          remove(index);
                          const removedOptionValue = form.getValues(`options.${index}.value`);
                          if (form.getValues("answer") === removedOptionValue.trim()) {
                              form.setValue("answer", "", { shouldValidate: true });
                              toast.warning("Correct answer removed. Please select a new answer.");
                          }
                          form.trigger(["options", "answer"]);
                      }}
                      aria-label={`Remove option ${index + 1}`}
                      className="mt-1"
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
                className="mt-2"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Option
              </Button>
               {form.formState.errors.options?.root && (
                 <p className="text-sm font-medium text-destructive mt-2">
                    {form.formState.errors.options.root.message}
                 </p>
                 )
               }
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
                          <FormItem key={`answer-option-${index}`} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={option.value.trim()} id={`answer-option-${index}`} />
                            </FormControl>
                            <Label htmlFor={`answer-option-${index}`} className="font-normal cursor-pointer">
                               {option.value.trim()}
                            </Label>
                          </FormItem>
                        )
                      )}
                    </RadioGroup>
                  </FormControl>
                   {currentOptions.filter(opt => opt.value.trim() !== "").length === 0 && (
                        <p className="text-sm text-muted-foreground mt-1">Enter valid options above to select an answer.</p>
                    )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-2">
                <Button type="submit" disabled={isSubmitDisabled}>
                  {submitButtonText}
                </Button>
                {!isAddMode && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isSavingEdit}>
                        <XCircle className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                )}
            </div>

          </form>
        </Form>
      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
             <DialogClose asChild>
                <Button variant="outline" disabled={isDeleting}>
                 Cancel
                </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}