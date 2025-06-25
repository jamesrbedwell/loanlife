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
	extraPayment: number = 0
) {
	const monthlyRate = annualRate / 12;
	const numberOfPayments = years * 12;
	const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
	const schedule = [];

	let remainingPrincipal = principal;
	let totalInterest = 0;
	let totalPrincipal = 0;
	let payoffMonth = 0;

	for (let month = 1; month <= numberOfPayments; month++) {
		const payment = monthlyPayment + extraPayment;
		const interestPayment = remainingPrincipal * monthlyRate;
		let principalPayment = payment - interestPayment;

		// Prevent overpaying in the last month
		if (principalPayment > remainingPrincipal) {
			principalPayment = remainingPrincipal;
		}

		remainingPrincipal -= principalPayment;
		totalInterest += interestPayment;
		totalPrincipal += principalPayment;

		schedule.push({
			month,
			payment: principalPayment + interestPayment,
			principalPayment,
			interestPayment,
			remainingPrincipal: Math.max(remainingPrincipal, 0),
			totalInterest,
			totalPrincipal,
		});

		if (remainingPrincipal <= 0 && payoffMonth === 0) {
			payoffMonth = month;
			break;
		}
	}

	return {
		schedule,
		totalInterest,
		totalPrincipal,
		totalPayment: totalInterest + principal,
		payoffMonth: payoffMonth || numberOfPayments,
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
