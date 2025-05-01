// app/page.tsx
"use client";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { Authenticated, Unauthenticated } from "convex/react";

// Import the components
import UserForms from "@/components/UserForms"; // Adjust path if necessary
import UserFiles from "@/components/UserFiles"; // Import the new component
import { Separator } from "@/components/ui/separator"; // Optional: For visual separation

export default function Home() {

  return ( <>

    <Unauthenticated>
      <div className="grid place-content-center h-lvh text-2xl">Welcome to Informal. Sign in to start.</div>
    </Unauthenticated>

    <Authenticated>
        {/* Container to manage layout */}
        <div className="container mx-auto py-8 space-y-12"> {/* Add more vertical space */}

            {/* User Forms Section */}
            <UserForms />

            {/* Optional Separator */}
            <Separator />

             {/* User Files Section */}
             <UserFiles />

        </div>
    </Authenticated>
  </>);
}