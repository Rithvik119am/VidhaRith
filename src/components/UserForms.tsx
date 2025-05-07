// --- START OF FILE UserForms.tsx ---
"use client";

import React, { useState } from 'react';
import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from '../../convex/_generated/dataModel';

// shadcn/ui components - Removed Table components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'; // Keep Card, CardContent
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Icons
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';

// Navigation hook
import { useRouter } from 'next/navigation';

// Toast notification
import { toast } from "sonner";

// Need line-clamp for description truncation in list view
// Make sure you have the @tailwindcss/line-clamp plugin installed and configured
// Or use a different method for truncation if not using Tailwind CSS
// import '@/styles/globals.css'; // Assuming line-clamp is part of your global styles


export default function UserForms() {
  const router = useRouter();

  const createForm = useMutation(api.forms.create);
  const deleteForm = useMutation(api.forms.deleteForm);

  const forms = useQuery(api.forms.getUserForms, {});

  const [isCreating, setIsCreating] = useState(false);
  // Use null for no deletion pending, or the ID of the form to delete
  const [deletingFormId, setDeletingFormId] = useState<Id<"forms"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const handleCreateClick = async () => {
      setIsCreating(true);
    try {
        const newFormId = await createForm({});
        toast.success("New form created!");
        router.push(`edit-form/${newFormId}`);
    } catch (e: any) {
        console.error("Failed to create form:", e);
        toast.error(`Failed to create form: ${e.data || e.message || e.toString()}`);
         setIsCreating(false); // Reset state on error
    }
  };

  // This function is called when the AlertDialogTrigger button for a specific form is clicked.
  const handleTriggerDeleteClick = (formId: Id<"forms">) => {
     // Setting this state opens the AlertDialog because we bind the AlertDialog's 'open' prop to this state.
     setDeletingFormId(formId);
  }


  const confirmDelete = async () => {
      if (!deletingFormId) {
          return; // Should not happen if the button is disabled when not deleting
      }

      setIsDeleting(true);

      try {
          await deleteForm({ formId: deletingFormId });
          toast.success("Form deleted successfully!");
      } catch (e: any) {
          console.error("Failed to delete form:", e);
          toast.error(`Failed to delete form: ${e.data || e.message || e.toString()}`);
      } finally {
          // Close the dialog and reset state regardless of success/failure
          setDeletingFormId(null);
          setIsDeleting(false);
      }
  };


  // --- Render Logic ---

    // Show loading state while fetching forms
    if (forms === undefined) {
        return (
             <div className="container mx-auto py-8 space-y-6">
                <h2 className="text-2xl font-bold">Your Forms</h2>
                 <div className="space-y-4"> {/* Space between skeleton items */}
                    {/* Card-like skeletons */}
                     <div className="border rounded-md p-4 space-y-2">
                        <Skeleton className="h-6 w-3/4" /> {/* Skeleton for name */}
                        <Skeleton className="h-4 w-full" /> {/* Skeleton for description */}
                     </div>
                     <div className="border rounded-md p-4 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                     </div>
                      <div className="border rounded-md p-4 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                     </div>
                 </div>
                 <Skeleton className="h-10 w-32 mt-4" /> {/* Skeleton for New button */}
            </div>
        );
    }
 
    return (
        <div className="container mx-auto py-8 space-y-6">
            <Unauthenticated>
                <div className="text-center text-lg text-muted-foreground">Please sign in to view and manage your forms.</div>
            </Unauthenticated>
            <Authenticated>
                {/* Header with title and New Form button */}
                <div className="flex justify-between items-center mb-6"> {/* Added bottom margin for separation */}
                    
                    <h2 className="text-2xl font-bold">Your Forms</h2>
                    
                     <Button onClick={handleCreateClick} disabled={isCreating}>
                         {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                         {isCreating ? "Creating..." : "New Form"}
                     </Button>
                </div>


                {forms && forms.length > 0 ? (
                    // Use a div with space-y to list forms as cards
                    <div className="space-y-4">
                        {forms.map((form) => (
                            // Each form is a Card
                            <Card key={form._id}>
                                <CardContent className="p-4"> {/* Add padding inside the card */}
                                    {/* Flex container to hold form info and delete button */}
                                    <div className="flex justify-between items-center">
                                        {/* Left side: Form Name (as link) and Description */}
                                        {/* flex-1 allows this section to grow and take available space */}
                                        <div className="flex-1 pr-4"> {/* Add right padding to separate from button */}
                                            {/* Form Name as a clickable link */}
                                            <a href={`edit-form/${form._id}`} className="block text-lg font-semibold text-primary hover:underline mb-1">
                                                {form.name || `Form ${form._id.slice(-4)}`}
                                            </a>
                                            {/* Description - truncated to 2 lines */}
                                             {/* Requires @tailwindcss/line-clamp plugin */}
                                            <p className="text-muted-foreground text-sm line-clamp-2">
                                                {form.description || '-'}
                                            </p>
                                        </div>

                                        {/* Right side: Actions (Delete Button) */}
                                        {/* flex-shrink-0 prevents the button area from shrinking */}
                                        <div className="flex-shrink-0 ">
                                            {/* Delete Button wrapped in AlertDialog Trigger */}
                                            {/* Bind the AlertDialog open state to deletingFormId */}
                                             <AlertDialog
                                                open={deletingFormId === form._id}
                                                 // When the dialog's open state changes (e.g., closed by clicking outside),
                                                 // if it's closing, reset the deletingFormId.
                                                
                                                onOpenChange={(isOpen) => !isOpen && setDeletingFormId(null)}
                                             >
                                                <AlertDialogTrigger asChild>
                                                     {/* Use an icon button */}
                                                     <Button
                                                         variant="ghost"
                                                         size="icon" // Small square button
                                                         aria-label={`Delete form "${form.name || `Form ${form._id.slice(-4)}`}"`}
                                                         onClick={() => handleTriggerDeleteClick(form._id)} // Set the ID when this trigger button is clicked
                                                     >
                                                         <Trash2 className="h-4 w-4 text-destructive" />
                                                     </Button>
                                                </AlertDialogTrigger>
                                                {/* AlertDialogContent is conditionally rendered based on the 'open' prop */}
                                                {/* It automatically has access to the deletingFormId state */}
                                                <AlertDialogContent
                                                >
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the form
                                                            <span className="font-semibold"> &ldquo;{forms.find(f => f._id === deletingFormId)?.name || `Form ${deletingFormId?.slice(-4) || '...'}`}&ldquo; </span>
                                                            and all associated questions and responses.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel onClick={() => setDeletingFormId(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
                                                             {isDeleting ? (
                                                                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : null}
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                             </AlertDialog>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    // Empty state message
                    <div className="text-center p-6 border rounded-md bg-muted/20">
                        <p className="text-muted-foreground">You don&quot;t have any forms yet. Create your first one!</p>
                    </div>
                )}


            </Authenticated>
        </div>
    );
}