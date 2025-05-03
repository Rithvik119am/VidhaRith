"use client";
import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api'; // Adjust path as needed
import { Id } from "../../../../../convex/_generated/dataModel"; // Adjust path as needed
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, PlusCircle, CheckCircle } from 'lucide-react'; // Added CheckCircle icon
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner"; // Using sonner for notifications
import AiQuestionGenerator from '@/components/AiQuestionGenerator';

// Zod schema for form validation
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
  // Fetch existing questions, ordered by 'order'
  // Consider adding loading/error states for the query as well
  const formQuestions = useQuery(api.form_questions.getFormQuestions, { formId });
  const addQuestion = useMutation(api.form_questions.addQuestion);
  const deleteQuestion = useMutation(api.form_questions.deleteQuestion);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormSchemaValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      options: [{ value: "" }, { value: "" }], // Start with two empty options
      answer: "", // Use empty string instead of undefined for radio group compatibility
    },
     mode: "onChange", // Enable real-time validation feedback
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options"
  });

  // Watch options to update radio group for answer selection
  const currentOptions = form.watch("options");

  const handleAddQuestion = async (values: FormSchemaValues) => {
     setIsSubmitting(true);
     console.log("Submitting values:", values);

     // Ensure the selected answer is actually one of the current trimmed options
     const trimmedOptions = values.options.map(opt => opt.value.trim());
     const trimmedAnswer = values.answer.trim(); // Trim the answer value

     const validAnswer = trimmedOptions.includes(trimmedAnswer);

     if (!validAnswer && trimmedOptions.length > 0 && trimmedAnswer !== "") {
         // Clear the answer if the selected value is no longer a valid option
         form.setValue("answer", "", { shouldValidate: true });
         form.setError("answer", { type: "manual", message: "Selected answer is not a valid option. Please re-select." });
         toast.warning("Selected answer is no longer valid. Please re-select.");
         setIsSubmitting(false);
         return;
     }
      // If answer is valid but formState.errors still shows an old answer error, clear it
     if (form.formState.errors.answer && validAnswer) {
         form.clearErrors("answer");
     }


    const numberOfExistingQuestions = formQuestions ? formQuestions.length : 0;
    const questionData = {
      formId: formId,
      question: values.question.trim(),
      order: BigInt(numberOfExistingQuestions + 1), // Simple ordering
      type: "mcq" as const, // Explicitly set type
      selectOptions: trimmedOptions.filter(opt => opt !== ""), // Use trimmed & filtered options
      answer: trimmedAnswer, // Use the trimmed answer
    };

    try {
        await addQuestion(questionData);
        toast.success("Question added successfully!");
        form.reset({
            question: "",
            options: [{ value: "" }, { value: "" }],
            answer: "",
        }); // Reset form to default
    } catch (error: any) {
        console.error("Failed to add question:", error);
        toast.error(`Failed to add question: ${error.data || error.message || error.toString()}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionInternalId: Id<"form_questions">) => {
     // Optional: Add confirmation dialog
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Form Questions (MCQ)</h2> {/* Added heading */}

      {/* Display Existing Questions */}
      <div> {/* Wrapped table for potential future styling/margin */}
        <h3 className="text-lg font-semibold mb-3">Existing Questions</h3> {/* Added subheading */}
        <div className="rounded-md border overflow-hidden"> {/* Ensure border and rounded corners */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Question</TableHead>
                  {/* Modified TableHead to combine Options & Answer */}
                  <TableHead>Options (Correct Answer Marked)</TableHead>
                  <TableHead className="w-[50px] text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formQuestions === undefined && (
                  // Updated colSpan
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Loading questions...
                    </TableCell>
                  </TableRow>
                )}
                 {formQuestions && formQuestions.length === 0 && (
                  // Updated colSpan
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No questions added yet.
                    </TableCell>
                  </TableRow>
                )}
                {formQuestions && formQuestions.map((q) => (
                  <TableRow key={q._id}>
                    <TableCell>{q.order.toString()}</TableCell> {/* Convert BigInt to string */}
                    <TableCell className="font-medium">{q.question}</TableCell>
                    {/* --- Modified TableCell for Options & Answer --- */}
                    <TableCell className="text-sm text-muted-foreground space-y-1"> {/* Added space-y-1 for vertical spacing */}
                      {q.selectOptions && q.selectOptions.length > 0 ? (
                        q.selectOptions.map((option, optIndex) => {
                          // Trim option and answer for comparison
                          const trimmedOption = option.trim();
                          const trimmedAnswer = q.answer.trim();
                          const isAnswer = trimmedOption === trimmedAnswer;
                           // Determine text color based on whether it's the answer
                           const textColorClass = isAnswer ? 'text-green-600 font-semibold' : 'text-muted-foreground';
                          return (
                            <div key={optIndex} className={`flex items-center ${textColorClass}`}>
                              {/* Add an icon for the correct answer */}
                              {isAnswer ? <CheckCircle className="mr-1 h-3 w-3" /> : <span className="inline-block w-3 mr-1"></span>} {/* Use a blank space for alignment */}
                              <span>➤{trimmedOption}</span> {/* Display the trimmed option */}
                            </div>
                            
                          );
                        })
                      ) : (
                        // Fallback if somehow options are empty (shouldn't happen with schema)
                        <span>No options defined.</span>
                      )}
                    </TableCell>
                    {/* --- Removed the separate Answer TableCell --- */}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuestion(q._id)}
                        aria-label={`Delete question ${q.order}`}
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
      <AiQuestionGenerator formId={formId} />


      {/* Add New Question Form */}
      <div className="rounded-md border p-4 md:p-6 space-y-6 bg-muted/20"> {/* Added background for separation */}
         <h3 className="text-lg font-semibold mb-4">Add New Question</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAddQuestion)} className="space-y-6">
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
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start space-x-2"> {/* Use items-start */}
                   <FormField
                      control={form.control}
                      name={`options.${index}.value`}
                      render={({ field }) => (
                         <FormItem className="flex-grow">
                             {/* Hide label for options - sr-only is fine */}
                             <FormLabel className="sr-only">Option {index + 1}</FormLabel>
                            <FormControl>
                                <Input placeholder={`Option ${index + 1}`} {...field} />
                            </FormControl>
                             {/* Only show message if there's a specific error for this field */}
                            {form.formState.errors.options?.[index]?.value && (
                                 <FormMessage className="mt-1">
                                     {form.formState.errors.options[index]?.value?.message}
                                 </FormMessage>
                             )}
                         </FormItem>
                      )}
                    />
                  {fields.length > 2 && ( // Only show delete button if more than 2 options
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      aria-label={`Remove option ${index + 1}`}
                      className="mt-1" // Align button with input baselines
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
                    {/* Use Controller for complex state interaction with RadioGroup */}
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value)} // Pass the value directly
                      value={field.value} // Controlled component
                      className="flex flex-col space-y-2" // Added space-y-2
                    >
                      {/* Filter out empty options before mapping */}
                      {currentOptions.filter(opt => opt.value.trim() !== "").map((option, index) => (
                          <FormItem key={`answer-option-${index}`} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                               {/* Ensure value is trimmed for radio group consistency */}
                              <RadioGroupItem value={option.value.trim()} id={`answer-option-${index}`} />
                            </FormControl>
                            <Label htmlFor={`answer-option-${index}`} className="font-normal cursor-pointer"> {/* Added cursor-pointer */}
                               {option.value.trim()} {/* Display trimmed option */}
                            </Label>
                          </FormItem>
                        )
                      )}
                    </RadioGroup>
                  </FormControl>
                   {/* Show message if no options are valid yet */}
                    {currentOptions.filter(opt => opt.value.trim() !== "").length === 0 && (
                        <p className="text-sm text-muted-foreground mt-1">Enter valid options above to select an answer.</p>
                    )}
                  <FormMessage /> {/* Shows validation errors for 'answer' */}
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
              {isSubmitting ? "Adding..." : "Add Question"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}