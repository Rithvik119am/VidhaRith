// src/app/(dashboard)/forms/[id]/edit/FormDetails.tsx

"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from "../../../../../convex/_generated/dataModel";
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCopyToClipboard } from "react-use";
import { Copy, ExternalLink, Play, Square, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, { message: "Form name cannot be empty." }),
  description: z.string().optional().or(z.literal('')),
  slug: z.string()
    .min(5, { message: "Slug must be at least 5 characters long." })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Slug can only contain letters, numbers, hyphens, and underscores." })
    .transform(s => s.toLowerCase()),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  timeLimitMinutes: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .int({ message: "Must be a whole number" })
    .positive({ message: "Must be a positive number" })
    .optional()
    .or(z.literal('')),
}).refine(data => {
  if (data.startTime && data.endTime) {
    return data.endTime > data.startTime;
  }
  return true;
}, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

type FormSchemaValues = z.infer<typeof formSchema>;

export default function FormDetails({ id }: { id: string } ) {
  const formId = id as Id<"forms">;
  const formDetails = useQuery(api.forms.get, { formId });
  const updateForm = useMutation(api.forms.update);
  const toggleFormStatus = useMutation(api.forms.toggleStatus);
  const [, copyToClipboard] = useCopyToClipboard();

  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const form = useForm<FormSchemaValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      slug: '',
      startTime: undefined,
      endTime: undefined,
      timeLimitMinutes: '',
    },
    mode: "onChange",
  });

  const watchSlug = form.watch('slug');
  const watchStartTime = form.watch('startTime');

  useEffect(() => {
    if (formDetails) {
      form.reset({
        name: formDetails.name || '',
        description: formDetails.description || '',
        slug: formDetails.slug || '',
        startTime: formDetails.startTime ? new Date(Number(formDetails.startTime)) : undefined,
        endTime: formDetails.endTime ? new Date(Number(formDetails.endTime)) : undefined,
        timeLimitMinutes: formDetails.timeLimitMinutes ? Number(formDetails.timeLimitMinutes) : '',
      });
    }
  }, [formDetails, form]);

  const handleSubmit = async (values: FormSchemaValues) => {
    const { name, description, slug, startTime, endTime, timeLimitMinutes } = values;

    try {
        await updateForm({
            formId: formId,
            name,
            description: description || '',
            slug,
            startTime: startTime ? BigInt(startTime.getTime()) : undefined,
            endTime: endTime ? BigInt(endTime.getTime()) : undefined,
            timeLimitMinutes: timeLimitMinutes ? BigInt(Number(timeLimitMinutes)) : undefined,
         });
        toast.success('Form details updated successfully!');
        form.reset({}, { keepValues: true });
    } catch (e: any) {
        console.error("Failed to update form:", e);
        toast.error(`Failed to update form: ${e.data?.message || e.message || e.toString()}`);
    }
  };

  const handleToggleStatus = async () => {
      if (!formDetails) return;
      setIsTogglingStatus(true);
      try {
          const result = await toggleFormStatus({ formId });
          toast.success(`Form is now ${result.newStatus ? 'accepting' : 'not accepting'} responses.`);
      } catch (e: any) {
          console.error("Failed to toggle form status:", e);
          toast.error(`Failed to toggle status: ${e.data?.message || e.message || e.toString()}`);
      } finally {
          setIsTogglingStatus(false);
      }
  };

  const formUrl = watchSlug ? `${process.env.NEXT_PUBLIC_WEBSITE_URL}/f/${watchSlug}` : 'Loading...';

  const handleCopy = () => {
    if (!formUrl) return;
    copyToClipboard("http://"+formUrl);
    toast.info('Form URL copied to clipboard.');
  };

  const handleOpenForm = () => {
     if (formUrl) {
         window.open("http://"+formUrl, '_blank');
     }
  };

  const isLoading = formDetails === undefined;
  const currentStatus = formDetails?.acceptingResponses ?? false;
  const statusText = isLoading ? "Loading..." : (currentStatus ? "Accepting Responses" : "Not Accepting Responses");
  // Using standard semantic colors for status indicator
  const statusColor = isLoading ? "text-muted-foreground" : (currentStatus ? "text-green-600" : "text-red-600");

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Form Settings</h2>

      <div className="space-y-3 p-4 border rounded-md bg-muted/20">
         <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
             <Label htmlFor="formUrl">Publish this URL to collect responses:</Label>
              <div className="flex items-center space-x-2">
                 <span className={`text-sm font-medium ${statusColor}`}>
                   {statusText}
                 </span>
                 {!isLoading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleStatus}
                    disabled={isTogglingStatus}
                    title={currentStatus ? "Stop accepting responses" : "Start accepting responses"}
                  >
                    {isTogglingStatus ? "..." : (currentStatus ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />)}
                    <span className="ml-2">{currentStatus ? "Stop" : "Start"}</span>
                  </Button>
                 )}
              </div>
         </div>
        <div className="flex flex-wrap sm:flex-nowrap space-y-2 sm:space-y-0 sm:space-x-2">
          <Input
             id="formUrl"
             type="text"
             readOnly
             value={isLoading ? 'Loading...' : formUrl || 'Set a valid slug...'}
             className="flex-grow bg-white" // Keeping bg-white for input clarity
             placeholder="Form URL will appear here"
          />
          <div className="flex space-x-2">
              <Button type="button" onClick={handleCopy} disabled={!formUrl || isLoading}>
                  <Copy className="mr-2 h-4 w-4" /> Copy Link
              </Button>
              <Button type="button" variant="outline" onClick={handleOpenForm} disabled={!formUrl || isLoading}>
                  <ExternalLink className="mr-2 h-4 w-4" /> Open
              </Button>
          </div>
        </div>
         {!watchSlug && !isLoading && (
           // Using standard semantic color for validation message
           <p className="text-sm text-red-600 mt-1">Please set a valid slug (min 5 chars, no spaces) to generate the URL.</p>
         )}
         {!formUrl && watchSlug && !isLoading && (
            <p className="text-sm text-muted-foreground mt-1">Generating URL...</p>
         )}
      </div>

      <div className="rounded-md border p-4 md:p-6 space-y-4">
        <h3 className="text-lg font-semibold mb-4">Basic Info & Timing Rules</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="slug"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl><Input placeholder="e.g. feedback-survey-2023" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="My Awesome Form" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Description <span className="text-muted-foreground">(Optional)</span></FormLabel>
                  <FormControl><Input placeholder="A brief description of the form" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
               control={form.control}
               name="startTime"
               render={({ field }) => (
                 <FormItem className="flex flex-col">
                   <FormLabel>Start Accepting Responses At <span className="text-muted-foreground">(Optional)</span></FormLabel>
                    <Popover>
                     <PopoverTrigger asChild>
                       <FormControl>
                         <Button
                           variant={"outline"}
                           className={cn(
                             "w-[280px] justify-start text-left font-normal",
                             !field.value && "text-muted-foreground"
                           )}
                         >
                           <CalendarIcon className="mr-2 h-4 w-4" />
                           {field.value ? format(field.value, "PPP p") : <span>Pick start date & time</span>}
                         </Button>
                       </FormControl>
                     </PopoverTrigger>
                     <PopoverContent className="w-auto p-0" align="start">
                       <Calendar
                         mode="single"
                         selected={field.value}
                         onSelect={field.onChange}
                         disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                         initialFocus
                       />
                       <div className="p-3 border-t border-border">
                          <Label className="text-sm mb-1 block">Time (HH:mm)</Label>
                          <Input
                            type="time"
                            step="60"
                            value={field.value ? format(field.value, "HH:mm") : ""}
                            onChange={(e) => {
                                const time = e.target.value;
                                if (!time) return;
                                const [hours, minutes] = time.split(':').map(Number);
                                const currentDatePart = field.value ? new Date(field.value) : new Date();
                                currentDatePart.setHours(hours, minutes, 0, 0);
                                field.onChange(currentDatePart);
                            }}
                          />
                       </div>
                     </PopoverContent>
                   </Popover>
                   <FormDescription>
                     Form won&apos;t accept responses before this time (uses your browser&apos;s local timezone for selection). Cleared if left empty.
                   </FormDescription>
                   <FormMessage />
                 </FormItem>
               )}
             />

              <FormField
               control={form.control}
               name="endTime"
               render={({ field }) => (
                 <FormItem className="flex flex-col">
                   <FormLabel>Stop Accepting Responses At <span className="text-muted-foreground">(Optional)</span></FormLabel>
                    <Popover>
                     <PopoverTrigger asChild>
                       <FormControl>
                          <Button
                           variant={"outline"}
                           className={cn(
                             "w-[280px] justify-start text-left font-normal",
                             !field.value && "text-muted-foreground"
                           )}
                         >
                           <CalendarIcon className="mr-2 h-4 w-4" />
                           {field.value ? format(field.value, "PPP p") : <span>Pick end date & time</span>}
                         </Button>
                       </FormControl>
                     </PopoverTrigger>
                     <PopoverContent className="w-auto p-0" align="start">
                       <Calendar
                         mode="single"
                         selected={field.value}
                         onSelect={field.onChange}
                         disabled={(date) => {
                           const yesterday = new Date(new Date().setDate(new Date().getDate() - 1));
                           const startDate = watchStartTime ? new Date(watchStartTime) : null;
                           date.setHours(0,0,0,0);
                           yesterday.setHours(0,0,0,0);
                           if (startDate) startDate.setHours(0,0,0,0);

                           return date < yesterday || (!!startDate && date < startDate);
                         }}
                         initialFocus
                       />
                       <div className="p-3 border-t border-border">
                          <Label className="text-sm mb-1 block">Time (HH:mm)</Label>
                          <Input
                            type="time"
                            step="60"
                            value={field.value ? format(field.value, "HH:mm") : ""}
                            onChange={(e) => {
                               const time = e.target.value;
                                if (!time) return;
                               const [hours, minutes] = time.split(':').map(Number);
                               const currentDatePart = field.value ? new Date(field.value) : new Date();
                               currentDatePart.setHours(hours, minutes, 0, 0);
                               field.onChange(currentDatePart);
                            }}
                          />
                       </div>
                     </PopoverContent>
                   </Popover>
                   <FormDescription>
                     Form automatically stops after this time (local timezone). The manual &apos;Stop&apos; button overrides this.
                   </FormDescription>
                   <FormMessage />
                 </FormItem>
               )}
             />

             <FormField
              control={form.control}
              name="timeLimitMinutes"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Response Time Limit <span className="text-muted-foreground">(Optional, in Minutes)</span></FormLabel>
                  <FormControl>
                     <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g., 30"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                          field.onChange(e.target.value === '' ? '' : e.target.value);
                      }}
                     />
                  </FormControl>
                  <FormDescription>
                     Limit how long users have to complete the form once they open it. Leave blank for no time limit.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

            <Button
                type="submit"
                disabled={!form.formState.isDirty || !form.formState.isValid}
            >
              Save Changes
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}