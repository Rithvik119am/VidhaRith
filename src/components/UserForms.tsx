"use client";

import React, { useState } from 'react';
import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from '../../convex/_generated/dataModel';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'; 
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

import { PlusCircle, Trash2, Loader2 } from 'lucide-react';

import { useRouter } from 'next/navigation';

import { toast } from "sonner";


export default function UserForms() {
  const router = useRouter();

  const createForm = useMutation(api.forms.create);
  const deleteForm = useMutation(api.forms.deleteForm);

  const forms = useQuery(api.forms.getUserForms, {});

  const [isCreating, setIsCreating] = useState(false);
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
         setIsCreating(false); 
    }
  };

  const handleTriggerDeleteClick = (formId: Id<"forms">) => {
     setDeletingFormId(formId);
  }


  const confirmDelete = async () => {
      if (!deletingFormId) {
          return; 
      }

      setIsDeleting(true);

      try {
          await deleteForm({ formId: deletingFormId });
          toast.success("Form deleted successfully!");
      } catch (e: any) {
          console.error("Failed to delete form:", e);
          toast.error(`Failed to delete form: ${e.data || e.message || e.toString()}`);
      } finally {
          setDeletingFormId(null);
          setIsDeleting(false);
      }
  };



    if (forms === undefined) {
        return (
             <div className="container mx-auto py-8 space-y-6">
                <h2 className="text-2xl font-bold">Your Forms</h2>
                 <div className="space-y-4"> 
                     <div className="border rounded-md p-4 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
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
                 <Skeleton className="h-10 w-32 mt-4" /> 
            </div>
        );
    }
 
    return (
        <div className="container mx-auto py-8 space-y-6">
            <Unauthenticated>
                <div className="text-center text-lg text-muted-foreground">Please sign in to view and manage your forms.</div>
            </Unauthenticated>
            <Authenticated>
                <div className="flex justify-between items-center mb-6"> 
                    <h2 className="text-2xl font-bold">Your Forms</h2>
                    
                     <Button onClick={handleCreateClick} disabled={isCreating}>
                         {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                         {isCreating ? "Creating..." : "New Form"}
                     </Button>
                </div>


                {forms && forms.length > 0 ? (
                    <div className="space-y-4">
                        {forms.map((form) => (
                            <Card key={form._id}>
                                <CardContent className="p-4"> 
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1 pr-4"> 
                                            <a href={`edit-form/${form._id}`} className="block text-lg font-semibold text-primary hover:underline mb-1">
                                                {form.name || `Form ${form._id.slice(-4)}`}
                                            </a>
                                            <p className="text-muted-foreground text-sm line-clamp-2">
                                                {form.description || '-'}
                                            </p>
                                        </div>

                                        <div className="flex-shrink-0 ">
                                             <AlertDialog
                                                open={deletingFormId === form._id}
                                                onOpenChange={(isOpen) => !isOpen && setDeletingFormId(null)}
                                             >
                                                <AlertDialogTrigger asChild>
                                                     <Button
                                                         variant="ghost"
                                                         size="icon" 
                                                         aria-label={`Delete form "${form.name || `Form ${form._id.slice(-4)}`}"`}
                                                         onClick={() => handleTriggerDeleteClick(form._id)}
                                                     >
                                                         <Trash2 className="h-4 w-4 text-destructive" />
                                                     </Button>
                                                </AlertDialogTrigger>
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
                    <div className="text-center p-6 border rounded-md bg-muted/20">
                        <p className="text-muted-foreground">You don&quot;t have any forms yet. Create your first one!</p>
                    </div>
                )}


            </Authenticated>
        </div>
    );
}