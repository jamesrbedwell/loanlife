"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { calculateAmortizationSchedule, formatCurrency } from "@/lib/utils";
import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

interface Month {
  month: number;
  payment: number;
  principalPayment: number;
  interestPayment: number;
  remainingPrincipal: number;
  totalInterest: number;
  totalPrincipal: number;
}
interface ResultsData {
  monthlyPayment: number;
  totalInterest: number;
  totalPrincipal: number;
  totalPayments: number;
  schedule: Month[];
}

function ResultsSuspense() {
  const searchParams = useSearchParams();
  const [appreciationRate, setAppreciationRate] = useState(2);

  const results = useMemo<ResultsData | null>(() => {
    const propertyPrice = Number(searchParams.get("propertyPrice"));
    const deposit = Number(searchParams.get("deposit"));
    const interestRate = Number(searchParams.get("interestRate")) / 100;
    const loanTerm = Number(searchParams.get("loanTerm"));

    if (
      Number.isNaN(propertyPrice) ||
      Number.isNaN(deposit) ||
      Number.isNaN(interestRate) ||
      Number.isNaN(loanTerm)
    ) {
      return null;
    }

    const principal = propertyPrice - deposit;
    const result = calculateAmortizationSchedule(
      principal,
      interestRate,
      loanTerm
    );

    return {
      monthlyPayment: result.schedule[0].payment,
      totalInterest: result.totalInterest,
      totalPrincipal: result.totalPrincipal,
      totalPayments: result.totalInterest + result.totalPrincipal,
      schedule: result.schedule,
    };
  }, [searchParams]);

  const principalExceedsInterestMonth = useMemo(() => {
    if (!results) return null;
    return (
      results.schedule.findIndex(
        (month: Month) => month.principalPayment > month.interestPayment
      ) + 1
    );
  }, [results]);

  const propertyProjections = useMemo(() => {
    if (!results) return null;
    const propertyPrice = Number(searchParams.get("propertyPrice"));
    const deposit = Number(searchParams.get("deposit"));
    const loanTerm = Number(searchParams.get("loanTerm"));
    const requiredValue = propertyPrice + results.totalInterest;
    const annualAppreciationRate = appreciationRate / 100;
    const projectedValue =
      propertyPrice * (1 + annualAppreciationRate) ** loanTerm;
    const potentialEquityAtEndOfLoan =
      projectedValue - (propertyPrice - deposit);
    const equityGrowth = potentialEquityAtEndOfLoan - deposit;
    const averageEquityGrowthPerYear = equityGrowth / loanTerm;
    return {
      initialValue: propertyPrice,
      requiredValue,
      projectedValue,
      appreciationRate,
      potentialEquityAtEndOfLoan,
      deposit,
      equityGrowth,
      averageEquityGrowthPerYear,
      loanTerm,
    };
  }, [results, searchParams, appreciationRate]);

  if (!results || !propertyProjections) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 md:p-8 lg:p-12 flex items-center justify-center">
        <p>Invalid input parameters. Please try again.</p>
      </main>
    );
  }

  const formatPrincipalExceedsInterestTime = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`;
    }
    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? "s" : ""}`;
    }
    return `${years} year${
      years !== 1 ? "s" : ""
    } and ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 md:p-8 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Loan Results</h1>
        </header>

        {/* Results Card */}
        <Card className="bg-primary text-primary-foreground overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-primary-foreground/80 text-sm mb-2">
                  Loan Summary
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>Property Price:</p>
                  <p className="text-right">
                    {formatCurrency(Number(searchParams.get("propertyPrice")))}
                  </p>
                  <p>Deposit:</p>
                  <p className="text-right">
                    {formatCurrency(Number(searchParams.get("deposit")))}
                  </p>
                  <p>Loan Amount:</p>
                  <p className="text-right">
                    {formatCurrency(results.totalPrincipal)}
                  </p>
                  <p>Loan Term:</p>
                  <p className="text-right">
                    {searchParams.get("loanTerm")} years
                  </p>
                  <p>Interest Rate:</p>
                  <p className="text-right">
                    {searchParams.get("interestRate")}%
                  </p>
                </div>
              </div>
              <div className="text-center flex flex-col justify-center">
                <p className="text-primary-foreground/80 text-sm mb-2">
                  Estimated Monthly Repayment
                </p>
                <p className="text-4xl md:text-5xl font-semibold tracking-tight">
                  {formatCurrency(results.monthlyPayment)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card className="bg-secondary/10 border-secondary/20 overflow-hidden">
          <CardHeader className="p-6 md:p-8">
            <CardTitle className="text-xl">Loan Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p className="text-muted-foreground">Total Payments:</p>
              <p className="text-right font-semibold">
                {formatCurrency(results.totalPayments)}
              </p>
              <p className="text-muted-foreground">Principal:</p>
              <p className="text-right font-semibold">
                {formatCurrency(results.totalPrincipal)}
              </p>
              <p className="text-muted-foreground">Interest:</p>
              <p className="text-right font-semibold">
                {formatCurrency(results.totalInterest)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Principal vs Interest Milestone */}
        <Card className="bg-primary/10 border-primary/20 overflow-hidden">
          <CardHeader className="p-6 md:p-8">
            <CardTitle className="text-xl">Repayment Milestone</CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <p className="text-sm">
              You start paying more towards principal than interest in{" "}
              <span className="text-primary font-semibold">
                {principalExceedsInterestMonth
                  ? formatPrincipalExceedsInterestTime(
                      principalExceedsInterestMonth
                    )
                  : null}
              </span>
              .
            </p>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="p-6 md:p-8">
            <CardTitle className="text-xl flex items-center justify-between">
              Amortization Schedule
              <Link
                href={`/amortization?${searchParams.toString()}`}
                className="text-sm font-normal text-primary hover:underline"
              >
                What is this?
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={results.schedule}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--muted))"
                  />
                  <XAxis
                    dataKey="month"
                    label={{
                      value: "Month",
                      position: "insideBottom",
                      offset: -5,
                    }}
                    tickFormatter={(value) => `Month ${value}`}
                  />
                  <YAxis
                    label={{
                      value: "Amount ($)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrency(Number(value)),
                      name,
                    ]}
                    labelFormatter={(label) => `Month ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="principalPayment"
                    name="Principal"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="interestPayment"
                    name="Interest"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Property Value Projections */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-secondary/10 border-secondary/20 overflow-hidden">
            <CardHeader className="p-6 md:p-8">
              <CardTitle className="text-xl">
                Current Property Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Current Property Value
                </p>
                <p className="text-lg font-semibold">
                  {formatCurrency(propertyProjections.initialValue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Break-Even Property Value
                </p>
                <p className="text-lg font-semibold">
                  {formatCurrency(propertyProjections.requiredValue)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/10 border-primary/20 overflow-hidden">
            <CardHeader className="p-6 md:p-8">
              <CardTitle className="text-xl">
                Future Property Projections
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-4">
              <div>
                <Label htmlFor="appreciationRate" className="text-sm">
                  Estimated Annual Appreciation Rate (%)
                </Label>
                <p className="text-xs text-muted-foreground mt-1 mb-2">
                  Adjust this value to see how different appreciation rates
                  affect your property&apos;s future value.
                </p>
                <Input
                  id="appreciationRate"
                  type="number"
                  value={appreciationRate}
                  onChange={(e) => setAppreciationRate(Number(e.target.value))}
                  className="mt-1"
                  step="0.1"
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Projected Value at End of Loan
                </p>
                <p className="text-lg font-semibold">
                  {formatCurrency(propertyProjections.projectedValue)}
                </p>
              </div>
              <div>
                <p
                  className={`text-sm ${
                    propertyProjections.projectedValue >=
                    propertyProjections.requiredValue
                      ? "text-primary"
                      : "text-destructive"
                  }`}
                >
                  {propertyProjections.projectedValue >=
                  propertyProjections.requiredValue
                    ? "Your property value is projected to exceed the loan cost."
                    : "Your property value is projected to fall short of the loan cost."}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Potential Equity at Loan End
                </p>
                <p className="text-lg font-semibold">
                  {formatCurrency(
                    propertyProjections.potentialEquityAtEndOfLoan
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Equity Growth
                </p>
                <p className="text-lg font-semibold">
                  {formatCurrency(propertyProjections.equityGrowth)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Average Annual Equity Growth
                </p>
                <p className="text-lg font-semibold">
                  {formatCurrency(
                    propertyProjections.averageEquityGrowthPerYear
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back to Calculator Button */}
        <Button asChild className="w-full" size="lg">
          <Link href="/">Back to Calculator</Link>
        </Button>
      </div>
    </main>
  );
}
export default function Results() {
  return (
    <Suspense>
      <ResultsSuspense />
    </Suspense>
  );
}
