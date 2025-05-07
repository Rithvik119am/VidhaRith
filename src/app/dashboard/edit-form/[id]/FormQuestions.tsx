// FormQuestions.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react'; // Import useEffect and useRef
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from "../../../../../convex/_generated/dataModel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, PlusCircle, CheckCircle, Edit2, Save, XCircle } from 'lucide-react'; // Added Edit2, Save, XCircle icons
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import AiQuestionGenerator from '@/components/AiQuestionGenerator';

// Zod schema for form validation (reused for both add and edit)
const optionSchema = z.object({
  value: z.string().min(1, { message: "Option cannot be empty." })
});

const formSchema = z.object({
  question: z.string().min(1, { message: "Question cannot be empty." }),
  options: z.array(optionSchema)
    .min(2, { message: "Please provide at least two options." })
    // Add refinement for unique options (case-insensitive after trimming)
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
  const updateQuestion = useMutation(api.form_questions.updateQuestion); // Use the new mutation
  const deleteQuestion = useMutation(api.form_questions.deleteQuestion);

  const [isSubmitting, setIsSubmitting] = useState(false); // For Add mode
  const [isSavingEdit, setIsSavingEdit] = useState(false); // For Edit mode
  const [editingQuestionId, setEditingQuestionId] = useState<Id<"form_questions"> | null>(null); // State to track edited question
  const editFormRef = useRef<HTMLDivElement>(null); // Ref for edit form scrolling

  // React Hook Form instance
  const form = useForm<FormSchemaValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      options: [{ value: "" }, { value: "" }],
      answer: "",
    },
    mode: "onChange",
  });

  const { fields, append, remove, replace } = useFieldArray({ // Added 'replace'
    control: form.control,
    name: "options"
  });

  // Watch options to update radio group for answer selection
  const currentOptions = form.watch("options");

  // --- Handle starting edit mode ---
  const handleStartEdit = (question: NonNullable<typeof formQuestions>[number]) => {
    setEditingQuestionId(question._id);
    // Reset form with question data
    form.reset({
      question: question.question,
      options: question.selectOptions ? question.selectOptions.map(opt => ({ value: opt })) : [], // Map options to {value: string} format
      answer: question.answer,
    });
    form.clearErrors(); // Clear any lingering errors from previous attempts
  };

  // Scroll to edit form when entering edit mode
  useEffect(() => {
    if (editingQuestionId && editFormRef.current) {
      editFormRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [editingQuestionId]);

  // --- Handle cancelling edit mode ---
  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    // Reset form to default 'add' state
    form.reset({
      question: "",
      options: [{ value: "" }, { value: "" }],
      answer: "",
    });
     form.clearErrors(); // Clear errors
  };

  // --- Handle Add Question Submission ---
  const handleAddQuestionSubmit = async (values: FormSchemaValues) => {
     setIsSubmitting(true);
     // Trim values before sending to backend
     const trimmedValues = {
         ...values,
         question: values.question.trim(),
         options: values.options.map(opt => ({ value: opt.value.trim() })), // Trim option values
         answer: values.answer.trim(), // Trim answer value
     };

     // Perform client-side validation with trimmed values just before sending
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
      selectOptions: trimmedOptionsArray, // Use trimmed & filtered options array
      answer: trimmedValues.answer,
    };

    try {
        await addQuestion(questionData);
        toast.success("Question added successfully!");
        // Reset form to default 'add' state
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

  // --- Handle Update Question Submission ---
  const handleUpdateQuestionSubmit = async (values: FormSchemaValues) => {
      if (!editingQuestionId) return; // Should not happen if button is enabled correctly

      setIsSavingEdit(true);
      // Trim values before sending to backend
      const trimmedValues = {
          ...values,
          question: values.question.trim(),
          options: values.options.map(opt => ({ value: opt.value.trim() })), // Trim option values
          answer: values.answer.trim(), // Trim answer value
      };

       // Perform client-side validation with trimmed values just before sending
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
          questionInternalId: editingQuestionId, // Pass the ID
          question: trimmedValues.question,
          selectOptions: trimmedOptionsArray, // Use trimmed & filtered options array
          answer: trimmedValues.answer,
      };

      try {
          await updateQuestion(questionData);
          toast.success("Question updated successfully!");
          handleCancelEdit(); // Exit edit mode on success
      } catch (error: any) {
          console.error("Failed to update question:", error);
          toast.error(`Failed to update question: ${error.data || error.message || error.toString()}`);
      } finally {
          setIsSavingEdit(false);
      }
  };


  const handleDeleteQuestion = async (questionInternalId: Id<"form_questions">) => {
     if (editingQuestionId === questionInternalId) {
          // If trying to delete the question currently being edited, cancel edit first
         handleCancelEdit();
     }

     if (!confirm("Are you sure you want to delete this question?")) {
         return;
     }
     try {
        await deleteQuestion({ questionInternalId });
        toast.success("Question deleted successfully!");
        // Data will refetch automatically due to useQuery
     } catch (error: any) {
         console.error("Failed to delete question:", error);
         toast.error(`Failed to delete question: ${error.data || error.message || error.toString()}`);
     }
  };

  // Determine if we are in add mode or edit mode
  const isAddMode = editingQuestionId === null;
  const submitButtonText = isAddMode ? (isSubmitting ? "Adding..." : "Add Question") : (isSavingEdit ? "Saving..." : "Save Changes");
  const isSubmitDisabled = isAddMode ? isSubmitting || !form.formState.isValid : isSavingEdit || !form.formState.isValid;
  const formTitle = isAddMode ? "Add New Question" : "Edit Question";


  // Effect to handle cleaning up edit mode if the data refetches and the edited question is gone
  useEffect(() => {
    if (editingQuestionId && formQuestions && !formQuestions.find(q => q._id === editingQuestionId)) {
      console.log("Edited question no longer exists in the list, cancelling edit.");
      handleCancelEdit(); // Cancel edit if the question disappears
    }
  }, [formQuestions, editingQuestionId]); // Depend on the fetched questions and editing ID

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Form Questions (MCQ)</h2>

      {/* Display Existing Questions */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Existing Questions</h3>
        <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Options (Correct Answer Marked)</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead> {/* Increased width for actions */}
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
                  <TableRow key={q._id} className={editingQuestionId === q._id ? "bg-primary/5" : ""}> {/* Highlight the row being edited */}
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
                    <TableCell className="text-right space-x-2"> {/* Added space-x-2 */}
                      {editingQuestionId !== q._id && ( // Only show edit if NOT currently editing this one
                           <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(q)}
                            aria-label={`Edit question ${q.order}`}
                            title={`Edit question ${q.order}`} // Add title for hover tooltip
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuestion(q._id)}
                        aria-label={`Delete question ${q.order}`}
                        title={`Delete question ${q.order}`} // Add title for hover tooltip
                         // Disable delete if currently editing this question
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

      {/* AI Question Generator (Assuming this is below the list but before the form) */}
      {/* Only show if not in edit mode */}
      {isAddMode && (
         <AiQuestionGenerator formId={formId} />
      )}


      {/* Add New Question Form / Edit Question Form */}
      <div ref={editFormRef} className="rounded-md border p-4 md:p-6 space-y-6 bg-muted/20">
         <h3 className="text-lg font-semibold mb-4">{formTitle}</h3>
        <Form {...form}>
          {/* Use conditional onSubmit */}
          <form onSubmit={form.handleSubmit(isAddMode ? handleAddQuestionSubmit : handleUpdateQuestionSubmit)} className="space-y-6">
            {/* Question Input */}
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

            {/* Dynamic Options Input */}
            <div className="space-y-3">
              <FormLabel>Options</FormLabel>
              {/* Iterate through fields managed by useFieldArray */}
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start space-x-2">
                   <FormField
                      control={form.control}
                      // Field array name structure: options.[index].value
                      name={`options.${index}.value`}
                      render={({ field: optionField }) => ( // Use alias to avoid collision with formField
                         <FormItem className="flex-grow">
                             <FormLabel className="sr-only">Option {index + 1}</FormLabel>
                            <FormControl>
                               {/* Bind input props directly from useFieldArray field */}
                                <Input placeholder={`Option ${index + 1}`} {...optionField} />
                            </FormControl>
                             {/* Show specific option error message if it exists */}
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
                           // Remove the option
                          remove(index);
                           // If the removed option was the selected answer, clear the answer field
                          const removedOptionValue = form.getValues(`options.${index}.value`); // Get value BEFORE removal
                          if (form.getValues("answer") === removedOptionValue.trim()) {
                              form.setValue("answer", "", { shouldValidate: true });
                              toast.warning("Correct answer removed. Please select a new answer.");
                          }
                           // After removal, re-validate the options array (uniqueness, min length) and the answer
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
               {/* Display root errors for the options array (e.g., min length, uniqueness) */}
               {form.formState.errors.options?.root && (
                 <p className="text-sm font-medium text-destructive mt-2">
                    {form.formState.errors.options.root.message}
                 </p>
                 )
               }
            </div>

            {/* Answer Selection */}
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
                           // Manually trigger validation for the answer field after change
                           form.trigger("answer");
                      }}
                      value={field.value}
                      className="flex flex-col space-y-2"
                    >
                      {/* Filter out empty options before mapping for answer selection */}
                      {currentOptions.filter(opt => opt.value.trim() !== "").map((option, index) => (
                          <FormItem key={`answer-option-${index}`} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                               {/* Ensure value is trimmed for radio group consistency */}
                              <RadioGroupItem value={option.value.trim()} id={`answer-option-${index}`} />
                            </FormControl>
                            <Label htmlFor={`answer-option-${index}`} className="font-normal cursor-pointer">
                               {option.value.trim()} {/* Display trimmed option */}
                            </Label>
                          </FormItem>
                        )
                      )}
                    </RadioGroup>
                  </FormControl>
                   {/* Show message if no valid options are available to select */}
                   {currentOptions.filter(opt => opt.value.trim() !== "").length === 0 && (
                        <p className="text-sm text-muted-foreground mt-1">Enter valid options above to select an answer.</p>
                    )}
                  <FormMessage /> {/* Shows validation errors for 'answer' */}
                </FormItem>
              )}
            />

            {/* Action Buttons (Submit and Cancel Edit) */}
            <div className="flex space-x-2">
                <Button type="submit" disabled={isSubmitDisabled}>
                  {submitButtonText}
                </Button>
                 {/* Show Cancel button only in edit mode */}
                {!isAddMode && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isSavingEdit}>
                        <XCircle className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                )}
            </div>

          </form>
        </Form>
      </div>
    </div>
  );
}