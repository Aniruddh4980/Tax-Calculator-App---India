/**
 * India Salaried Tax Calculator Engine (FY 2025-26)
 */

const SLABS_NEW = [
  { limit: 400000, rate: 0 },
  { limit: 800000, rate: 0.05 },
  { limit: 1200000, rate: 0.10 },
  { limit: 1600000, rate: 0.15 },
  { limit: 2000000, rate: 0.20 },
  { limit: 2400000, rate: 0.25 },
  { limit: Infinity, rate: 0.30 }
];

const SLABS_OLD_UNDER_60 = [
  { limit: 250000, rate: 0 },
  { limit: 500000, rate: 0.05 },
  { limit: 1000000, rate: 0.20 },
  { limit: Infinity, rate: 0.30 }
];

const SLABS_OLD_SENIOR = [
  { limit: 300000, rate: 0 },
  { limit: 500000, rate: 0.05 },
  { limit: 1000000, rate: 0.20 },
  { limit: Infinity, rate: 0.30 }
];

const SLABS_OLD_SUPER_SENIOR = [
  { limit: 500000, rate: 0 },
  { limit: 1000000, rate: 0.20 },
  { limit: Infinity, rate: 0.30 }
];

export function reconstructSalary(formData) {
  const months = formData.monthsCount || 12;
  const monthlyInHand = formData.monthlyInHand || 0;
  
  const monthlyPF = formData.deductPF === 'yes' ? (formData.pfMonthlyAmount || 0) : 0;
  const monthlyNPS = formData.deductNPS === 'yes' ? (formData.npsMonthlyAmount || 0) : 0;
  const monthlyPT = formData.deductPT === 'yes' ? (formData.ptMonthlyAmount || 0) : 0;
  
  const reconstructedMonthlyGross = monthlyInHand + monthlyPF + monthlyNPS + monthlyPT;
  const annualGross = (reconstructedMonthlyGross * months) + (formData.bonusAnnual || 0);
  
  // Estimate Basic Salary as 40% of Reconstructed Gross
  const annualBasicSalary = (reconstructedMonthlyGross * months) * 0.40;
  
  return {
    annualGross,
    annualBasicSalary,
    monthlyGross: reconstructedMonthlyGross,
    monthlyPF,
    monthlyNPS,
    monthlyPT
  };
}

export function getStandardDeduction(annualGross, regime) {
  if (regime === 'new') {
    return Math.min(75000, annualGross);
  } else {
    return Math.min(50000, annualGross);
  }
}

function calculateSlabTax(taxableIncome, slabs) {
  let tax = 0;
  let prevLimit = 0;
  const breakdown = [];

  for (let i = 0; i < slabs.length; i++) {
    const { limit, rate } = slabs[i];
    const currentLimit = Math.min(limit, taxableIncome);
    
    if (currentLimit > prevLimit) {
      const taxableInSlab = currentLimit - prevLimit;
      const slabTax = taxableInSlab * rate;
      tax += slabTax;
      
      breakdown.push({
        range: `${prevLimit === 0 ? '0' : prevLimit.toLocaleString('en-IN')} - ${limit === Infinity ? 'Above' : limit.toLocaleString('en-IN')}`,
        taxableInSlab,
        rate: rate * 100,
        slabTax
      });
    }
    
    if (taxableIncome <= limit) {
      break;
    }
    prevLimit = limit;
  }

  return { tax, breakdown };
}

export function calculateHRAExemption(formData, salaryData) {
  if (formData.hasHRA !== 'yes' || formData.paysRent !== 'yes') {
    return 0;
  }
  
  const actualHraReceived = (formData.hraMonthlyAmount || 0) * (formData.monthsCount || 12);
  const totalRentPaid = (formData.rentPaidMonthly || 0) * (formData.monthsCount || 12);
  const rentMinusTenPercentBasic = Math.max(0, totalRentPaid - (0.10 * salaryData.annualBasicSalary));
  
  const pctOfBasic = formData.cityType === 'metro' ? 0.50 : 0.40;
  const basicSalaryCap = salaryData.annualBasicSalary * pctOfBasic;
  
  return Math.min(actualHraReceived, rentMinusTenPercentBasic, basicSalaryCap);
}

export function calculateHomeLoanDeduction(formData) {
  if (formData.hasHomeLoan !== 'yes') return 0;
  const maxLimit = formData.homeLoanType === 'repair' ? 30000 : 200000;
  return Math.min(formData.homeLoanInterest || 0, maxLimit);
}

/**
 * Section 80GG fallback for rent paid when no HRA is received
 */
export function calculate80GGExemption(formData, adjustedGross, basicDeductionsTotal) {
  if (formData.paysRent !== 'yes' || formData.hasHRA === 'yes') {
    return 0;
  }
  
  const totalRentPaid = (formData.rentPaidMonthly || 0) * (formData.monthsCount || 12);
  const adjustedTotalIncome = Math.max(0, adjustedGross - basicDeductionsTotal);
  
  // Section 80GG rules: minimum of:
  // 1. ₹5,000 per month (₹60,000 per year)
  // 2. 25% of Adjusted Total Income
  // 3. Rent paid minus 10% of Adjusted Total Income
  const condition1 = 60000;
  const condition2 = adjustedTotalIncome * 0.25;
  const condition3 = Math.max(0, totalRentPaid - (adjustedTotalIncome * 0.10));
  
  return Math.min(condition1, condition2, condition3);
}

/**
 * Full Tax Calculation Engine comparing Old vs New Regimes
 */
export function calculateTax(formData) {
  const salaryData = reconstructSalary(formData);
  const salaryGross = salaryData.annualGross;
  
  const otherIncome = (formData.savingsInterestAnnual || 0) + (formData.fdInterestAnnual || 0);
  const totalGrossIncome = salaryGross + otherIncome;
  
  // ================= OLD REGIME =================
  const stdDeductionOld = getStandardDeduction(salaryGross, 'old');
  const professionalTax = formData.deductPT === 'yes' ? (formData.ptMonthlyAmount || 0) * (formData.monthsCount || 12) : 0;
  const hraExemption = calculateHRAExemption(formData, salaryData);
  
  // 80C
  const epfContribution = salaryData.monthlyPF * (formData.monthsCount || 12);
  const total80CEntered = epfContribution + (formData.savings80C || 0);
  const allowed80C = Math.min(150000, total80CEntered);
  
  // 80D
  const allowed80D = Math.min(25000, formData.healthInsuranceSelf || 0) + Math.min(50000, formData.healthInsuranceParents || 0);
  
  // NPS 80CCD(1B)
  const allowed80CCD1B = Math.min(50000, formData.npsOwnContribution || 0);
  
  // Home Loan 24(b)
  const homeLoanDeduction = calculateHomeLoanDeduction(formData);
  
  // NPS 80CCD(2)
  const employerNpsAnnual = (formData.employerNpsMonthlyAmount || 0) * (formData.monthsCount || 12);
  const allowedEmployerNpsOld = Math.min(salaryData.annualBasicSalary * 0.10, employerNpsAnnual);
  
  // Interest Deductions (80TTA / 80TTB)
  let allowedTTAorTTB = 0;
  let ttaOrTtbLabel = '80TTA (Savings Interest)';
  if (formData.ageGroup === 'senior' || formData.ageGroup === 'superSenior') {
    // 80TTB: senior citizens up to 50k on savings + FD interest
    allowedTTAorTTB = Math.min(50000, otherIncome);
    ttaOrTtbLabel = '80TTB (Savings & FD Interest)';
  } else {
    // 80TTA: non-seniors up to 10k on savings interest only
    allowedTTAorTTB = Math.min(10000, formData.savingsInterestAnnual || 0);
  }
  
  // 80GG Fallback Rent Exemption (if no HRA)
  const basicDeductionsSoFar = stdDeductionOld + professionalTax + allowed80C + allowed80D + allowed80CCD1B + homeLoanDeduction + allowedEmployerNpsOld + allowedTTAorTTB;
  const allowed80GG = calculate80GGExemption(formData, totalGrossIncome, basicDeductionsSoFar);
  
  const totalDeductionsOld = basicDeductionsSoFar + allowed80GG;
  const taxableIncomeOld = Math.max(0, totalGrossIncome - totalDeductionsOld);
  
  // Calculate slabs tax for Old
  let slabsOld = SLABS_OLD_UNDER_60;
  if (formData.ageGroup === 'senior') {
    slabsOld = SLABS_OLD_SENIOR;
  } else if (formData.ageGroup === 'superSenior') {
    slabsOld = SLABS_OLD_SUPER_SENIOR;
  }
  const oldSlabsResult = calculateSlabTax(taxableIncomeOld, slabsOld);
  
  let rebateOld = 0;
  if (taxableIncomeOld <= 500000) {
    rebateOld = Math.min(oldSlabsResult.tax, 12500);
  }
  
  const taxAfterRebateOld = Math.max(0, oldSlabsResult.tax - rebateOld);
  const cessOld = taxAfterRebateOld * 0.04;
  const finalTaxOld = taxAfterRebateOld + cessOld;
  
  // ================= NEW REGIME =================
  const stdDeductionNew = getStandardDeduction(salaryGross, 'new');
  const allowedEmployerNpsNew = Math.min(salaryData.annualBasicSalary * 0.14, employerNpsAnnual);
  
  const totalDeductionsNew = stdDeductionNew + allowedEmployerNpsNew;
  const taxableIncomeNew = Math.max(0, totalGrossIncome - totalDeductionsNew);
  
  const newSlabsResult = calculateSlabTax(taxableIncomeNew, SLABS_NEW);
  
  let rebateNew = 0;
  let marginalReliefNew = 0;
  
  if (taxableIncomeNew <= 1200000) {
    rebateNew = Math.min(newSlabsResult.tax, 60000);
  } else if (taxableIncomeNew > 1200000) {
    const excessIncome = taxableIncomeNew - 1200000;
    if (newSlabsResult.tax > excessIncome) {
      marginalReliefNew = newSlabsResult.tax - excessIncome;
      rebateNew = marginalReliefNew;
    }
  }
  
  const taxAfterRebateNew = Math.max(0, newSlabsResult.tax - rebateNew);
  const cessNew = taxAfterRebateNew * 0.04;
  const finalTaxNew = taxAfterRebateNew + cessNew;
  
  const winner = finalTaxOld < finalTaxNew ? 'old' : 'new';
  const savings = Math.abs(finalTaxOld - finalTaxNew);
  
  // ================= REASONING BULLETS =================
  const reasons = [];
  if (winner === 'old') {
    if (hraExemption > 0) reasons.push("Your HRA tax exemption is high, providing substantial relief under the Old Regime.");
    if (allowed80GG > 0) reasons.push("Section 80GG rent deduction provides key savings as you don't receive HRA.");
    if (allowed80C >= 100000) reasons.push("Your Section 80C investments (like PF, PPF, ELSS) are significant.");
    if (homeLoanDeduction > 0) reasons.push("Your home loan interest deduction under Section 24(b) reduces your taxable income in the Old Regime.");
    if (allowed80D > 0) reasons.push("Your health insurance premiums (Section 80D) help drive tax savings in the Old Regime.");
    if (allowedTTAorTTB > 0) reasons.push("Savings and FD interest exemptions (80TTA/80TTB) lower your tax in the Old Regime.");
  } else {
    reasons.push("The New Regime slabs have significantly lower tax rates.");
    reasons.push("Your total declarations & deductions do not add up to exceed the threshold where the Old Regime becomes cheaper.");
    if (employerNpsAnnual > 0) reasons.push("Your employer's NPS contribution under 80CCD(2) works in your favor in the New Regime as well (up to 14% basic).");
  }
  
  // Suggestions
  const suggestions = [];
  if (allowed80C < 150000) {
    suggestions.push(`You have ₹${(150000 - allowed80C).toLocaleString('en-IN')} unused room in Section 80C. Investing in PPF, ELSS, or Tax-Saver FDs could make the Old Regime more beneficial.`);
  }
  if (formData.employerNPS === 'no') {
    suggestions.push("Check if your employer offers NPS corporate contribution. Section 80CCD(2) is deductible under both regimes and can save extra tax.");
  }
  if (formData.paysRent === 'yes' && formData.hasHRA === 'no' && allowed80GG === 0) {
    suggestions.push("Since you pay rent but do not receive HRA, you could claim Section 80GG fallback in the Old Regime.");
  }

  return {
    salaryData,
    otherIncome,
    totalGrossIncome,
    old: {
      gross: totalGrossIncome,
      stdDeduction: stdDeductionOld,
      professionalTax,
      hraExemption,
      deduction80C: allowed80C,
      deduction80D: allowed80D,
      deduction80CCD1B: allowed80CCD1B,
      homeLoanDeduction,
      employerNps: allowedEmployerNpsOld,
      deductionTTAorTTB: allowedTTAorTTB,
      ttaOrTtbLabel,
      deduction80GG: allowed80GG,
      totalDeductions: totalDeductionsOld,
      taxableIncome: taxableIncomeOld,
      baseTax: oldSlabsResult.tax,
      rebate: rebateOld,
      cess: cessOld,
      finalTax: finalTaxOld,
      breakdown: oldSlabsResult.breakdown
    },
    new: {
      gross: totalGrossIncome,
      stdDeduction: stdDeductionNew,
      professionalTax: 0,
      hraExemption: 0,
      deduction80C: 0,
      deduction80D: 0,
      deduction80CCD1B: 0,
      homeLoanDeduction: 0,
      employerNps: allowedEmployerNpsNew,
      deductionTTAorTTB: 0,
      ttaOrTtbLabel: '',
      deduction80GG: 0,
      totalDeductions: totalDeductionsNew,
      taxableIncome: taxableIncomeNew,
      baseTax: newSlabsResult.tax,
      rebate: rebateNew,
      cess: cessNew,
      finalTax: finalTaxNew,
      breakdown: newSlabsResult.breakdown
    },
    winner,
    savings,
    reasons,
    suggestions
  };
}
