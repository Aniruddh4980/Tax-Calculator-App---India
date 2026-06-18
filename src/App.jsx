import React, { useState, useEffect } from 'react';
import './App.css';
import { calculateTax } from './taxEngine';
import { generateTaxSummaryPDF } from './pdfEngine';

// Step specific FAQs
const STEP_FAQS = {
  1: [
    { q: "Why do you ask for my age group?", a: "The Old Tax Regime has different tax-free slabs for Senior Citizens (60-79) and Super Seniors (80+). We use this to correctly map your old slab rates." },
    { q: "What is the difference between Metro and Non-Metro?", a: "Metro cities (Delhi, Mumbai, Kolkata, Chennai) allow up to 50% of Basic Salary as HRA exemption, while other cities allow up to 40%." }
  ],
  2: [
    { q: "What if my monthly salary changes?", a: "Enter your current or average monthly bank credit. You can also specify an annual bonus or variable pay below." },
    { q: "Do I need to enter my CTC?", a: "No! Unlike other calculators, we start with what you actually see in your bank account, then reconstruct the gross salary automatically." }
  ],
  3: [
    { q: "Where can I find these deductions?", a: "Check your monthly payslip. Items like Provident Fund (PF) and Professional Tax (PT) are deducted directly by your employer." },
    { q: "What is Employer NPS contribution?", a: "Under Section 80CCD(2), your employer can contribute to your NPS account. This deduction is allowed in both the Old and New tax regimes." }
  ],
  4: [
    { q: "Can I claim rent if I live with parents?", a: "Yes, if you pay them rent and they declare it as rental income. Keep rent receipts and rent agreements ready." },
    { q: "What if I do not receive HRA but pay rent?", a: "We will automatically look for an optional fallback deduction called Section 80GG on your behalf." }
  ],
  5: [
    { q: "Is the loan deduction available in the New Regime?", a: "No. Deductions for interest paid on a home loan for a self-occupied property (Section 24b) are only allowed in the Old Regime." },
    { q: "What qualifies as buying/building vs repair?", a: "Buying or constructing a home allows up to ₹2,00,000 deduction. Repair or renovation loans are capped at ₹30,000." }
  ],
  6: [
    { q: "What is the 80C limit?", a: "Section 80C is capped at ₹1,50,000. It includes PF, PPF, ELSS, life insurance premiums, school fees, and home loan principal repayments." },
    { q: "Is health insurance deduction available in both regimes?", a: "No. Section 80D deductions for health insurance premiums (self or parents) are only allowed in the Old Regime." }
  ],
  7: [
    { q: "Can I edit these values later?", a: "Yes! You can click the 'Edit' link next to any section on this page to go directly back to that step and adjust your answers." }
  ]
};

// Initial state model
const DEFAULT_FORM_DATA = {
  // Profile
  ageGroup: 'below60',
  cityType: 'metro',
  isSalaried: 'yes',
  primaryIncomeSource: 'salary',
  
  // Salary
  monthlyInHand: 100000,
  monthsCount: 12,
  bonusAnnual: 0,
  
  // Freelance & Business
  freelanceIncome: 0,
  use44ADA: 'no',
  businessExpenses: 0,

  // Capital Gains
  equitySTCG: 0,
  equityLTCG: 0,
  otherSTCG: 0,
  otherLTCG: 0,
  
  // Deductions
  deductPF: 'no',
  pfMonthlyAmount: 0,
  deductNPS: 'no',
  npsMonthlyAmount: 0,
  deductPT: 'no',
  ptMonthlyAmount: 200,
  employerNPS: 'no',
  employerNpsMonthlyAmount: 0,
  hasHRA: 'no',
  hraMonthlyAmount: 0,
  
  // Housing
  paysRent: 'no',
  rentPaidMonthly: 0,
  hasHomeLoan: 'no',
  homeLoanSelfOccupied: 'yes',
  homeLoanType: 'buy',
  homeLoanInterest: 0,
  
  // Savings & Deductions
  savings80C: 0,
  healthInsuranceSelf: 0,
  healthInsuranceParents: 0,
  npsOwnContribution: 0,
  savingsInterestAnnual: 0,
  fdInterestAnnual: 0
};

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showSlabBreakdown, setShowSlabBreakdown] = useState(false);

  // Auto-load state from local storage
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('tax_calculator_form_data');
      return saved ? JSON.parse(saved) : DEFAULT_FORM_DATA;
    } catch (e) {
      return DEFAULT_FORM_DATA;
    }
  });

  // Load step from local storage
  useEffect(() => {
    try {
      const savedStep = localStorage.getItem('tax_calculator_current_step');
      if (savedStep) {
        setCurrentStep(parseInt(savedStep));
      }
    } catch (e) {}
  }, []);

  // Save to local storage when state changes
  useEffect(() => {
    try {
      localStorage.setItem('tax_calculator_form_data', JSON.stringify(formData));
    } catch (e) {}
  }, [formData]);

  useEffect(() => {
    try {
      localStorage.setItem('tax_calculator_current_step', currentStep.toString());
    } catch (e) {}
    
    setTimeout(() => {
      if (currentStep >= 1 && currentStep <= 8) {
        const stepBar = document.getElementById('step-bar-container');
        if (stepBar) {
          stepBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo(0, 0);
        }
      } else if (currentStep === 9) {
        const resultScreen = document.getElementById('result-screen-container');
        if (resultScreen) {
          resultScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo(0, 0);
        }
      } else {
        window.scrollTo(0, 0);
      }
    }, 10);
  }, [currentStep]);

  const updateField = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear all inputs and reset the calculator?")) {
      setFormData(DEFAULT_FORM_DATA);
      setCurrentStep(0);
    }
  };

  // Run calculation engine logic
  const taxResults = calculateTax(formData);
  const { salaryData, otherIncome, old: oldRegime, new: newRegime, winner, savings, reasons, suggestions } = taxResults;

  const winnerLabel = winner === 'old' ? 'Old Regime' : 'New Regime';

  // Confidence check
  let confidenceScore = 'High';
  if (formData.monthlyInHand === 0) {
    confidenceScore = 'Low';
  } else if (
    (formData.deductPF === 'yes' && formData.pfMonthlyAmount === 0) ||
    (formData.deductNPS === 'yes' && formData.npsMonthlyAmount === 0) ||
    (formData.paysRent === 'yes' && formData.rentPaidMonthly === 0) ||
    (formData.hasHRA === 'yes' && formData.hraMonthlyAmount === 0)
  ) {
    confidenceScore = 'Medium';
  }

  const handleNext = () => {
    if (currentStep < 9) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const jumpToStep = (stepNumber) => {
    setCurrentStep(stepNumber);
  };

  const renderProgressBar = () => {
    if (currentStep === 0 || currentStep === 9) return null;
    const progressPercent = ((currentStep - 1) / 7) * 100;
    return (
      <div className="progress-container" id="step-bar-container">
        <div className="progress-header">
          <span>STEP {currentStep} OF 8</span>
          <span>{Math.round(progressPercent)}% COMPLETED</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>
    );
  };

  const handleDownloadPDF = () => {
    generateTaxSummaryPDF(
      formData, 
      oldRegime, 
      newRegime, 
      winnerLabel, 
      savings, 
      reasons, 
      suggestions, 
      winner
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="wizard-step-title">Tell us about yourself</h2>
            <p className="wizard-step-subtitle">This helps us apply age and location specific tax rules.</p>
            <div className="question-group">
              <div>
                <span className="input-label">What is your age group?</span>
                <div className="radio-group">
                  <div 
                    className={`radio-card ${formData.ageGroup === 'below60' ? 'selected' : ''}`}
                    onClick={() => updateField('ageGroup', 'below60')}
                  >
                    Below 60 years
                  </div>
                  <div 
                    className={`radio-card ${formData.ageGroup === 'senior' ? 'selected' : ''}`}
                    onClick={() => updateField('ageGroup', 'senior')}
                  >
                    60 to 79 years
                  </div>
                  <div 
                    className={`radio-card ${formData.ageGroup === 'superSenior' ? 'selected' : ''}`}
                    onClick={() => updateField('ageGroup', 'superSenior')}
                  >
                    80+ years
                  </div>
                </div>
              </div>

              <div>
                <span className="input-label">Where do you live?</span>
                <div className="radio-group">
                  <div 
                    className={`radio-card ${formData.cityType === 'metro' ? 'selected' : ''}`}
                    onClick={() => updateField('cityType', 'metro')}
                  >
                    Metro City (Delhi, Mumbai, Kolkata, Chennai)
                  </div>
                  <div 
                    className={`radio-card ${formData.cityType === 'non-metro' ? 'selected' : ''}`}
                    onClick={() => updateField('cityType', 'non-metro')}
                  >
                    Other Cities
                  </div>
                </div>
              </div>

              <div>
                <span className="input-label">What is your primary source of income?</span>
                <div className="radio-group">
                  <div 
                    className={`radio-card ${formData.primaryIncomeSource === 'salary' ? 'selected' : ''}`}
                    onClick={() => updateField('primaryIncomeSource', 'salary')}
                  >
                    Salary
                  </div>
                  <div 
                    className={`radio-card ${formData.primaryIncomeSource === 'freelance' ? 'selected' : ''}`}
                    onClick={() => updateField('primaryIncomeSource', 'freelance')}
                  >
                    Freelance / Business
                  </div>
                  <div 
                    className={`radio-card ${formData.primaryIncomeSource === 'both' ? 'selected' : ''}`}
                    onClick={() => updateField('primaryIncomeSource', 'both')}
                  >
                    Both
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="wizard-step-title">Income that reaches you</h2>
            <p className="wizard-step-subtitle">Tell us what lands in your account.</p>
            <div className="question-group">
              {(formData.primaryIncomeSource === 'salary' || formData.primaryIncomeSource === 'both') && (
                <>
                  <div style={{ marginBottom: '1rem' }}><h3 style={{ fontSize: '1.1rem' }}>Salary Income</h3></div>
                  <div>
                    <label className="input-label" htmlFor="monthlyInHand">Average monthly take-home salary received</label>
                    <input 
                      type="number" 
                      id="monthlyInHand" 
                      className="input-field" 
                      value={formData.monthlyInHand}
                      onChange={(e) => updateField('monthlyInHand', Math.max(0, parseInt(e.target.value) || 0))}
                    />
                    <p className="helper-text">Include your net credit amount from your latest bank statements.</p>
                  </div>

                  <div>
                    <label className="input-label" htmlFor="monthsCount">Number of months employed in FY 2025–26</label>
                    <input 
                      type="number" 
                      id="monthsCount" 
                      className="input-field" 
                      value={formData.monthsCount}
                      onChange={(e) => updateField('monthsCount', Math.min(12, Math.max(1, parseInt(e.target.value) || 12)))}
                    />
                  </div>

                  <div>
                    <label className="input-label" htmlFor="bonusAnnual">Annual bonus or variable pay received (if any)</label>
                    <input 
                      type="number" 
                      id="bonusAnnual" 
                      className="input-field" 
                      value={formData.bonusAnnual}
                      onChange={(e) => updateField('bonusAnnual', Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </div>
                </>
              )}

              {(formData.primaryIncomeSource === 'freelance' || formData.primaryIncomeSource === 'both') && (
                <>
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Freelance / Business Income</h3>
                    <label className="input-label" htmlFor="freelanceIncome">Total Gross Freelance / Consulting Income (Annual)</label>
                    <input 
                      type="number" 
                      id="freelanceIncome" 
                      className="input-field" 
                      value={formData.freelanceIncome}
                      onChange={(e) => updateField('freelanceIncome', Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <span className="input-label">Do you want to use Section 44ADA (Presumptive Taxation)?</span>
                    <p className="helper-text" style={{ marginBottom: '0.5rem' }}>Allows a flat 50% deduction on gross receipts without maintaining detailed books.</p>
                    <div className="radio-group" style={{ marginBottom: formData.use44ADA === 'no' ? '0.5rem' : '1.25rem' }}>
                      <div 
                        className={`radio-card ${formData.use44ADA === 'yes' ? 'selected' : ''}`}
                        onClick={() => updateField('use44ADA', 'yes')}
                      >
                        Yes (50% Flat Deduction)
                      </div>
                      <div 
                        className={`radio-card ${formData.use44ADA === 'no' ? 'selected' : ''}`}
                        onClick={() => updateField('use44ADA', 'no')}
                      >
                        No (Enter Actual Expenses)
                      </div>
                    </div>
                  </div>
                  {formData.use44ADA === 'no' && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label className="input-label" htmlFor="businessExpenses">Total Annual Business Expenses</label>
                      <input 
                        type="number" 
                        id="businessExpenses" 
                        className="input-field" 
                        value={formData.businessExpenses}
                        onChange={(e) => updateField('businessExpenses', Math.max(0, parseInt(e.target.value) || 0))}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="wizard-step-title">What your payslip cuts out</h2>
            <p className="wizard-step-subtitle">Help us reconstruct your gross salary from recurring cuts.</p>
            <div className="question-group">
              <div>
                <span className="input-label">Does your company deduct Provident Fund (PF/EPF) from your pay?</span>
                <div className="radio-group" style={{ marginBottom: formData.deductPF === 'yes' ? '0.5rem' : '1.25rem' }}>
                  <div 
                    className={`radio-card ${formData.deductPF === 'yes' ? 'selected' : ''}`}
                    onClick={() => updateField('deductPF', 'yes')}
                  >
                    Yes
                  </div>
                  <div 
                    className={`radio-card ${formData.deductPF === 'no' ? 'selected' : ''}`}
                    onClick={() => updateField('deductPF', 'no')}
                  >
                    No / Not Sure
                  </div>
                </div>
                {formData.deductPF === 'yes' && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label className="input-label" htmlFor="pfMonthlyAmount">Monthly PF Contribution Amount (Employee share)</label>
                    <input 
                      type="number" 
                      id="pfMonthlyAmount" 
                      className="input-field" 
                      value={formData.pfMonthlyAmount}
                      placeholder="e.g. 1800"
                      onChange={(e) => updateField('pfMonthlyAmount', Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </div>
                )}
              </div>

              <div>
                <span className="input-label">Do you receive House Rent Allowance (HRA)?</span>
                <div className="radio-group" style={{ marginBottom: formData.hasHRA === 'yes' ? '0.5rem' : '1.25rem' }}>
                  <div 
                    className={`radio-card ${formData.hasHRA === 'yes' ? 'selected' : ''}`}
                    onClick={() => updateField('hasHRA', 'yes')}
                  >
                    Yes
                  </div>
                  <div 
                    className={`radio-card ${formData.hasHRA === 'no' ? 'selected' : ''}`}
                    onClick={() => updateField('hasHRA', 'no')}
                  >
                    No
                  </div>
                </div>
                {formData.hasHRA === 'yes' && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label className="input-label" htmlFor="hraMonthlyAmount">Monthly HRA component on payslip</label>
                    <input 
                      type="number" 
                      id="hraMonthlyAmount" 
                      className="input-field" 
                      value={formData.hraMonthlyAmount}
                      onChange={(e) => updateField('hraMonthlyAmount', Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </div>
                )}
              </div>

              <div>
                <span className="input-label">Does your company deduct Professional Tax (PT) from your pay?</span>
                <div className="radio-group" style={{ marginBottom: formData.deductPT === 'yes' ? '0.5rem' : '1.25rem' }}>
                  <div 
                    className={`radio-card ${formData.deductPT === 'yes' ? 'selected' : ''}`}
                    onClick={() => updateField('deductPT', 'yes')}
                  >
                    Yes
                  </div>
                  <div 
                    className={`radio-card ${formData.deductPT === 'no' ? 'selected' : ''}`}
                    onClick={() => updateField('deductPT', 'no')}
                  >
                    No
                  </div>
                </div>
                {formData.deductPT === 'yes' && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label className="input-label" htmlFor="ptMonthlyAmount">Monthly PT Amount</label>
                    <input 
                      type="number" 
                      id="ptMonthlyAmount" 
                      className="input-field" 
                      value={formData.ptMonthlyAmount}
                      onChange={(e) => updateField('ptMonthlyAmount', Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </div>
                )}
              </div>

              <div>
                <span className="input-label">Does your employer contribute to NPS on your behalf?</span>
                <div className="radio-group" style={{ marginBottom: formData.employerNPS === 'yes' ? '0.5rem' : '1.25rem' }}>
                  <div 
                    className={`radio-card ${formData.employerNPS === 'yes' ? 'selected' : ''}`}
                    onClick={() => updateField('employerNPS', 'yes')}
                  >
                    Yes
                  </div>
                  <div 
                    className={`radio-card ${formData.employerNPS === 'no' ? 'selected' : ''}`}
                    onClick={() => updateField('employerNPS', 'no')}
                  >
                    No
                  </div>
                </div>
                {formData.employerNPS === 'yes' && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label className="input-label" htmlFor="employerNpsMonthlyAmount">Monthly Employer NPS Contribution</label>
                    <input 
                      type="number" 
                      id="employerNpsMonthlyAmount" 
                      className="input-field" 
                      value={formData.employerNpsMonthlyAmount}
                      onChange={(e) => updateField('employerNpsMonthlyAmount', Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <h2 className="wizard-step-title">Rent details</h2>
            <p className="wizard-step-subtitle">Rent payments can significantly reduce your tax liability under the Old Regime.</p>
            <div className="question-group">
              <div>
                <span className="input-label">Do you pay rent for your accommodation?</span>
                <div className="radio-group">
                  <div 
                    className={`radio-card ${formData.paysRent === 'yes' ? 'selected' : ''}`}
                    onClick={() => updateField('paysRent', 'yes')}
                  >
                    Yes, I pay rent
                  </div>
                  <div 
                    className={`radio-card ${formData.paysRent === 'no' ? 'selected' : ''}`}
                    onClick={() => updateField('paysRent', 'no')}
                  >
                    No, I don't pay rent
                  </div>
                </div>
              </div>

              {formData.paysRent === 'yes' && (
                <div>
                  <label className="input-label" htmlFor="rentPaidMonthly">What is your monthly rent amount?</label>
                  <input 
                    type="number" 
                    id="rentPaidMonthly" 
                    className="input-field" 
                    value={formData.rentPaidMonthly}
                    onChange={(e) => updateField('rentPaidMonthly', Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
              )}
            </div>
          </div>
        );
      case 5:
        return (
          <div>
            <h2 className="wizard-step-title">Home loan interest</h2>
            <p className="wizard-step-subtitle">Interest on home loans is deductible under the Old Regime.</p>
            <div className="question-group">
              <div>
                <span className="input-label">Do you have a home loan for a property you own?</span>
                <div className="radio-group">
                  <div 
                    className={`radio-card ${formData.hasHomeLoan === 'yes' ? 'selected' : ''}`}
                    onClick={() => updateField('hasHomeLoan', 'yes')}
                  >
                    Yes, I have a home loan
                  </div>
                  <div 
                    className={`radio-card ${formData.hasHomeLoan === 'no' ? 'selected' : ''}`}
                    onClick={() => updateField('hasHomeLoan', 'no')}
                  >
                    No home loan
                  </div>
                </div>
              </div>

              {formData.hasHomeLoan === 'yes' && (
                <>
                  <div>
                    <span className="input-label">Is the loan for buying/building a home, or repair/renovation?</span>
                    <div className="radio-group">
                      <div 
                        className={`radio-card ${formData.homeLoanType === 'buy' ? 'selected' : ''}`}
                        onClick={() => updateField('homeLoanType', 'buy')}
                      >
                        Buying / Building (Max ₹2 Lakh limit)
                      </div>
                      <div 
                        className={`radio-card ${formData.homeLoanType === 'repair' ? 'selected' : ''}`}
                        onClick={() => updateField('homeLoanType', 'repair')}
                      >
                        Repair / Renovation (Max ₹30k limit)
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="input-label" htmlFor="homeLoanInterest">Total interest paid this financial year</label>
                    <input 
                      type="number" 
                      id="homeLoanInterest" 
                      className="input-field" 
                      value={formData.homeLoanInterest}
                      onChange={(e) => updateField('homeLoanInterest', Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );
      case 6:
        return (
          <div>
            <h2 className="wizard-step-title">Deductions and savings</h2>
            <p className="wizard-step-subtitle">Enter any other investments or interests you had during the year.</p>
            <div className="question-group">
              <div>
                <label className="input-label" htmlFor="savings80C">Total other 80C investments (PPF, ELSS, Insurance, Home Loan Principal etc.)</label>
                <input 
                  type="number" 
                  id="savings80C" 
                  className="input-field" 
                  value={formData.savings80C}
                  onChange={(e) => updateField('savings80C', Math.max(0, parseInt(e.target.value) || 0))}
                />
                <p className="helper-text">Provident Fund (PF) is already included automatically.</p>
              </div>

              <div>
                <label className="input-label" htmlFor="healthInsuranceSelf">Health Insurance premium (Self, Spouse, Children)</label>
                <input 
                  type="number" 
                  id="healthInsuranceSelf" 
                  className="input-field" 
                  value={formData.healthInsuranceSelf}
                  onChange={(e) => updateField('healthInsuranceSelf', Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              <div>
                <label className="input-label" htmlFor="healthInsuranceParents">Health Insurance premium (Parents)</label>
                <input 
                  type="number" 
                  id="healthInsuranceParents" 
                  className="input-field" 
                  value={formData.healthInsuranceParents}
                  onChange={(e) => updateField('healthInsuranceParents', Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              <div>
                <label className="input-label" htmlFor="npsOwnContribution">Your own contribution to NPS (Section 80CCD(1B))</label>
                <input 
                  type="number" 
                  id="npsOwnContribution" 
                  className="input-field" 
                  value={formData.npsOwnContribution}
                  onChange={(e) => updateField('npsOwnContribution', Math.max(0, parseInt(e.target.value) || 0))}
                />
                <p className="helper-text">Allows additional deduction up to ₹50,000 in Old Regime.</p>
              </div>

              <div>
                <label className="input-label" htmlFor="savingsInterestAnnual">Annual Savings Account Interest Earned</label>
                <input 
                  type="number" 
                  id="savingsInterestAnnual" 
                  className="input-field" 
                  value={formData.savingsInterestAnnual}
                  onChange={(e) => updateField('savingsInterestAnnual', Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              <div>
                <label className="input-label" htmlFor="fdInterestAnnual">Annual Fixed Deposit (FD) Interest Earned</label>
                <input 
                  type="number" 
                  id="fdInterestAnnual" 
                  className="input-field" 
                  value={formData.fdInterestAnnual}
                  onChange={(e) => updateField('fdInterestAnnual', Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div>
            <h2 className="wizard-step-title">Capital Gains</h2>
            <p className="wizard-step-subtitle">Did you sell any stocks, mutual funds, or property this year?</p>
            <div className="question-group">
              <div>
                <label className="input-label" htmlFor="equitySTCG">Short-Term Capital Gains (STCG) on Equity / Equity MFs</label>
                <input 
                  type="number" 
                  id="equitySTCG" 
                  className="input-field" 
                  value={formData.equitySTCG}
                  onChange={(e) => updateField('equitySTCG', Math.max(0, parseInt(e.target.value) || 0))}
                />
                <p className="helper-text">Taxed at flat 20%.</p>
              </div>
              <div>
                <label className="input-label" htmlFor="equityLTCG">Long-Term Capital Gains (LTCG) on Equity / Equity MFs</label>
                <input 
                  type="number" 
                  id="equityLTCG" 
                  className="input-field" 
                  value={formData.equityLTCG}
                  onChange={(e) => updateField('equityLTCG', Math.max(0, parseInt(e.target.value) || 0))}
                />
                <p className="helper-text">First ₹1.25 Lakhs is exempt. The rest is taxed at 12.5%.</p>
              </div>
              <div>
                <label className="input-label" htmlFor="otherSTCG">Short-Term Capital Gains on Other Assets (Property, Debt MFs)</label>
                <input 
                  type="number" 
                  id="otherSTCG" 
                  className="input-field" 
                  value={formData.otherSTCG}
                  onChange={(e) => updateField('otherSTCG', Math.max(0, parseInt(e.target.value) || 0))}
                />
                <p className="helper-text">Added to your standard income and taxed at slab rates.</p>
              </div>
              <div>
                <label className="input-label" htmlFor="otherLTCG">Long-Term Capital Gains on Other Assets (Property etc.)</label>
                <input 
                  type="number" 
                  id="otherLTCG" 
                  className="input-field" 
                  value={formData.otherLTCG}
                  onChange={(e) => updateField('otherLTCG', Math.max(0, parseInt(e.target.value) || 0))}
                />
                <p className="helper-text">Taxed at 12.5% without indexation.</p>
              </div>
            </div>
          </div>
        );
      case 8:
        return (
          <div>
            <h2 className="wizard-step-title">Review your inputs</h2>
            <p className="wizard-step-subtitle">Please verify if the information is correct. You can edit any section inline.</p>
            <div className="question-group" style={{ gap: '1.25rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>1. Profile & Basics</span>
                  <button onClick={() => jumpToStep(1)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Age Group: {formData.ageGroup === 'below60' ? 'Below 60' : formData.ageGroup === 'senior' ? 'Senior (60-79)' : 'Super Senior (80+)'} | City: {formData.cityType === 'metro' ? 'Metro' : 'Other'} | Source: {formData.primaryIncomeSource}
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>2. In-Hand Income</span>
                  <button onClick={() => jumpToStep(2)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Monthly: ₹{formData.monthlyInHand.toLocaleString('en-IN')} | Months: {formData.monthsCount} | Bonus: ₹{formData.bonusAnnual.toLocaleString('en-IN')} | Freelance: ₹{formData.freelanceIncome.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>3. Payslip Cuts</span>
                  <button onClick={() => jumpToStep(3)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  PF Monthly: ₹{formData.pfMonthlyAmount.toLocaleString('en-IN')} | HRA Monthly: ₹{formData.hraMonthlyAmount.toLocaleString('en-IN')} | PT Monthly: ₹{formData.ptMonthlyAmount.toLocaleString('en-IN')} | NPS Employer Monthly: ₹{formData.employerNpsMonthlyAmount.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>4. Rent & Housing</span>
                  <button onClick={() => jumpToStep(4)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Pays Rent: {formData.paysRent} {formData.paysRent === 'yes' ? `(₹${formData.rentPaidMonthly.toLocaleString('en-IN')}/mo)` : ''}
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>5. Home Loan</span>
                  <button onClick={() => jumpToStep(5)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Has Loan: {formData.hasHomeLoan} {formData.hasHomeLoan === 'yes' ? `(${formData.homeLoanType === 'buy' ? 'Buying' : 'Repair'}, Interest: ₹${formData.homeLoanInterest.toLocaleString('en-IN')})` : ''}
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>6. Deductions & Savings</span>
                  <button onClick={() => jumpToStep(6)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  80C: ₹{formData.savings80C.toLocaleString('en-IN')} | Health Ins: ₹{formData.healthInsuranceSelf.toLocaleString('en-IN')} / ₹{formData.healthInsuranceParents.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>7. Capital Gains</span>
                  <button onClick={() => jumpToStep(7)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Equity STCG: ₹{formData.equitySTCG.toLocaleString('en-IN')} | Equity LTCG: ₹{formData.equityLTCG.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderLivePreview = () => {
    return (
      <div className="mock-preview" style={{ position: 'sticky', top: '1rem' }}>
        <div className="mock-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="mock-dot red"></span>
            <span className="mock-dot yellow"></span>
            <span className="mock-dot green"></span>
            <span className="mock-title">LIVE TAX ESTIMATOR</span>
          </div>
          <span 
            className="badge" 
            style={{ 
              fontSize: '0.65rem', 
              background: confidenceScore === 'High' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: confidenceScore === 'High' ? 'var(--accent-success)' : 'var(--accent-warning)',
              borderColor: 'transparent'
            }}
          >
            {confidenceScore} Estimate
          </span>
        </div>
        <div className="mock-body" style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <div className="mock-row mock-header-row">
            <div>Summary</div>
            <div className="mock-value">Old Regime</div>
            <div className="mock-value">New Regime</div>
          </div>
          <div className="mock-row">
            <div>Reconstructed Gross</div>
            <div className="mock-value">₹{salaryData.annualGross.toLocaleString('en-IN')}</div>
            <div className="mock-value">₹{salaryData.annualGross.toLocaleString('en-IN')}</div>
          </div>
          <div className="mock-row">
            <div>Interest Income</div>
            <div className="mock-value">₹{otherIncome.toLocaleString('en-IN')}</div>
            <div className="mock-value">₹{otherIncome.toLocaleString('en-IN')}</div>
          </div>
          <div className="mock-row">
            <div>Standard Deduction</div>
            <div className="mock-value">₹{oldRegime.stdDeduction.toLocaleString('en-IN')}</div>
            <div className="mock-value">₹{newRegime.stdDeduction.toLocaleString('en-IN')}</div>
          </div>
          <div className="mock-row">
            <div>HRA Exemption</div>
            <div className="mock-value">₹{oldRegime.hraExemption.toLocaleString('en-IN')}</div>
            <div className="mock-value">₹0</div>
          </div>
          {oldRegime.deduction80GG > 0 && (
            <div className="mock-row">
              <div>80GG Rent Exemption</div>
              <div className="mock-value">₹{oldRegime.deduction80GG.toLocaleString('en-IN')}</div>
              <div className="mock-value">₹0</div>
            </div>
          )}
          <div className="mock-row">
            <div>Other Deductions</div>
            <div className="mock-value">₹{(oldRegime.totalDeductions - oldRegime.stdDeduction - oldRegime.hraExemption - oldRegime.deduction80GG).toLocaleString('en-IN')}</div>
            <div className="mock-value">₹{(newRegime.totalDeductions - newRegime.stdDeduction).toLocaleString('en-IN')}</div>
          </div>
          <div className="mock-row">
            <div>Net Taxable Income</div>
            <div className="mock-value">₹{oldRegime.taxableIncome.toLocaleString('en-IN')}</div>
            <div className="mock-value">₹{newRegime.taxableIncome.toLocaleString('en-IN')}</div>
          </div>
          <div className="mock-row mock-highlight">
            <div>Estimated Tax (Cess Inc.)</div>
            <div className="mock-value">₹{Math.round(oldRegime.finalTax).toLocaleString('en-IN')}</div>
            <div className="mock-value">₹{Math.round(newRegime.finalTax).toLocaleString('en-IN')}</div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', width: '100%' }}
              onClick={() => setShowSlabBreakdown(!showSlabBreakdown)}
            >
              {showSlabBreakdown ? 'Hide Slab Breakdown ▲' : 'View Slab Breakdown ▼'}
            </button>
          </div>

          {showSlabBreakdown && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Old Regime Slabs ({formData.ageGroup === 'below60' ? 'Below 60' : formData.ageGroup === 'senior' ? 'Senior' : 'Super Senior'})</h4>
                <table style={{ width: '100%', fontSize: '0.75rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th>Slab Slices</th>
                      <th style={{ textAlign: 'right' }}>Income In Slab</th>
                      <th style={{ textAlign: 'right' }}>Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oldRegime.breakdown.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px dashed var(--border-color)' }}>
                        <td>{row.range} ({row.rate}%)</td>
                        <td style={{ textAlign: 'right' }}>₹{Math.round(row.taxableInSlab).toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right' }}>₹{Math.round(row.slabTax).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>New Regime Slabs</h4>
                <table style={{ width: '100%', fontSize: '0.75rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th>Slab Slices</th>
                      <th style={{ textAlign: 'right' }}>Income In Slab</th>
                      <th style={{ textAlign: 'right' }}>Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newRegime.breakdown.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px dashed var(--border-color)' }}>
                        <td>{row.range} ({row.rate}%)</td>
                        <td style={{ textAlign: 'right' }}>₹{Math.round(row.taxableInSlab).toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right' }}>₹{Math.round(row.slabTax).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mock-result-card" style={{ borderStyle: 'solid', borderColor: 'var(--border-color)', background: 'transparent' }}>
            <div className="mock-result-winner" style={{ color: 'var(--accent-primary)' }}>
              🎉 {winnerLabel} saves you ₹{Math.round(savings).toLocaleString('en-IN')}!
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResultScreen = () => {
    return (
      <div id="result-screen-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <div className="mock-preview" id="result-screen-content">
          <div className="mock-header">
            <span className="mock-dot red"></span>
            <span className="mock-dot yellow"></span>
            <span className="mock-dot green"></span>
            <span className="mock-title">RECOMMENDATION SUMMARY & BREAKDOWN</span>
          </div>
          <div className="mock-body" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Top winner card */}
            <div className="mock-result-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="badge" style={{ alignSelf: 'center', marginBottom: '0.5rem' }}>Winner Recommendation</div>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                Pick the {winnerLabel}.
              </h2>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>
                You save ₹{Math.round(savings).toLocaleString('en-IN')} annually
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                All calculations ran local-only in your browser. No data was uploaded.
              </p>
            </div>

            {/* Side-by-Side Comparison */}
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Side-by-Side Tax Comparison</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem 0' }}>Salary Head / Deductions</th>
                    <th style={{ textAlign: 'right' }}>Old Regime</th>
                    <th style={{ textAlign: 'right' }}>New Regime</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem 0', fontWeight: 600 }}>Total Reconstructed Gross Income</td>
                    <td style={{ textAlign: 'right' }}>₹{oldRegime.gross.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>₹{newRegime.gross.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem 0' }}>Standard Deduction</td>
                    <td style={{ textAlign: 'right' }}>- ₹{oldRegime.stdDeduction.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>- ₹{newRegime.stdDeduction.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: oldRegime.hraExemption > 0 ? 'inherit' : 'var(--text-muted)' }}>
                    <td style={{ padding: '0.5rem 0' }}>HRA Exemption</td>
                    <td style={{ textAlign: 'right' }}>- ₹{oldRegime.hraExemption.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>₹0</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: oldRegime.deduction80GG > 0 ? 'inherit' : 'var(--text-muted)' }}>
                    <td style={{ padding: '0.5rem 0' }}>80GG Rent Exemption</td>
                    <td style={{ textAlign: 'right' }}>- ₹{oldRegime.deduction80GG.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>₹0</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: oldRegime.deduction80C > 0 ? 'inherit' : 'var(--text-muted)' }}>
                    <td style={{ padding: '0.5rem 0' }}>80C Investments (Inc. PF)</td>
                    <td style={{ textAlign: 'right' }}>- ₹{oldRegime.deduction80C.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>₹0</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: oldRegime.deduction80D > 0 ? 'inherit' : 'var(--text-muted)' }}>
                    <td style={{ padding: '0.5rem 0' }}>80D Health Insurance</td>
                    <td style={{ textAlign: 'right' }}>- ₹{oldRegime.deduction80D.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>₹0</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: oldRegime.deduction80CCD1B > 0 ? 'inherit' : 'var(--text-muted)' }}>
                    <td style={{ padding: '0.5rem 0' }}>80CCD(1B) Own NPS</td>
                    <td style={{ textAlign: 'right' }}>- ₹{oldRegime.deduction80CCD1B.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>₹0</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: oldRegime.homeLoanDeduction > 0 ? 'inherit' : 'var(--text-muted)' }}>
                    <td style={{ padding: '0.5rem 0' }}>24(b) Home Loan Interest</td>
                    <td style={{ textAlign: 'right' }}>- ₹{oldRegime.homeLoanDeduction.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>₹0</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: oldRegime.employerNps > 0 || newRegime.employerNps > 0 ? 'inherit' : 'var(--text-muted)' }}>
                    <td style={{ padding: '0.5rem 0' }}>80CCD(2) Employer NPS</td>
                    <td style={{ textAlign: 'right' }}>- ₹{oldRegime.employerNps.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>- ₹{newRegime.employerNps.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: oldRegime.deductionTTAorTTB > 0 ? 'inherit' : 'var(--text-muted)' }}>
                    <td style={{ padding: '0.5rem 0' }}>{oldRegime.ttaOrTtbLabel || '80TTA/80TTB Interest Deduction'}</td>
                    <td style={{ textAlign: 'right' }}>- ₹{oldRegime.deductionTTAorTTB.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>₹0</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', fontWeight: 700 }}>
                    <td style={{ padding: '0.5rem 0' }}>Taxable Net Income</td>
                    <td style={{ textAlign: 'right' }}>₹{oldRegime.taxableIncome.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>₹{newRegime.taxableIncome.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem 0' }}>Base Slab Tax</td>
                    <td style={{ textAlign: 'right' }}>₹{Math.round(oldRegime.baseTax).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>₹{Math.round(newRegime.baseTax).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: oldRegime.capitalGainsTax > 0 || newRegime.capitalGainsTax > 0 ? 'inherit' : 'var(--text-muted)' }}>
                    <td style={{ padding: '0.5rem 0' }}>Special Rate Tax (Capital Gains)</td>
                    <td style={{ textAlign: 'right' }}>₹{Math.round(oldRegime.capitalGainsTax || 0).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>₹{Math.round(newRegime.capitalGainsTax || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: oldRegime.rebate > 0 || newRegime.rebate > 0 ? 'inherit' : 'var(--text-muted)' }}>
                    <td style={{ padding: '0.5rem 0' }}>87A Rebate / Relief</td>
                    <td style={{ textAlign: 'right' }}>- ₹{Math.round(oldRegime.rebate).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>- ₹{Math.round(newRegime.rebate).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem 0' }}>4% Cess</td>
                    <td style={{ textAlign: 'right' }}>₹{Math.round(oldRegime.cess).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>₹{Math.round(newRegime.cess).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', fontWeight: 800, fontSize: '1.05rem', background: 'rgba(79, 70, 229, 0.02)' }}>
                    <td style={{ padding: '0.75rem 0' }}>Final Net Tax Due</td>
                    <td style={{ textAlign: 'right', color: winner === 'old' ? 'var(--accent-success)' : 'inherit' }}>
                      ₹{Math.round(oldRegime.finalTax).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', color: winner === 'new' ? 'var(--accent-success)' : 'inherit' }}>
                      ₹{Math.round(newRegime.finalTax).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Why that regime wins */}
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Why it wins</h3>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
                {reasons.map((r, i) => (
                  <li key={i} style={{ color: 'var(--text-secondary)' }}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Personalized Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Tax Saving Next Steps</h3>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
                  {suggestions.map((s, i) => (
                    <li key={i} style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }} data-html2canvas-ignore="true">
              <button 
                className="btn btn-secondary" 
                onClick={() => setCurrentStep(0)}
              >
                ← Start Over
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleDownloadPDF}
              >
                Download as PDF 📄
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (currentStep === 0) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="logo-container">
            <div className="logo-icon">₹</div>
            <span>TaxRegime.in</span>
          </div>
          <nav className="nav-links">
            <span className="trust-line">
              <span className="trust-icon">✓</span> Runs fully in-browser
            </span>
          </nav>
        </header>

        <main>
          <section className="hero-section">
            <div className="hero-content">
              <div className="badge">FY 2025–26 (AY 2026–27)</div>
              <h1 className="hero-title">
                Find out which <span>tax regime</span> saves you more money.
              </h1>
              <p className="hero-subtitle">
                Compare the Old vs New Tax Regimes using the salary amount that actually lands in your bank. No CTC jargon.
              </p>
              <div className="cta-group">
                <button className="btn btn-primary" onClick={() => setCurrentStep(1)}>
                  Start in 2 minutes →
                </button>
                <button className="btn btn-secondary" onClick={() => setCurrentStep(9)}>
                  See a sample result
                </button>
              </div>
              <p className="trust-line" style={{ marginTop: '0.5rem' }}>
                🔒 Privacy first: No login, no server uploads. Your data stays on your machine.
              </p>
            </div>

            <div className="hero-visual">
              <div className="mock-preview angle">
                <div className="mock-header">
                  <span className="mock-dot red"></span>
                  <span className="mock-dot yellow"></span>
                  <span className="mock-dot green"></span>
                  <span className="mock-title">LIVE CALCULATOR ESTIMATE</span>
                </div>
                <div className="mock-body">
                  <div className="mock-row mock-header-row">
                    <div>Salary Head</div>
                    <div className="mock-value">Old Regime</div>
                    <div className="mock-value">New Regime</div>
                  </div>
                  <div className="mock-row">
                    <div>Assumed Monthly In-Hand</div>
                    <div className="mock-value">₹1,20,000</div>
                    <div className="mock-value">₹1,20,000</div>
                  </div>
                  <div className="mock-row">
                    <div>Standard Deduction</div>
                    <div className="mock-value">₹50,000</div>
                    <div className="mock-value">₹75,000</div>
                  </div>
                  <div className="mock-row">
                    <div>Exemptions (HRA + 80C)</div>
                    <div className="mock-value">₹2,00,000</div>
                    <div className="mock-value">₹0</div>
                  </div>
                  <div className="mock-row mock-highlight">
                    <div>Estimated Net Tax</div>
                    <div className="mock-value">₹1,14,400</div>
                    <div className="mock-value">₹85,800</div>
                  </div>
                  <div className="mock-result-card" style={{ borderStyle: 'solid', borderColor: 'var(--border-color)', background: 'transparent' }}>
                    <div className="mock-result-winner" style={{ color: 'var(--text-muted)' }}>Enter your details to calculate</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="steps-section">
            <h2 className="steps-title">How It Works</h2>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3 className="step-title">Monthly bank credit</h3>
                <p className="step-desc">
                  Input what you actually receive in your bank account each month, not your CTC.
                </p>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <h3 className="step-title">Answer simple questions</h3>
                <p className="step-desc">
                  Do you pay rent? Do you have an NPS account? We keep it in plain language.
                </p>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <h3 className="step-title">Get your saving answer</h3>
                <p className="step-desc">
                  See exactly which regime is better and why, with clear suggestions for next steps.
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer className="app-footer">
          <p>© 2026 TaxRegime.in • Built for Indian Salaried Employees and Freelancers • FY 2025-26 / AY 2026-27</p>
        </footer>
      </div>
    );
  }

  if (currentStep === 9) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="logo-container" onClick={() => setCurrentStep(0)}>
            <div className="logo-icon">₹</div>
            <span>TaxRegime.in</span>
          </div>
          <span className="trust-line">
            <span className="trust-icon">✓</span> Runs fully in-browser
          </span>
        </header>
        <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', margin: '2rem 0' }}>
          {renderResultScreen()}
        </main>
        <footer className="app-footer">
          <p>© 2026 TaxRegime.in • Built for Indian Salaried Employees and Freelancers • FY 2025-26 / AY 2026-27</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container" onClick={() => setCurrentStep(0)}>
          <div className="logo-icon">₹</div>
          <span>TaxRegime.in</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={handleReset} 
            className="btn btn-secondary" 
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            Reset All
          </button>
          <span className="trust-line">
            <span className="trust-icon">✓</span> Runs fully in-browser
          </span>
        </div>
      </header>

      {renderProgressBar()}

      <div className="wizard-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div className="wizard-left-panel">
            {renderStepContent()}
            <div className="wizard-actions">
              <button 
                className="btn btn-secondary" 
                onClick={handleBack}
              >
                Back
              </button>
              <button 
                className="btn btn-primary" 
                onClick={currentStep === 7 ? () => setCurrentStep(8) : handleNext}
              >
                {currentStep === 7 ? 'Calculate My Savings →' : 'Next'}
              </button>
            </div>
          </div>

          <div className="step-faq-container">
            <h3 className="faq-title">Frequently Asked Questions</h3>
            <div className="faq-list">
              {STEP_FAQS[currentStep]?.map((faq, index) => (
                <div className="faq-item" key={index}>
                  <div className="faq-question">Q: {faq.q}</div>
                  <div className="faq-answer">{faq.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="wizard-right-panel">
          {renderLivePreview()}
        </div>
      </div>

      <footer className="app-footer">
        <p>© 2026 TaxRegime.in • Built for Indian Salaried Employees and Freelancers • FY 2025-26 / AY 2026-27</p>
      </footer>
    </div>
  );
}

export default App;
