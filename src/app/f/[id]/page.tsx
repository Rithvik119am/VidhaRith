"use client";
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api'; // Adjust path if needed
import { Id } from '../../../../convex/_generated/dataModel'; // Adjust path if needed
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'; // Added FormMessage
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Import RadioGroup
import { Label } from "@/components/ui/label"; // Import Label for Radio items
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import { toast } from "sonner"; // For better feedback

// Interface for the form values structure (keys are question._id)
interface QuizFormValues {
  [questionId: string]: string; // e.g., { "q1_id": "selected_option_value", "q2_id": "..." }
}

export default function Page({ params }: { params: { id: string } }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Form Details by Slug
  const formDetails = useQuery(api.forms.getBySlug, { slug: params.id });

  // 2. Fetch Questions using formId *after* formDetails is loaded
  const formId = formDetails?._id;
  const questions = useQuery(
    api.form_questions.getFormQuestions,
    formId ? { formId } : "skip" // Only run query if formId is available
  );

  const addResponse = useMutation(api.form_responses.addResponse);

  // 3. Dynamically build Zod schema and default values based on fetched questions
  const [formSchema, setFormSchema] = useState<z.ZodObject<any>>(z.object({})); // Start empty
  const [defaultVals, setDefaultVals] = useState<QuizFormValues>({});

  useEffect(() => {
    if (questions && questions.length > 0) {
      const schemaShape: { [key: string]: z.ZodString } = {};
      const defaults: QuizFormValues = {};
      questions.forEach((q) => {
        // Use question._id as the key/field name
        // Each question requires a non-empty string answer
        schemaShape[q._id] = z.string().min(1, { message: "Please select an answer." });
        defaults[q._id] = ""; // Default to empty string
      });
      setFormSchema(z.object(schemaShape));
      setDefaultVals(defaults);
      // console.log("Schema/Defaults Updated:", schemaShape, defaults);
    } else {
        // Reset if questions are removed or empty
        setFormSchema(z.object({}));
        setDefaultVals({});
    }
  }, [questions]); // Re-run when questions data changes

  // 4. Initialize react-hook-form
  const form = useForm<QuizFormValues>({
    // resolver: zodResolver(formSchema), // Apply resolver after schema is ready
    // defaultValues: defaultVals, // Apply defaults after they are ready
    // Use reset to update resolver and defaults when they change
  });

  // Use useEffect to reset the form when schema/defaults are updated
  useEffect(() => {
    form.reset(defaultVals); // Reset form with new defaults
     // Dynamically update the resolver AFTER the schema state is set
     // Note: Direct update of resolver isn't standard RHF API. Resetting usually handles it.
     // If validation doesn't work immediately, passing schema to zodResolver *inside* useForm
     // and triggering a re-render might be needed, or using a key on the Form component.
     // Let's rely on reset for now. If issues arise, revisit resolver update strategy.

     // Workaround if reset doesn't update resolver correctly: Force re-render with key
     // Or explicitly pass the new resolver:
     // form.resolver = zodResolver(formSchema); // This is not the standard way

  }, [formSchema, defaultVals, form.reset]); // Depend on schema, defaults, and reset function


  // 5. Handle Submission
  const handleSubmit = async (values: QuizFormValues) => {
    if (!formId || !questions) {
      toast.error("Form data is not fully loaded. Please wait and try again.");
      return;
    }
     setIsSubmitting(true);
    // console.log("Raw submitted values:", values);

    // Map form values to the required backend structure
    const responseValues = Object.entries(values).map(([questionId, selectedValue]) => {
      // Find the original question text using the ID
      const questionData = questions.find(q => q._id === questionId);
      return {
        questionId: questionId as Id<"form_questions">, // Cast to correct ID type
        question: questionData?.question ?? "Unknown Question", // Include question text
        userSelectedOption: selectedValue,
      };
    });

    // console.log("Formatted response values:", responseValues);

    try {
      await addResponse({
        //formId: formId,
        values: responseValues,
        slug: params.id, // Pass slug if backend still uses/needs it
      });
      setIsSubmitted(true);
      toast.success("Your submission was recorded. Thank you ❤️");
    } catch (error: any) {
       console.error("Submission failed:", error);
       toast.error(`Submission failed: ${error.message || "Unknown error"}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- Loading and Error States ---
  if (formDetails === undefined) {
    return <FormSkeleton message="Loading form details..." />;
  }
  if (formDetails === null) {
    return <div className="text-center text-destructive mt-10 px-4">Form not found for slug: {params.id}</div>;
  }
   // Still loading questions after form details are loaded
  if (questions === undefined && formId) {
     return <FormSkeleton title={formDetails.name} description={formDetails.description} message="Loading questions..." count={3} />;
  }
  // Form exists but has no questions
  if (questions && questions.length === 0) {
      return (
          <div className="container mx-auto p-3 md:p-8 max-w-2xl bg-white rounded-lg shadow-sm">
              <h1 className="text-2xl md:text-3xl font-bold mb-3">{formDetails.name || params.id}</h1>
              {formDetails.description && <p className="text-muted-foreground mb-6">{formDetails.description}</p>}
              <div className="text-center text-muted-foreground mt-10 p-6 border border-dashed rounded-md">This form currently has no questions.</div>
          </div>
      );
  }
  // Questions loaded but schema/defaults haven't updated yet (should be quick)
  // Or if questions array exists but is empty after initial load
  if (Object.keys(formSchema.shape).length === 0 && questions && questions.length > 0) {
      return <FormSkeleton title={formDetails.name} description={formDetails.description} message="Initializing form..." count={questions.length} />;
  }


  // --- Render Form ---
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl bg-white rounded-lg shadow-sm">
      {isSubmitted ? (
        <div className="text-center p-10 rounded-lg shadow-sm border border-green-200 bg-green-50">
          <div className="text-green-600 text-xl md:text-2xl font-medium mb-3">Thank You!</div>
          <p className="text-green-700">Your submission has been successfully recorded.</p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-3">{formDetails.name || params.id}</h1>
            {formDetails.description && (
              <p className="text-gray-600 md:text-lg">{formDetails.description}</p>
            )}
          </div>

          {/* Pass the dynamic schema to the resolver */}
          <Form {...form}>
            {/* Use a key based on formId to force re-render if the form itself changes */}
            <form key={formId} onSubmit={form.handleSubmit(handleSubmit, (errors) => {
                console.error("Form validation errors:", errors);
                toast.error("Please answer all questions before submitting.");
            })} className="space-y-8">
              {questions && questions.map((question, index) => (
                <FormField
                  key={question._id} // Use question ID as key for the field
                  control={form.control}
                  name={question._id} // Use question ID as the field name in react-hook-form
                  render={({ field }) => (
                    <FormItem className="space-y-4 p-3 sm:p-5 border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 bg-gray-50">
                      <FormLabel className="text-base md:text-lg font-semibold block">
                        {`${index + 1}. ${question.question}`}
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange} // Update RHF state on change
                          defaultValue={field.value} // Set initial value (controlled)
                          className="flex flex-col space-y-3 pt-2"
                        >
                          {question.selectOptions?.map((option) => (
                            <FormItem key={`${question._id}-${option}`} className="flex items-start space-x-2 md:space-x-3 space-y-0">
                              <FormControl className="mt-1">
                                <RadioGroupItem value={option} id={`${question._id}-${option}`} />
                              </FormControl>
                              <Label 
                                htmlFor={`${question._id}-${option}`} 
                                className="font-normal cursor-pointer text-sm sm:text-base break-words hyphens-auto"
                                style={{ wordWrap: 'break-word', maxWidth: 'calc(100% - 30px)' }}
                              >
                                {option}
                              </Label>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className="text-red-500" /> {/* Display validation error for this question */}
                    </FormItem>
                  )}
                />
              ))}
              <div className="pt-4 pb-8">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !form.formState.isValid}
                  className="w-full md:w-auto px-8 py-2 text-base font-medium rounded-md"
                >
                  {isSubmitting ? "Submitting..." : "Submit Answers"}
                </Button>
              </div>
            </form>
          </Form>
        </>
      )}
    </div>
  );
}


// --- Helper Loading Skeleton Component ---
function FormSkeleton({ title, description, message = "Loading...", count = 3 }: { title?: string | null, description?: string | null, message?: string, count?: number }) {
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-2xl bg-white rounded-lg shadow-sm animate-pulse">
            {title ? <h1 className="text-2xl md:text-3xl font-bold mb-3">{title}</h1> : <Skeleton className="h-8 w-3/4 mb-3" />}
            {description ? <p className="text-muted-foreground mb-6">{description}</p> : <Skeleton className="h-5 w-full mb-6" />}
            <div className='text-center my-6 font-medium text-muted-foreground'>{message}</div>
            <div className="space-y-8">
                {[...Array(count)].map((_, i) => (
                    <div key={i} className="space-y-4 p-3 sm:p-5 border rounded-lg bg-gray-50">
                        <Skeleton className="h-6 w-5/6" /> {/* Question Label */}
                        <div className="flex flex-col space-y-3 pt-2">
                            <Skeleton className="h-5 w-2/3" /> {/* Option 1 */}
                            <Skeleton className="h-5 w-2/3" /> {/* Option 2 */}
                            <Skeleton className="h-5 w-2/3" /> {/* Option 3 */}
                        </div>
                    </div>
                ))}
                <div className="pt-4 pb-8">
                    <Skeleton className="h-10 w-full md:w-32" /> {/* Submit Button */}
                </div>
            </div>
        </div>
    );
}