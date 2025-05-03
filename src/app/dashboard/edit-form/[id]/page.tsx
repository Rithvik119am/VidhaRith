// --- START OF FILE page.tsx ---

"use client";
import { Authenticated, Unauthenticated } from 'convex/react';
import { Id } from '../../../../convex/_generated/dataModel';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import the component sections
import FormDetails from "./FormDetails";
import FormQuestions from "./FormQuestions";
import FormResponses from './FormResponses';
import FormAnalysis from './FormAnalysis'; // <-- Import the new component

export default function Page({ params }: { params: { id: Id<"forms"> } }) {

  const formId = params.id;

  return (
    <div className="container mx-auto py-8"> {/* Add container and padding */}
      <Unauthenticated>
        <div className="text-center text-lg">Please sign in to manage forms.</div>
      </Unauthenticated>
      <Authenticated>
        {/* Use Tabs component */}
        <Tabs defaultValue="details_questions" className="w-full"> {/* Set a default tab */}
          {/* --- Updated TabsList to include Analysis --- */}
          <TabsList className="grid w-full grid-cols-3 mx-auto mb-6 md:w-[500px]"> {/* Changed grid-cols-3 */}
            <TabsTrigger value="details_questions">Settings & Questions</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger> {/* <-- Added Analysis Trigger */}
          </TabsList>

          {/* Content for Details & Questions Tab */}
          <TabsContent value="details_questions" className="space-y-8"> {/* Add spacing between sections */}
            <FormDetails id={formId} />
            {/* No need for <hr> with spacing */}
            <FormQuestions formId={formId} />
          </TabsContent>

          {/* Content for Responses Tab */}
          <TabsContent value="responses">
            <FormResponses formId={formId} />
          </TabsContent>

          {/* --- Content for Analysis Tab --- */}
          <TabsContent value="analysis">
            <FormAnalysis formId={formId} /> {/* <-- Added Analysis Content */}
          </TabsContent>

        </Tabs>
      </Authenticated>
    </div>
  );
}
// --- END OF FILE page.tsx ---