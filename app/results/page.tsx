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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

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
  const [appreciationRate, setAppreciationRate] = useState("2");
  const [extraPayment, setExtraPayment] = useState("0");
  const [showOverpayment, setShowOverpayment] = useState(true);
  const [spiralInitialPrice, setSpiralInitialPrice] = useState("0");
  const [spiralDepositPct, setSpiralDepositPct] = useState("0");
  const [spiralYearsBetween, setSpiralYearsBetween] = useState("0");
  const [spiralLoanCarryPct, setSpiralLoanCarryPct] = useState("0");
  const [spiralPropIncreasePct, setSpiralPropIncreasePct] = useState("0");
  const [spiralNumMoves, setSpiralNumMoves] = useState("0");

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
    const annualAppreciationRate = (Number(appreciationRate) || 0) / 100;
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
      appreciationRate: Number(appreciationRate) || 0,
      potentialEquityAtEndOfLoan,
      deposit,
      equityGrowth,
      averageEquityGrowthPerYear,
      loanTerm,
    };
  }, [results, searchParams, appreciationRate]);

  // Overpayment scenario
  const overpayResults = useMemo(() => {
    if (!results) return null;
    const propertyPrice = Number(searchParams.get("propertyPrice"));
    const deposit = Number(searchParams.get("deposit"));
    const interestRate = Number(searchParams.get("interestRate")) / 100;
    const loanTerm = Number(searchParams.get("loanTerm"));
    const principal = propertyPrice - deposit;
    const extra = Number(extraPayment) || 0;
    if (extra <= 0) return null;
    const result = calculateAmortizationSchedule(
      principal,
      interestRate,
      loanTerm,
      extra
    );

    return {
      monthlyPayment: results.monthlyPayment + extra,
      totalInterest: result.totalInterest,
      totalPrincipal: result.totalPrincipal,
      totalPayments: result.totalInterest + result.totalPrincipal,
      schedule: result.schedule,
      payoffMonth: result.payoffMonth,
    };
  }, [results, searchParams, extraPayment]);

  if (!results || !propertyProjections) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-2 md:p-4 lg:p-6 flex items-center justify-center">
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
    return `${years} year${years !== 1 ? "s" : ""
      } and ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`;
  };

  // Overpayment comparison helpers
  const payoffTime = (months: number) => {
    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    if (years === 0) return `${remMonths} month${remMonths !== 1 ? "s" : ""}`;
    if (remMonths === 0) return `${years} year${years !== 1 ? "s" : ""}`;
    return `${years} year${years !== 1 ? "s" : ""} and ${remMonths} month${remMonths !== 1 ? "s" : ""}`;
  };

  // Replace the extraPayment input handler
  const handleExtraPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setExtraPayment(value);
    }
  };

  const handleAppreciationRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setAppreciationRate(value);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-2 md:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Loan Results</h1>
        </header>
        {/* Always-visible summary card */}
        <Card className="bg-primary text-primary-foreground overflow-hidden mb-4">
          <CardContent className="p-4 md:p-6">
            <div className="grid md:grid-cols-2 gap-4">
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
                    {searchParams.get("loanTerm")}
                    {" "}years
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
        {/* Tabs below summary */}
        <Tabs defaultValue="breakdown" className="w-full">
          <TabsList className="mb-4 w-full grid grid-cols-3">
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="amortization">Amortization & Overpayment</TabsTrigger>
            <TabsTrigger value="projections">Property Projections</TabsTrigger>
            {/* <TabsTrigger value="spiral">Moving Home Simulator</TabsTrigger> */}
          </TabsList>
          <TabsContent value="breakdown">
            {/* Loan Cost Breakdown */}
            <Card className="bg-secondary/10 border-secondary/20 overflow-hidden mb-4">
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="text-xl">Loan Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
                <div className="grid grid-cols-2 gap-2 text-sm">
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
            <Card className="bg-primary/10 border-primary/20 overflow-hidden mb-4">
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="text-xl">Repayment Milestone</CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
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
          </TabsContent>
          <TabsContent value="amortization">
            {/* Chart */}
            <Card className="overflow-hidden mb-4">
              <CardHeader className="px-4 md:px-6">
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
              <CardContent className="px-4 md:px-6">
                <div className="h-[350px]">
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
                      {/* <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--muted))"
                      /> */}
                      <XAxis
                        dataKey="month"
                        label={{
                          value: "Month",
                          position: "insideBottom",
                          offset: -5,
                        }}
                        domain={[1, results.schedule.length]}
                        type="number"
                        allowDuplicatedCategory={false}
                        tickFormatter={(value) => (value % 12 === 0 ? `Year ${value / 12}` : '')}
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
                        strokeWidth={3}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="interestPayment"
                        name="Interest"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={3}
                        dot={false}
                      />
                      {showOverpayment && overpayResults && (
                        <>
                          <Line
                            type="monotone"
                            dataKey={(entry) => {
                              const overpayEntry = overpayResults.schedule.find(item => item.month === entry.month);
                              return overpayEntry ? overpayEntry.principalPayment : null;
                            }}
                            name="Principal (Overpay)"
                            stroke="hsl(var(--primary))"
                            strokeDasharray="6 6"
                            strokeWidth={3}
                            strokeOpacity={0.7}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey={(entry) => {
                              const overpayEntry = overpayResults.schedule.find(item => item.month === entry.month);
                              return overpayEntry ? overpayEntry.interestPayment : null;
                            }}
                            name="Interest (Overpay)"
                            stroke="hsl(var(--destructive))"
                            strokeDasharray="6 6"
                            strokeWidth={3}
                            strokeOpacity={0.7}
                            dot={false}
                          />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {showOverpayment && extraPayment && <p className="text-xs text-muted-foreground mt-2 mb-4 text-center max-w-2xl mx-auto">
                  <strong>Note:</strong> The final overpayment may be less than previous months, resulting in a vertical drop. This is because the last payment only covers the remaining balance.
                </p>}
              </CardContent>
            </Card>
            {/* Overpayment Analysis Table */}
            <Card className="bg-primary/10 border-primary/20 overflow-hidden mb-4">
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="text-xl flex items-center justify-between">
                  Overpayment Analysis
                  <div className="flex items-center gap-2">
                    <Label htmlFor="showOverpayment" className="text-xs">Show on chart</Label>
                    <Checkbox
                      id="showOverpayment"
                      checked={showOverpayment}
                      onCheckedChange={checked => setShowOverpayment(!!checked)}
                      className="w-4 h-4"
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6 space-y-2">
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <Label htmlFor="extraPayment" className="text-sm">
                      Extra Monthly Payment ($)
                    </Label>
                    <Input
                      id="extraPayment"
                      type="text"
                      min={0}
                      value={extraPayment}
                      onChange={handleExtraPaymentChange}
                      className="mt-1"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      See how paying extra each month affects your loan.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-left font-semibold">Metric</TableHead>
                          <TableHead className="text-center font-semibold">Current</TableHead>
                          <TableHead className={`text-center font-semibold ${!overpayResults ? 'text-muted-foreground' : ''}`}>Overpayment</TableHead>
                          <TableHead className={`text-center font-semibold ${!overpayResults ? 'text-muted-foreground' : ''}`}>Difference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Monthly Payment</TableCell>
                          <TableCell className="text-center">{formatCurrency(results.monthlyPayment)}</TableCell>
                          <TableCell className={`text-center ${!overpayResults ? 'text-muted-foreground' : ''}`}>{overpayResults ? formatCurrency(overpayResults.monthlyPayment) : '-'}</TableCell>
                          <TableCell className={`text-center ${!overpayResults ? 'text-muted-foreground' : ''}`}>{overpayResults ? formatCurrency(overpayResults.monthlyPayment - results.monthlyPayment) : '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Loan Paid Off In</TableCell>
                          <TableCell className="text-center">{payoffTime(results.schedule.length)}</TableCell>
                          <TableCell className={`text-center ${!overpayResults ? 'text-muted-foreground' : ''}`}>{overpayResults ? payoffTime(overpayResults.payoffMonth) : '-'}</TableCell>
                          <TableCell className={`text-center ${!overpayResults ? 'text-muted-foreground' : ''}`}>{overpayResults ? payoffTime(results.schedule.length - overpayResults.payoffMonth) : '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Repayment Milestone</TableCell>
                          <TableCell className="text-center">{principalExceedsInterestMonth ? formatPrincipalExceedsInterestTime(principalExceedsInterestMonth) : '-'}</TableCell>
                          <TableCell className={`text-center ${!overpayResults ? 'text-muted-foreground' : ''}`}>
                            {overpayResults ? (() => {
                              const overpayMilestone = overpayResults.schedule.findIndex(
                                (month: Month) => month.principalPayment > month.interestPayment
                              ) + 1;
                              return overpayMilestone > 0 ? formatPrincipalExceedsInterestTime(overpayMilestone) : '-';
                            })() : '-'}
                          </TableCell>
                          <TableCell className={`text-center ${!overpayResults ? 'text-muted-foreground' : ''}`}>
                            {overpayResults ? (() => {
                              const overpayMilestone = overpayResults.schedule.findIndex(
                                (month: Month) => month.principalPayment > month.interestPayment
                              ) + 1;
                              if (overpayMilestone > 0 && principalExceedsInterestMonth) {
                                const diff = principalExceedsInterestMonth - overpayMilestone;
                                return diff > 0 ? `${formatPrincipalExceedsInterestTime(diff)} earlier` :
                                  diff < 0 ? `${formatPrincipalExceedsInterestTime(Math.abs(diff))} later` : 'Same';
                              }
                              return '-';
                            })() : '-'}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Total Interest</TableCell>
                          <TableCell className="text-center">{formatCurrency(results.totalInterest)}</TableCell>
                          <TableCell className={`text-center ${!overpayResults ? 'text-muted-foreground' : ''}`}>{overpayResults ? formatCurrency(overpayResults.totalInterest) : '-'}</TableCell>
                          <TableCell className={`text-center ${!overpayResults ? 'text-muted-foreground' : ''}`}>{overpayResults ? formatCurrency(results.totalInterest - overpayResults.totalInterest) : '-'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="projections">
            {/* Property Value Projections */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-secondary/10 border-secondary/20 overflow-hidden">
                <CardHeader className="px-4 md:px-6">
                  <CardTitle className="text-xl">
                    Current Property Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6 space-y-2">
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
                <CardHeader className="px-4 md:px-6">
                  <CardTitle className="text-xl">
                    Future Property Projections
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6 space-y-2">
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
                      type="text"
                      value={appreciationRate}
                      onChange={handleAppreciationRateChange}
                      className="mt-1"
                      inputMode="decimal"
                      pattern="[0-9.]*"
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
                      className={`text-sm ${propertyProjections.projectedValue >=
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
          </TabsContent>

        </Tabs>
        {/* Back to Calculator Button */}
        <Button asChild className="w-full mt-2" size="lg">
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
