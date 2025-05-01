// --- START OF FILE UserForms.tsx ---
"use client";

// Remove 'use' hook from React import as it's experimental and not needed here
import React, { useState } from 'react'; // Import useState
import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from '../../convex/_generated/dataModel';

// shadcn/ui components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added Card
import { Skeleton } from '@/components/ui/skeleton'; // Added Skeleton
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
} from "@/components/ui/alert-dialog"; // Added AlertDialog

// Icons
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';

// Navigation hook
import { useRouter } from 'next/navigation';

// Toast notification
import { toast } from "sonner";


export default function UserForms() {
  const router = useRouter(); // Initialize router

  const createForm = useMutation(api.forms.create);
  const deleteForm = useMutation(api.forms.deleteForm); // This is the function you call

  const forms = useQuery(api.forms.getUserForms, {});

  const [isCreating, setIsCreating] = useState(false);
  const [deletingFormId, setDeletingFormId] = useState<Id<"forms"> | null>(null); // Track which form ID is pending deletion confirmation
  const [isDeleting, setIsDeleting] = useState(false); // <-- New state to track if deletion mutation is in progress


  const handleCreateClick = async () => {
      setIsCreating(true);
    try {
        const newFormId = await createForm({});
        toast.success("New form created!");
        // Redirect to form page using router.push
        router.push(`/edit-form/${newFormId}`);
        // No need to setIsCreating(false) here as the component will likely unmount or navigate
    } catch (e: any) {
        console.error("Failed to create form:", e);
        toast.error(`Failed to create form: ${e.data || e.message || e.toString()}`);
         setIsCreating(false); // Reset state on error
    }
  };

  const handleDeleteClick = (formId: Id<"forms">) => {
    // This function is called when the AlertDialogTrigger button is clicked.
    // It sets the formId that the dialog is currently asking about.
    setDeletingFormId(formId);
    // The dialog's open state is managed implicitly by `deletingFormId !== null`
    // or explicitly if you were using a separate boolean state for the dialog.
    // Using the ID directly works with the AlertDialogTrigger/Content setup.
  };

  const confirmDelete = async () => {
      if (!deletingFormId) {
          // This shouldn't happen if the button is only clickable when dialog is open,
          // but it's a good safeguard.
          return;
      }

      setIsDeleting(true); // <-- Set loading state to true BEFORE calling the mutation

      try {
          // Call the delete mutation function
          await deleteForm({ formId: deletingFormId });
          toast.success("Form deleted successfully!");
          // Forms list will automatically refetch due to useQuery
      } catch (e: any) {
          console.error("Failed to delete form:", e);
          toast.error(`Failed to delete form: ${e.data || e.message || e.toString()}`);
      } finally {
          setDeletingFormId(null); // Reset deleting state (closes dialog)
          setIsDeleting(false); // <-- Set loading state back to false
      }
  };


  // --- Render Logic ---

    // Show loading state while fetching forms
    if (forms === undefined) {
        return (
             <div className="container mx-auto py-8 space-y-6">
                <h2 className="text-2xl font-bold">Your Forms</h2>
                 <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                 </div>
                 <Skeleton className="h-10 w-32 mt-4" /> {/* Skeleton for New button */}
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-6"> {/* Add container padding and spacing */}
            <Unauthenticated>
                <div className="text-center text-lg text-muted-foreground">Please sign in to view and manage your forms.</div>
            </Unauthenticated>
            <Authenticated>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Your Forms</h2>
                     <Button onClick={handleCreateClick} disabled={isCreating}>
                         {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                         {isCreating ? "Creating..." : "New Form"}
                     </Button>
                </div>


                {forms && forms.length > 0 ? (
                    // Wrap table in Card for better presentation
                    <Card>
                        <CardContent className="p-0"> {/* Remove padding if table is full width */}
                            <div className="rounded-md border overflow-hidden"> {/* Ensure rounded corners/border on the table */}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead className="max-w-[300px] truncate">Description</TableHead> {/* Add truncate */}
                                            <TableHead className="w-[80px] text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {forms.map((form) => (
                                        <TableRow key={form._id}>
                                            {/* Link on the name */}
                                            <TableCell className="font-medium">
                                                <a href={`/edit-form/${form._id}`} className="hover:underline text-primary">
                                                    {form.name || `Form ${form._id.slice(-4)}`} {/* Use name or fallback */}
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">
                                                {form.description || '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 {/* Delete Button within AlertDialog Trigger */}
                                                <AlertDialog open={deletingFormId === form._id} onOpenChange={(isOpen) => !isOpen && setDeletingFormId(null)}>
                                                    <AlertDialogTrigger asChild>
                                                         {/* Use a button with icon */}
                                                         <Button
                                                             variant="ghost"
                                                             size="icon"
                                                             aria-label={`Delete form "${form.name || `Form ${form._id.slice(-4)}`}"`} // Add aria-label for accessibility
                                                              // We don't call setDeletingFormId directly here anymore.
                                                              // The AlertDialogTrigger automatically handles setting the internal open state.
                                                              // However, we need the dialog content to know *which* form is being deleted.
                                                              // The `open` prop on AlertDialog itself handles this association.
                                                             // We pass the form's ID to AlertDialogContent via state `deletingFormId`.
                                                         >
                                                             <Trash2 className="h-4 w-4 text-destructive" />
                                                         </Button>
                                                    </AlertDialogTrigger>
                                                     {/* AlertDialogContent is only rendered when `open={true}` */}
                                                     {/* It accesses deletingFormId from the state */}
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently delete the form
                                                                    <span className="font-semibold"> "{forms.find(f => f._id === deletingFormId)?.name || `Form ${deletingFormId?.slice(-4) || '...'}`}" </span> {/* Display name in dialog */}
                                                                    and all associated questions and responses.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel onClick={() => setDeletingFormId(null)} disabled={isDeleting}>Cancel</AlertDialogCancel> {/* Reset state on cancel, disable if deleting */}
                                                                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}> {/* Disable button while deleting */}
                                                                     {isDeleting ? ( // <-- Use the new state variable
                                                                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    ) : null}
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    // Empty state message with better styling
                    <div className="text-center p-6 border rounded-md bg-muted/20">
                        <p className="text-muted-foreground">You don't have any forms yet. Create your first one!</p>
                    </div>
                )}


            </Authenticated>
        </div>
    );
}