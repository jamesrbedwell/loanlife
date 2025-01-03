import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function calculateMonthlyPayment(
	principal: number,
	annualRate: number,
	years: number,
): number {
	const monthlyRate = annualRate / 12;
	const numberOfPayments = years * 12;

	const monthlyPayment =
		(principal * monthlyRate * (1 + monthlyRate) ** numberOfPayments) /
		((1 + monthlyRate) ** numberOfPayments - 1);

	return monthlyPayment;
}

export function calculateAmortizationSchedule(
	principal: number,
	annualRate: number,
	years: number,
) {
	const monthlyRate = annualRate / 12;
	const numberOfPayments = years * 12;
	const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
	const schedule = [];

	let remainingPrincipal = principal;
	let totalInterest = 0;
	let totalPrincipal = 0;

	for (let month = 1; month <= numberOfPayments; month++) {
		const interestPayment = remainingPrincipal * monthlyRate;
		const principalPayment = monthlyPayment - interestPayment;

		remainingPrincipal -= principalPayment;
		totalInterest += interestPayment;
		totalPrincipal += principalPayment;

		schedule.push({
			month,
			payment: monthlyPayment,
			principalPayment,
			interestPayment,
			remainingPrincipal,
			totalInterest,
			totalPrincipal,
		});
	}

	return {
		schedule,
		totalInterest,
		totalPrincipal,
		totalPayment: totalInterest + principal,
	};
}

export const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat("en-AU", {
		style: "currency",
		currency: "AUD",
	}).format(amount);
};

export const formatPercentage = (value: number): string => {
	return `${value.toFixed(2)}%`;
};
