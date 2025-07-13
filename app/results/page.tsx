"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChevronDown } from "lucide-react";
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const [sellAfterYears, setSellAfterYears] = useState("10");
  const [isAdditionalCostsOpen, setIsAdditionalCostsOpen] = useState(false);


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
    const potentialEquityAtEndOfLoan = projectedValue;
    const equityGrowth = potentialEquityAtEndOfLoan - deposit;
    const averageEquityGrowthPerYear = equityGrowth / loanTerm;

    // Early sale calculations
    const sellAfterYearsNum = Number(sellAfterYears) || 0;
    const earlySaleValue = propertyPrice * (1 + annualAppreciationRate) ** sellAfterYearsNum;

    // Calculate remaining loan balance at early sale point
    const earlySaleMonth = sellAfterYearsNum * 12;
    const earlySaleSchedule = results.schedule[earlySaleMonth - 1];
    const remainingLoanBalance = earlySaleSchedule ? earlySaleSchedule.remainingPrincipal : 0;
    const earlySaleEquity = earlySaleValue - remainingLoanBalance;

    // Calculate total amount repaid up to early sale point
    const totalRepaidUpToSale = earlySaleSchedule ?
      (earlySaleSchedule.totalPrincipal + earlySaleSchedule.totalInterest) : 0;
    const interestPaidUpToSale = earlySaleSchedule ? earlySaleSchedule.totalInterest : 0;
    const principalPaidUpToSale = earlySaleSchedule ? earlySaleSchedule.totalPrincipal : 0;
    const totalInvestmentAndCosts = deposit + principalPaidUpToSale + interestPaidUpToSale;
    const netProfitLoss = earlySaleEquity - interestPaidUpToSale - deposit;

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
      sellAfterYears: sellAfterYearsNum,
      earlySaleValue,
      earlySaleEquity,
      remainingLoanBalance,
      totalRepaidUpToSale,
      interestPaidUpToSale,
      principalPaidUpToSale,
      totalInvestmentAndCosts,
      netProfitLoss,
    };
  }, [results, searchParams, appreciationRate, sellAfterYears]);

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

  const handleSellAfterYearsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setSellAfterYears(value);
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
        <Tabs defaultValue="breakdown-amortization" className="w-full">
          <TabsList className="mb-4 w-full grid grid-cols-1 md:grid-cols-2">
            <TabsTrigger value="breakdown-amortization">Breakdown & Amortization</TabsTrigger>
            <TabsTrigger value="projections">Property Projections</TabsTrigger>
          </TabsList>
          <TabsContent value="breakdown-amortization">
            {/* Loan Cost Breakdown */}
            <Card className="bg-secondary/10 border-secondary/20 overflow-hidden mb-4">
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  <span className="text-2xl">💸</span>
                  Loan Cost Breakdown
                </CardTitle>
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
                <CardTitle className="text-xl flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  Repayment Milestone
                </CardTitle>
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
            {/* Chart */}
            <Card className="overflow-hidden mb-4">
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="text-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    Amortization Schedule
                  </div>
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
            {/* Yearly Principal vs Interest Table */}
            <Card className="mb-4">
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  Yearly Principal vs Interest
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left font-semibold">Year</TableHead>
                        <TableHead className="text-right font-semibold">Principal Paid</TableHead>
                        <TableHead className="text-right font-semibold">Interest Paid</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const years = Math.ceil(results.schedule.length / 12);
                        const rows = [];
                        for (let y = 1; y <= years; y++) {
                          const yearMonths = results.schedule.slice((y - 1) * 12, y * 12);
                          const principal = yearMonths.reduce((sum, m) => sum + m.principalPayment, 0);
                          const interest = yearMonths.reduce((sum, m) => sum + m.interestPayment, 0);
                          rows.push(
                            <TableRow key={y}>
                              <TableCell className="text-left">{y}</TableCell>
                              <TableCell className="text-right">{formatCurrency(principal)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(interest)}</TableCell>
                            </TableRow>
                          );
                        }
                        return rows;
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            {/* Overpayment Analysis Table */}
            <Card className="bg-primary/10 border-primary/20 overflow-hidden mb-4">
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="text-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🚀</span>
                    Overpayment Analysis
                  </div>
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
            <div className="grid gap-6">
              {/* Current Property Overview */}
              <Card className="bg-secondary/10 border-secondary/20 overflow-hidden">
                <CardHeader className="px-4 md:px-6">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span className="text-2xl">🏠</span>
                    Current Property Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-background/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">
                          Current Property Value
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(propertyProjections.initialValue)}
                        </p>
                      </div>
                      <div className="bg-background/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">
                          Break-Even Property Value
                        </p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(propertyProjections.requiredValue)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Value needed to cover total loan cost
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Future Projections */}
              <Card className="bg-primary/10 border-primary/20 overflow-hidden">
                <CardHeader className="px-4 md:px-6">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span className="text-2xl">📈</span>
                    Future Property Projections
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6 space-y-6">
                  {/* Appreciation Rate Input */}
                  <div className="bg-background/50 rounded-lg p-4">
                    <Label htmlFor="appreciationRate" className="text-sm font-medium">
                      Estimated Annual Appreciation Rate
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="appreciationRate"
                        type="text"
                        value={appreciationRate}
                        onChange={handleAppreciationRateChange}
                        className="flex-1"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                        placeholder="2.0"
                      />
                      <span className="text-sm text-muted-foreground">% per year</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Adjust this value to see how different appreciation rates affect your property's future value
                    </p>
                  </div>

                  {/* Projection Results */}
                  <div className="grid gap-4">
                    <div className="bg-background/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">
                        Projected Value at End of Loan
                      </p>
                      <p className={`text-2xl font-bold ${propertyProjections.projectedValue >= propertyProjections.requiredValue
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                        }`}>
                        {formatCurrency(propertyProjections.projectedValue)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        After {propertyProjections.loanTerm} years at {propertyProjections.appreciationRate}% annual growth
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="bg-background/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Investment Outlook</h4>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${propertyProjections.projectedValue >= propertyProjections.requiredValue
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                        <span>
                          {propertyProjections.projectedValue >= propertyProjections.requiredValue ? '✅' : '❌'}
                        </span>
                        {propertyProjections.projectedValue >= propertyProjections.requiredValue
                          ? 'Profitable'
                          : 'Loss-making'
                        }
                      </div>
                    </div>
                    <p className={`text-sm ${propertyProjections.projectedValue >= propertyProjections.requiredValue
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                      }`}>
                      {propertyProjections.projectedValue >= propertyProjections.requiredValue
                        ? `Your property is projected to be worth ${formatCurrency(propertyProjections.projectedValue - propertyProjections.requiredValue)} more than the total loan cost.`
                        : `Your property is projected to be worth ${formatCurrency(propertyProjections.requiredValue - propertyProjections.projectedValue)} less than the total loan cost.`
                      }
                    </p>
                  </div>

                  {/* Equity Growth Summary */}
                  {/* <div className="bg-background/50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Equity Growth Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Total Equity Growth
                        </p>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(propertyProjections.equityGrowth)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          From your initial deposit of {formatCurrency(propertyProjections.deposit)} to full ownership worth {formatCurrency(propertyProjections.potentialEquityAtEndOfLoan)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Average Annual Growth
                        </p>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(propertyProjections.averageEquityGrowthPerYear)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Per year over {propertyProjections.loanTerm} years
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        <strong>Note:</strong> This calculation accounts for your initial deposit of {formatCurrency(propertyProjections.deposit)} as your starting equity.
                        The equity growth shows how your investment grows from deposit to full property ownership.
                      </p>
                    </div>
                  </div> */}
                </CardContent>
              </Card>

              {/* Early Sale Scenario */}
              <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 overflow-hidden">
                <CardHeader className="px-4 md:px-6">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span className="text-2xl">🤝</span>
                    Early Sale Scenario
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6 space-y-6">
                  <div className="bg-background/50 rounded-lg p-4">
                    <Label htmlFor="sellAfterYears" className="text-sm font-medium">
                      Sell After (Years)
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="sellAfterYears"
                        type="text"
                        value={sellAfterYears}
                        onChange={handleSellAfterYearsChange}
                        className="flex-1"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="10"
                      />
                      <span className="text-sm text-muted-foreground">years</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      See your equity if you sell before the end of your mortgage term
                    </p>
                  </div>

                  {/* Rearranged metrics in a single column */}
                  <div className="flex flex-col gap-4">
                    {/* Property Value at Sale */}
                    <div className="bg-background/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Property Value at Sale</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(propertyProjections.earlySaleValue)}</p>
                      <p className="text-xs text-muted-foreground mt-1">After {propertyProjections.sellAfterYears} years at {propertyProjections.appreciationRate}% growth</p>
                    </div>
                    {/* Initial Loan Amount */}
                    <div className="bg-background/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Initial Loan Amount</p>
                      <p className="text-xl font-bold">{formatCurrency(propertyProjections.initialValue - propertyProjections.deposit)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Property price minus deposit</p>
                    </div>
                    {/* Principal Paid */}
                    <div className="bg-background/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Principal Paid</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(propertyProjections.principalPaidUpToSale)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Amount of loan principal repaid</p>
                    </div>
                    {/* Remaining Loan Balance */}
                    <div className="bg-background/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Remaining Loan Balance</p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(propertyProjections.remainingLoanBalance)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Amount still owed on the mortgage</p>
                    </div>
                    {/* Sale Proceeds */}
                    <div className="bg-background/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Sale Proceeds</p>
                      <p className="text-xl font-bold text-green-700 dark:text-green-300">{formatCurrency(propertyProjections.earlySaleValue - propertyProjections.remainingLoanBalance)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Property value at sale minus remaining loan balance</p>
                    </div>
                    {/* Interest Paid */}
                    <div className="bg-background/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Interest Paid</p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(propertyProjections.interestPaidUpToSale)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total interest costs over {propertyProjections.sellAfterYears} years</p>
                    </div>
                    {/* Net Profit/Loss with Additional Costs Alert */}
                    <div className="bg-background/50 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        {/* Net Profit/Loss Section */}
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">Net Profit/Loss</p>
                          <p className={`text-2xl font-bold ${propertyProjections.netProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(propertyProjections.netProfitLoss)}</p>
                          <p className="text-xs text-muted-foreground mt-1">Sale proceeds minus total interest paid</p>
                          <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${propertyProjections.netProfitLoss >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                            <span>{propertyProjections.netProfitLoss >= 0 ? '✅' : '❌'}</span>
                            {propertyProjections.netProfitLoss >= 0 ? 'Profitable' : 'Loss-making'}
                          </div>
                        </div>

                        {/* Additional Costs Alert */}
                        <div className="flex-1">
                          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
                            <AlertTitle className="text-orange-800 dark:text-orange-200">⚠️ Additional Costs Not Included</AlertTitle>
                            <AlertDescription className="text-orange-700 dark:text-orange-300">
                              <p className="mb-2">This profit/loss calculation doesn't include common Australian property transaction costs.</p>

                              <Collapsible open={isAdditionalCostsOpen} onOpenChange={setIsAdditionalCostsOpen}>
                                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-orange-800 dark:text-orange-200 hover:text-orange-900 dark:hover:text-orange-100 transition-colors">
                                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isAdditionalCostsOpen ? 'rotate-180' : ''}`} />
                                  View additional costs
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-3">
                                  <ul className="space-y-1 text-sm">
                                    <li>• <strong>Stamp Duty:</strong> State-based transfer duty (typically 1-5% of property value)</li>
                                    <li>• <strong>Legal Fees:</strong> Conveyancing and solicitor costs ($800-$2,500)</li>
                                    <li>• <strong>Building & Pest Inspections:</strong> ($300-$600)</li>
                                    <li>• <strong>Lenders Mortgage Insurance (LMI):</strong> If deposit is less than 20%</li>
                                    <li>• <strong>Loan Application Fees:</strong> ($200-$800)</li>
                                    <li>• <strong>Valuation Fees:</strong> ($200-$600)</li>
                                    <li>• <strong>Moving Costs:</strong> Removalists, cleaning, etc.</li>
                                    <li>• <strong>Council Rates & Utilities:</strong> Transfer fees and connections</li>
                                    <li>• <strong>Real Estate Agent Commission:</strong> When selling (typically 1.5-3%)</li>
                                  </ul>
                                  <p className="mt-2 text-xs">
                                    These costs can significantly impact your actual profit or loss. Consider consulting with a financial advisor or conveyancer for accurate cost estimates.
                                  </p>
                                </CollapsibleContent>
                              </Collapsible>
                            </AlertDescription>
                          </Alert>
                        </div>
                      </div>
                    </div>
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
