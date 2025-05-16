"use client";
import { Authenticated, Unauthenticated } from 'convex/react';
import { Id } from '../../../../../convex/_generated/dataModel';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import FormDetails from "./FormDetails";
import FormQuestions from "./FormQuestions";
import FormResponses from './FormResponses';
import FormAnalysis from './FormAnalysis';

export default function Page({ params }: { params: { id: Id<"forms"> } }) {

  const formId = params.id;

  return (
    <div className="container mx-auto py-8">
      <Unauthenticated>
        <div className="text-center text-lg">Please sign in to manage forms.</div>
      </Unauthenticated>
      <Authenticated>
        <Tabs defaultValue="details_questions" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-auto mb-6 md:w-[500px]">
            <TabsTrigger value="details_questions">Form Settings</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="details_questions" className="space-y-8">
            <FormDetails id={formId} />
            <FormQuestions formId={formId} />
          </TabsContent>

          <TabsContent value="responses">
            <FormResponses formId={formId} />
          </TabsContent>

          <TabsContent value="analysis">
            <FormAnalysis formId={formId} />
          </TabsContent>

        </Tabs>
      </Authenticated>
    </div>
  );
}