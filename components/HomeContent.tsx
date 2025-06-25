"use client";

import { Label } from "@radix-ui/react-label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Logo } from "./Logo";
import { ArrowRight, Clock, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
interface SearchHistory {
  propertyPrice: number;
  deposit: number;
  interestRate: number;
  loanTerm: number;
  date: string;
}

export default function HomeContent() {
  const router = useRouter();
  const [propertyPrice, setPropertyPrice] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("propertyPrice") || "500000";
    }
    return "500000";
  });
  const [deposit, setDeposit] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("deposit") || "100000";
    }
    return "100000";
  });
  const [interestRate, setInterestRate] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("interestRate") || "3";
    }
    return "6";
  });
  const [loanTerm, setLoanTerm] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("loanTerm") || "30";
    }
    return "30";
  });
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  useEffect(() => {
    localStorage.setItem("propertyPrice", propertyPrice || "0");
    localStorage.setItem("deposit", deposit || "0");
    localStorage.setItem("interestRate", interestRate || "0");
    localStorage.setItem("loanTerm", loanTerm || "0");
  }, [propertyPrice, deposit, interestRate, loanTerm]);

  useEffect(() => {
    const storedHistory = localStorage.getItem("searchHistory");
    if (storedHistory) {
      setSearchHistory(JSON.parse(storedHistory));
    }
  }, []);

  const handleCalculate = () => {
    const newSearch: SearchHistory = {
      propertyPrice: Number(propertyPrice) || 0,
      deposit: Number(deposit) || 0,
      interestRate: Number(interestRate) || 0,
      loanTerm: Number(loanTerm) || 0,
      date: new Date().toISOString(),
    };

    const updatedHistory = [newSearch, ...searchHistory.slice(0, 4)];
    setSearchHistory(updatedHistory);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));

    navigateToResults(newSearch);
  };
  const navigateToResults = (search: SearchHistory) => {
    const queryParams = new URLSearchParams({
      propertyPrice: search.propertyPrice.toString(),
      deposit: search.deposit.toString(),
      interestRate: search.interestRate.toString(),
      loanTerm: search.loanTerm.toString(),
    }).toString();

    router.push(`/results?${queryParams}`);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 md:p-8 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Logo />
        </header>

        {/* Explainer Text */}
        <Card className="bg-primary/5 border-primary/10 overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              Welcome to LoanLife
            </h2>
            <p className="text-muted-foreground">
              LoanLife helps you understand the true cost of your mortgage. Use
              our calculator to estimate your monthly payments, total interest,
              and more. Start by entering your loan details below.
            </p>
          </CardContent>
        </Card>

        {/* Calculator Card */}
        <Card className="bg-primary text-primary-foreground overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label
                  htmlFor="propertyPrice"
                  className="text-primary-foreground/80"
                >
                  Property Price
                </Label>
                <Input
                  id="propertyPrice"
                  type="number"
                  value={propertyPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      setPropertyPrice(value);
                      localStorage.setItem("propertyPrice", value || "0");
                    }
                  }}
                  className="bg-white/10 border-0 text-primary-foreground mt-2"
                />
              </div>
              <div>
                <Label htmlFor="deposit" className="text-primary-foreground/80">
                  Deposit
                </Label>
                <Input
                  id="deposit"
                  type="number"
                  value={deposit}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      setDeposit(value);
                      localStorage.setItem("deposit", value || "0");
                    }
                  }}
                  className="bg-white/10 border-0 text-primary-foreground mt-2"
                />
              </div>
              <div>
                <Label
                  htmlFor="interestRate"
                  className="text-primary-foreground/80"
                >
                  Interest Rate (%)
                </Label>
                <Input
                  id="interestRate"
                  type="number"
                  value={interestRate}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d*$/.test(value)) {
                      setInterestRate(value);
                      localStorage.setItem("interestRate", value || "0");
                    }
                  }}
                  className="bg-white/10 border-0 text-primary-foreground mt-2"
                  step="0.1"
                />
              </div>
              <div>
                <Label
                  htmlFor="loanTerm"
                  className="text-primary-foreground/80"
                >
                  Loan Term (years)
                </Label>
                <Input
                  id="loanTerm"
                  type="number"
                  value={loanTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      setLoanTerm(value);
                      localStorage.setItem("loanTerm", value || "0");
                    }
                  }}
                  className="bg-white/10 border-0 text-primary-foreground mt-2"
                />
              </div>
            </div>
            <Button
              onClick={handleCalculate}
              className="w-full bg-white text-primary hover:bg-white/90 transition-colors duration-200"
              size="lg"
            >
              Calculate LoanLife
            </Button>
          </CardContent>
        </Card>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <Card className="bg-secondary/50 border-secondary overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-6 md:p-8">
              <CardTitle className="text-xl font-semibold">
                Search History
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-muted-foreground hover:text-destructive transition-colors duration-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear History
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {searchHistory.map((search: SearchHistory, index: number) => (
                <Card
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  key={index}
                  className="group hover:bg-secondary/80 transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
                  onClick={() => navigateToResults(search)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {formatCurrency(search.propertyPrice)} Property
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(search.deposit)} deposit,{" "}
                          {search.loanTerm} years at {search.interestRate}%
                          interest
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    <div className="flex items-center mt-2">
                      <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(search.date).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-secondary/50 border-secondary overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/amortization" className="block">
              <Card className="group hover:bg-secondary/80 transition-all duration-200 transform hover:scale-[1.02]">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">What is Amortization?</p>
                    <p className="text-sm text-muted-foreground">
                      Understand loan repayment
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </CardContent>
              </Card>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
