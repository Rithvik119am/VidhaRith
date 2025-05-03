"use client";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { useState } from "react";

export default function Header() {
  const rainbowColors = ['red', 'orange', 'green', 'blue', 'indigo', 'violet'];
  const word = 'Understand';
  const rainbowWord = word.split('').map((letter, i) => (
    <span key={i} style={{ color: rainbowColors[i % rainbowColors.length] }}>{letter}</span>
  ));

  return (
      <header className="border-b-2 border-blue flex justify-between items-center py-2 px-6">
        <h1 className="ml-2" ><a href="/dashboard" >{rainbowWord}</a></h1>
        <div className="inline-block mr-2">
          <Unauthenticated>
            <SignInButton/>
          </Unauthenticated>
          <Authenticated>
            <UserButton />
          </Authenticated>
        </div>
      </header>
    );
}
