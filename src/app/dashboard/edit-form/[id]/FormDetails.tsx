// --- START OF FILE FormDetails.tsx ---

"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery, Authenticated, Unauthenticated, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from "../../../../../convex/_generated/dataModel";
import { z} from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; // Import FormMessage
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // Use sonner instead of useToast
import { useCopyToClipboard } from "react-use";
import { Copy, ExternalLink } from "lucide-react"; // Icons for copy/open link buttons

const formSchema = z.object({
  name: z.string().min(1, { message: "Form name cannot be empty." }), // Add validation
  description: z.string().optional().or(z.literal('')), // Description can be empty
  slug: z.string()
    .min(5, { message: "Slug must be at least 5 characters long." })
    // Regex to allow letters, numbers, hyphens, and underscores, preventing spaces
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Slug can only contain letters, numbers, hyphens, and underscores." })
    .transform(s => s.toLowerCase()), // Conventionally slugs are lowercase
});

export default function FormDetails({ id }: { id: string } ) {
  const formDetails = useQuery(api.forms.get, { formId: id as Id<"forms"> });
  const updateForm = useMutation(api.forms.update);
  // const { toast } = useToast(); // No longer needed
  const [, copyToClipboard] = useCopyToClipboard();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      slug: '',
    },
    // Use reValidateMode or onChange for better real-time validation feedback
    mode: "onChange", // or "onBlur"
  });

  const watchSlug = form.watch('slug');

  // Reset form with fetched data
  useEffect(() => {
    if (formDetails) {
      form.reset({ // Use reset to fully set default values and validation state
        name: formDetails.name || '',
        description: formDetails.description || '',
        slug: formDetails.slug || '',
      });
    }
  }, [formDetails, form]); // Add 'form' to dependency array as per react-hook-form docs

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const { name, description, slug } = values;
    // Zod resolver handles validation before this function is called
    // No need for manual checks like name.trim() === '' or slug length/spaces
    // Server-side validation for slug uniqueness should be handled in the mutation

    try {
        await updateForm({ formId: id as Id<"forms">, name, description: description || '', slug }); // Ensure description is string
        toast.success('Form details updated successfully!'); // Use sonner toast
    } catch (e: any) {
        console.error("Failed to update form:", e);
        // Display server error message
        toast.error(`Failed to update form: ${e.data || e.message || e.toString()}`);
    }
  };

  const formUrl = watchSlug ? `${process.env.NEXT_PUBLIC_WEBSITE_URL}/f/${watchSlug}` : 'Loading...';

  const handleCopy = () => {
    if (!watchSlug) return;
    copyToClipboard(formUrl);
    toast.info('Form URL copied to clipboard.'); // Use sonner toast
  };

  const handleOpenForm = () => {
    console.log('Opening form...', formUrl, watchSlug);
     if (watchSlug) {
         window.open("http://"+formUrl, '_blank');
     }
  };

  return (
    <div className="space-y-6"> {/* Add spacing below header */}
        <h2 className="text-xl font-semibold">Form Settings</h2> {/* Add a clear heading */}

        {/* URL Display Section */}
        <div className="space-y-2 p-4 border rounded-md bg-muted/20">
          <Label htmlFor="formUrl">Publish this URL to collect responses:</Label>
          <div className="flex space-x-2">
            <Input
              id="formUrl"
              type="text"
              readOnly // Use readOnly instead of disabled
              value={formDetails === undefined ? 'Loading...' : formUrl}
              className="flex-grow bg-white"
            />
            <Button type="button" onClick={handleCopy} disabled={!watchSlug}>
                <Copy className="mr-2 h-4 w-4" /> Copy Link
            </Button>
             <Button type="button" variant="outline" onClick={handleOpenForm} disabled={!watchSlug}>
                <ExternalLink className="mr-2 h-4 w-4" /> Open
            </Button>
          </div>
           {!watchSlug && formDetails !== undefined && (
             <p className="text-sm text-red-600 mt-1">Please set a valid slug (at least 5 chars, no spaces) to enable the URL.</p>
           )}
        </div>

        {/* Form Details Editing Section */}
        <div className="rounded-md border p-4 md:p-6 space-y-4">
           <h3 className="text-lg font-semibold mb-4">Basic Info</h3>
           <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Slug */}
              <FormField
              control={form.control}
              name="slug"
              render={({field}) => (
                <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                <Input placeholder="e.g. feedback-survey-2023" {...field} />
                </FormControl>
                <FormMessage /> {/* Display validation error */}
                </FormItem>
              )} />

              {/* Name */}
              <FormField
              control={form.control}
              name="name"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                <Input placeholder="My Awesome Form" {...field} />
                </FormControl>
                 <FormMessage /> {/* Display validation error */}
                </FormItem>
              )}/>

              {/* Description */}
              <FormField
              control={form.control}
              name="description"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                <Input placeholder="A brief description of the form" {...field} />
                </FormControl>
                <FormMessage /> {/* Display validation error */}
                </FormItem>

              )} />

              <Button type="submit" disabled={!form.formState.isDirty || !form.formState.isValid}>
                 Save Changes
              </Button>
            </form>
            </Form>
        </div>
    </div>
  );
}