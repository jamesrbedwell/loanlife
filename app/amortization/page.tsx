"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function AmortizationPage() {
  const router = useRouter();

  return (
    <main className="max-w-md mx-auto min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-medium">What is Amortization?</h1>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Understanding Amortization
          </h2>
          <p className="mb-4">
            Amortization is the process of spreading out a loan into a series of
            fixed payments over time. Each payment goes toward both the
            loan&apos;s principal and interest, with the exact split between
            them changing over time.
          </p>
          <p className="mb-4">
            In the early stages of a loan, a larger portion of each payment goes
            towards interest. As time goes on, more of each payment goes towards
            the principal. This process continues until the loan is fully paid
            off at the end of its term.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Key Points</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              The total payment amount typically stays the same throughout the
              loan term.
            </li>
            <li>
              In the beginning, you&apos;re paying more interest and less
              principal.
            </li>
            <li>
              Towards the end, you&apos;re paying more principal and less
              interest.
            </li>
            <li>
              Amortization schedules help you understand how much of your
              payment goes to principal vs. interest over time.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            The Amortization Schedule
          </h2>
          <p className="mb-4">
            An amortization schedule is a complete table of periodic loan
            payments, showing the amount of principal and interest that comprise
            each payment until the loan is paid off at the end of its term.
          </p>
          <p className="mb-4">
            This schedule is particularly useful because it helps you:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Understand how much of each payment goes towards the principal vs.
              interest
            </li>
            <li>See how the loan balance decreases over time</li>
            <li>
              Identify when you&apos;ll have paid off certain percentages of
              your loan
            </li>
            <li>
              Evaluate the potential impact of making extra payments or
              refinancing
            </li>
            <li>Plan your long-term financial strategy more effectively</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Why It Matters</h2>
          <p className="mb-4">
            Understanding amortization is crucial for several reasons:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>It helps you see the true cost of your loan over time.</li>
            <li>
              You can make informed decisions about loan terms and early
              payments.
            </li>
            <li>
              It allows you to compare different loan options more effectively.
            </li>
            <li>You can better plan your long-term financial strategy.</li>
          </ul>
        </CardContent>
      </Card>

      <Button onClick={() => router.back()} className="w-full mt-8">
        Go Back
      </Button>
    </main>
  );
}
