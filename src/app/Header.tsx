"use client";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { Authenticated, Unauthenticated } from "convex/react";

export default function Header() {
  const rainbowColors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']; //added yellow
  const word = 'Understand';
  const rainbowWord = word.split('').map((letter, i) => (
    <span key={i} style={{ color: rainbowColors[i % rainbowColors.length] }}>{letter}</span>
  ));

  return (
    <header className="border-b-2 border-blue-500 flex justify-between items-center py-2 px-4 sm:px-6 lg:px-8">
      <h1 className="ml-2 text-lg sm:text-xl lg:text-2xl font-semibold">
        <a href="/dashboard" className="hover:text-blue-700 transition-colors duration-200">
          {rainbowWord}
        </a>
      </h1>
      <div className="inline-flex items-center space-x-2">
        <Unauthenticated>
          <SignInButton />
        </Unauthenticated>
        <Authenticated>
          <UserButton afterSignOutUrl="/"/>
        </Authenticated>
      </div>
    </header>
  );
}