"use client";

import React, { useState } from "react";
import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle,
  Trash2,
  Loader2,
  FileText,
  Calendar,
  Users,
  ExternalLink,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";

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
  };

  const confirmDelete = async () => {
    if (!deletingFormId) return;

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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Loading state
  if (forms === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-12 w-36 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4"
            >
              <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Unauthenticated>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-quiz-primary to-quiz-secondary flex items-center justify-center">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view your forms</h2>
          <p className="text-gray-500">Please sign in to create and manage your quizzes.</p>
        </motion.div>
      </Unauthenticated>

      <Authenticated>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Your Forms</h1>
            <p className="text-gray-500 mt-1">
              {forms.length} {forms.length === 1 ? "form" : "forms"} created
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(110, 89, 165, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateClick}
            disabled={isCreating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white font-semibold rounded-xl shadow-lg shadow-quiz-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isCreating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <PlusCircle className="w-5 h-5" />
            )}
            {isCreating ? "Creating..." : "New Form"}
          </motion.button>
        </motion.div>

        {/* Forms Grid */}
        {forms.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {forms.map((form, index) => (
                <motion.div
                  key={form._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(110, 89, 165, 0.1)" }}
                  className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all"
                >
                  {/* Gradient accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-quiz-primary to-quiz-secondary" />

                  <div className="p-6">
                    {/* Form title and actions */}
                    <div className="flex items-start justify-between mb-4">
                      <a
                        href={`edit-form/${form._id}`}
                        className="flex-1 group/link"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 group-hover/link:text-quiz-primary transition-colors line-clamp-1">
                          {form.name || `Untitled Form`}
                        </h3>
                      </a>

                      <AlertDialog
                        open={deletingFormId === form._id}
                        onOpenChange={(isOpen) => !isOpen && setDeletingFormId(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleTriggerDeleteClick(form._id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this form?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete{" "}
                              <span className="font-semibold text-gray-900">
                                &ldquo;{forms.find((f) => f._id === deletingFormId)?.name || "Untitled Form"}&rdquo;
                              </span>{" "}
                              and all associated questions and responses. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => setDeletingFormId(null)}
                              disabled={isDeleting}
                              className="rounded-xl"
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={confirmDelete}
                              disabled={isDeleting}
                              className="bg-red-500 hover:bg-red-600 rounded-xl"
                            >
                              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {/* Description */}
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 min-h-[2.5rem]">
                      {form.description || "No description"}
                    </p>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(form._creationTime)}</span>
                      </div>
                    </div>

                    {/* Action button */}
                    <a href={`edit-form/${form._id}`}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className="flex items-center gap-2 text-quiz-primary font-medium text-sm"
                      >
                        <span>Edit form</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-quiz-light to-quiz-accent/30 flex items-center justify-center"
            >
              <Sparkles className="w-10 h-10 text-quiz-primary" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No forms yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Create your first quiz form and start collecting anonymous insights from your students.
            </p>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(110, 89, 165, 0.2)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateClick}
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white font-semibold rounded-xl shadow-lg shadow-quiz-primary/20 disabled:opacity-50 transition-all"
            >
              {isCreating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <PlusCircle className="w-5 h-5" />
              )}
              Create Your First Form
            </motion.button>
          </motion.div>
        )}
      </Authenticated>
    </div>
  );
}
