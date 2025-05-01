// --- START OF FILE page.tsx ---

"use client";
import { Authenticated, Unauthenticated } from 'convex/react';
import { Id } from '../../../../convex/_generated/dataModel';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import the component sections
import FormDetails from "./FormDetails";
import FormQuestions from "./FormQuestions";
import FormResponses from './FormResponses';

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
          <TabsList className="grid w-full grid-cols-2 md:w-[400px] mx-auto mb-6"> {/* Style the tab list */}
            <TabsTrigger value="details_questions">Settings & Questions</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
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
        </Tabs>
      </Authenticated>
    </div>
  );
}