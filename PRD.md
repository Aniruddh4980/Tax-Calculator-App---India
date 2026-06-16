# PRD: India Salaried Tax Calculator (FY 2025–26)

## 1. Product summary

Build a privacy-first, browser-only tax calculator for salaried people in India that compares the **old regime** vs the **new regime** for **FY 2025–26** (assessment year **2026–27**). The product must start from what users already know: **the amount that reaches their bank account every month**. It should avoid finance jargon, avoid asking for CTC as the first input, and guide users through a short step-by-step wizard that asks one plain-language question at a time.

The product must answer three questions clearly:

1. Which tax regime saves me more money?
2. Why does that regime win for my situation?
3. What can I do next to reduce tax legally?

## 2. Problem statement

A large number of salaried Indians do not know which tax regime is better for them. Existing calculators are hard to use because they often assume users know CTC, gross salary, or tax terminology. Most users know only the amount credited to their bank account, and they can usually recognize common salary items on a payslip such as PF, HRA, and NPS contributions.

The product should reduce effort, remove jargon, and make the tax decision feel simple and trustworthy.

## 3. Product goals

- Help salaried users compare old vs new regime in under 5 minutes.
- Start from monthly take-home amount, not CTC.
- Explain tax using plain language.
- Show live estimates while the user is still answering questions.
- Make the final recommendation easy to understand: **Pick this regime. You save ₹X.**
- Stay fully in-browser and privacy-first.
- Support FY 2025–26 tax rules accurately for salaried users.

## 4. Non-goals

- No filing of tax returns.
- No PAN, Aadhaar, login, or backend account.
- No support for business income, freelance income, capital gains, crypto, or complex special-rate income.
- No surcharge calculations in v1.
- No AMT / MAT.
- No PDF export required.
- No general income tax advisory beyond salaried comparison.

## 5. Target users

### Primary user
A salaried Indian in their 20s to 40s who wants a simple answer to “old or new?”

### Secondary user
A senior citizen pensioner or salaried employee who wants to understand whether deductions and exemptions still make old regime better.

### Tertiary user
A first-time employee who only knows monthly bank credit and wants a guided explanation.

## 6. Core product principles

1. **Start with the known number**: monthly bank credit / take-home.
2. **Plain language over tax language**: ask “Do you pay rent?” instead of “Enter HRA exemption.”
3. **One question at a time**: reduce cognitive load.
4. **Live feedback**: every answer should visibly change the estimate.
5. **Explain the why**: every recommendation must be backed by a simple reason.
6. **Privacy by design**: all computation in the browser, no server storage.
7. **Honest confidence**: if a result is based on estimates, show that clearly.

## 7. Scope and rule baseline

### Tax year scope
- Financial Year: **2025–26**
- Assessment Year: **2026–27**

### User scope
- Salaried individuals in India
- Resident individuals primarily
- Age-based handling must support:
  - below 60
  - senior citizen (60 to 79)
  - super senior citizen (80+)

### Regime scope
- Old regime
- New regime under section 115BAC

### Income scope
- Salary income
- House rent allowance
- Standard deduction
- Professional tax
- 80C family of deductions
- 80D
- 80CCD(1), 80CCD(1B), 80CCD(2)
- 24(b) self-occupied home loan interest in old regime
- Savings interest / fixed deposit interest treatment
- Optional 80GG fallback if user pays rent but does not receive HRA

## 8. Official tax logic baseline for FY 2025–26

## 8.1 Old regime slab rates

The app must support these old-regime slabs for salaried individuals:

### Below 60 years
- Up to ₹2,50,000: nil
- ₹2,50,001 to ₹5,00,000: 5%
- ₹5,00,001 to ₹10,00,000: 20%
- Above ₹10,00,000: 30%

### Senior citizen (60 to 79)
- Up to ₹3,00,000: nil
- ₹3,00,001 to ₹5,00,000: 5%
- ₹5,00,001 to ₹10,00,000: 20%
- Above ₹10,00,000: 30%

### Super senior citizen (80+)
- Up to ₹5,00,000: nil
- ₹5,00,001 to ₹10,00,000: 20%
- Above ₹10,00,000: 30%

### Old regime rebate
- Resident individual total income up to ₹5,00,000 gets section 87A rebate up to ₹12,500.
- Rebate is applied before cess.
- The app must not apply new-regime-only rebate logic in old regime.

## 8.2 New regime slab rates for FY 2025–26 / AY 2026–27

The app must use these slabs:
- Up to ₹4,00,000: nil
- ₹4,00,001 to ₹8,00,000: 5%
- ₹8,00,001 to ₹12,00,000: 10%
- ₹12,00,001 to ₹16,00,000: 15%
- ₹16,00,001 to ₹20,00,000: 20%
- ₹20,00,001 to ₹24,00,000: 25%
- Above ₹24,00,000: 30%

### New regime rebate
- Resident individual under section 115BAC(1A): rebate up to ₹60,000 if total income does not exceed ₹12,00,000.
- The app must support marginal relief at the threshold.
- Rebate is applied before cess.

## 8.3 Cess
- Health and Education Cess: 4% on tax plus surcharge.
- Since surcharge is out of scope for v1, the app should only calculate cess on base tax after rebate.

## 8.4 Standard deduction
- Old regime: ₹50,000 or salary, whichever is lower.
- New regime: ₹75,000 or salary, whichever is lower.
- Applies to salaried employees and pensioners.

## 8.5 HRA
- HRA exemption is available only in old regime.
- Formula: least of
  - actual HRA received
  - rent paid minus 10% of salary
  - 50% of salary in metro cities, 40% elsewhere
- For HRA, salary means basic + DA if DA forms part of retirement benefits + commission based on turnover, not all allowances.
- If the user owns the house they live in or does not pay rent, HRA exemption must be zero.
- If the user claims HRA, 80GG must not be claimed.

## 8.6 Professional tax
- Deductible only in old regime.
- Amount actually paid during the year is deductible.
- If employer pays professional tax on behalf of employee, include as perquisite and then allow deduction.
- Not allowed in new regime.

## 8.7 80C family of deductions
- Aggregate cap for 80C + 80CCC + 80CCD(1): ₹1,50,000.
- Items typically included: EPF employee contribution, PPF, life insurance premium, ELSS, NSC, tuition fees, home loan principal repayment, 5-year tax saver FD, pension plan premiums, Sukanya Samriddhi and similar eligible investments.
- The app should let users enter a single total amount first, with an optional breakdown later.
- 80C is not allowed in new regime.

## 8.8 NPS
### 80CCD(1)
- Employee’s own contribution to NPS / APY.
- Deduction up to 10% of salary for salaried users.
- Included within the ₹1,50,000 overall cap with 80C and 80CCC.

### 80CCD(1B)
- Additional deduction up to ₹50,000 for own NPS contribution.
- Separate from the ₹1,50,000 cap.
- Old regime only.

### 80CCD(2)
- Employer contribution to NPS.
- Deduction allowed separately.
- Limit:
  - 14% of salary for Central / State Government employees
  - 14% of salary if the employee opts for new regime
  - 10% of salary in other cases
- This deduction is allowed in both regimes.
- The app must surface employer NPS as a major decision driver because it can materially change the comparison.

## 8.9 Health insurance and medical spend (80D)
- Allowed in old regime only.
- User for self/family: ₹25,000 if all are below 60, ₹50,000 if insured person is senior citizen.
- Parents: additional ₹25,000 or ₹50,000 if parent is senior citizen.
- Preventive health check-up: up to ₹5,000 inside the overall cap.
- Medical expenditure for senior citizens can be considered where no premium is paid, subject to official limits.
- Cash payment must be blocked except preventive check-up where allowed.

## 8.10 Savings interest and FD interest
- Savings account interest:
  - Old regime: 80TTA up to ₹10,000 for non-senior individuals and HUF.
  - New regime: not allowed.
  - Senior citizens should use 80TTB instead.
- FD / term deposit interest:
  - Old regime: senior citizens can claim 80TTB up to ₹50,000 for interest on deposits with banks / co-operative banks / post offices.
  - New regime: not allowed.
- Non-senior fixed deposit interest is taxable in full.
- The app must treat savings and FD interest separately.

## 8.11 Home loan interest
- Old regime only for self-occupied property.
- Up to ₹2,00,000 for acquisition / construction loans, subject to conditions.
- Up to ₹30,000 for repair / renovation loans.
- The app must ask a simple question to determine whether the loan is for buying/building or repair/renovation.
- New regime must show zero deduction for self-occupied home loan interest.
- Let-out property logic is out of scope for v1.

## 8.12 Optional 80GG
- If the user pays rent but receives no HRA, show 80GG as an optional old-regime fallback.
- Show it only when HRA exemption is zero.
- Formula should follow official rules and cap logic.
- If product complexity needs to stay tight, 80GG can be hidden behind “I pay rent but do not get HRA”.

## 9. Experience design

## 9.1 Landing page
The landing page must look like a finished product, not an empty form.

### Above the fold
- Headline: **Find out which tax regime saves you more money**
- Subtext: compare old vs new using the salary amount that actually hits your bank
- Primary CTA: **Start in 2 minutes**
- Secondary CTA: **See a sample result**

### Visual elements
- A large product mock preview showing:
  - side-by-side tax comparison
  - a simple result card
  - a progress indicator
- A subtle trust line: “Runs fully in your browser. Nothing is uploaded.”
- A short 3-step visual explanation:
  1. Enter your monthly in-hand salary
  2. Answer simple life questions
  3. See the better regime and why

### Tone
- Calm
- Trustworthy
- Clear
- Minimal
- No clutter

## 9.2 Wizard structure
The wizard should ask one thing at a time and adapt based on answers.

### Step 1: Basics
- Age group
- Employment type if needed for PF/NPS logic
- City type: metro or non-metro
- Do you get salary in bank every month? (this opens the flow)

### Step 2: Money that reaches your bank
- Monthly in-hand salary credited
- Optional: number of salary months if not 12
- Optional: annual bonus or variable pay
- Optional helper text: “Use the amount that lands in your bank after company deductions.”

### Step 3: What your payslip cuts out
Ask only the items that matter:
- Does your payslip deduct PF?
- Does your payslip deduct NPS?
- Does your payslip deduct professional tax?
- Any other regular salary deduction?
- Does your employer contribute to NPS?
- Do you get HRA?

### Step 4: Rent
Only show if user pays rent or gets HRA.
- Monthly rent paid
- Do you live in a metro city?
- Do you live in a rented home?
- Is your rent receipt available? (for user reassurance, not a hard blocker)

### Step 5: Home loan
Only show if user has a home loan.
- Is the house self-occupied?
- Is the loan for buying/building or repair/renovation?
- Total interest paid during the year

### Step 6: Deductions and savings
Plain-language labels, with examples in small helper text:
- Did you invest in PF / PPF / ELSS / life insurance / tuition / tax saver FD?
- How much in total?
- Do you pay health insurance for yourself/family?
- Do you pay health insurance for parents?
- Do you contribute to your own NPS?
- How much interest did you earn from savings accounts?
- How much interest did you earn from fixed deposits?
- Optional: do you pay rent without HRA? (for 80GG)

### Step 7: Review
- Show everything entered in a short editable summary.
- Allow inline edits without restarting.
- Show a final confidence badge.

## 9.3 Progress indicator
- Use a horizontal progress bar or step dots.
- It should reflect actual completion, not just page count.
- Show “Step 3 of 7” text for accessibility.
- If a step is skipped due to prior answers, progress still feels continuous.

## 9.4 FAQ at the bottom of each step
Every step should have a compact FAQ section with 3 to 5 questions.
Examples:
- “What if I do not know the exact amount?”
- “Do I need to enter gross salary?”
- “What if my payslip only shows PF?”
- “Is rent enough, or do I need rent receipts?”
- “What if I live in my own house?”

FAQ content should be step-specific and short.

## 9.5 Live preview panel
A fixed right-side panel on desktop and a collapsible bottom sheet on mobile.

### Must show
- Estimated tax under old regime
- Estimated tax under new regime
- Winner regime
- Annual tax savings difference
- Monthly tax difference
- Status badge: exact / estimated / incomplete

### Detailed breakdown view
The preview panel should expand into a detailed section showing:
- annual salary income
- HRA exemption
- standard deduction
- PF / NPS / professional tax handling
- 80C / 80D / 80CCD(1B) / 80CCD(2)
- home loan interest
- savings / FD interest treatment
- taxable income under each regime
- slab-by-slab tax table for each regime
- rebate applied
- cess applied
- final tax

### Change tracking
When an answer changes, the panel should briefly highlight the affected line item.

## 10. Calculation engine requirements

## 10.1 Core formula order
The engine must calculate in a stable order:

1. Build annual salary income from salary inputs.
2. Compute regime-specific allowable deductions.
3. Compute taxable income under each regime.
4. Apply slab tax.
5. Apply rebate.
6. Apply cess.
7. Compare final tax amounts.
8. Show savings and recommendation.

## 10.2 Salary reconstruction model
Because users start from monthly in-hand amount, the calculator must not require CTC as the first input.

### Recommended model
- Primary input: monthly bank credit.
- Secondary inputs: recurring payslip deductions and major allowances.
- Optional advanced input: annual bonus / variable pay.
- Optional advanced input: any known monthly salary heads.

### Output behavior
- If enough data is available, show an exact estimate.
- If some salary components are missing, show a clearly labeled estimate and identify the missing pieces.
- The UI must not block the user just because they do not know CTC.

## 10.3 Deductions matrix
The engine must maintain a regime eligibility matrix.

### Allowed in old regime and not new regime
- HRA exemption
- 80C / 80CCC / 80CCD(1)
- 80CCD(1B)
- 80D
- 80E
- 80G / other charitable deductions if supported later
- professional tax
- self-occupied home loan interest under 24(b)
- 80TTA / 80TTB
- 80GG

### Allowed in both regimes
- standard deduction
- employer NPS contribution under 80CCD(2)
- some salary exemptions that are not regime-restricted, if clearly supported and in scope

### Not allowed in v1
- surcharge logic
- capital gains
- business / freelance income
- AMT / MAT
- foreign income
- special rate income

## 10.4 Rebate logic
The engine must support:
- old regime 87A up to ₹5,00,000
- new regime 87A up to ₹12,00,000 with marginal relief

### Rebate computation
For both regimes:
- Calculate tax before cess.
- If income is below the rebate threshold, rebate can reduce tax to zero, capped at the official rebate amount.
- If marginal relief applies, final tax before cess must not exceed the amount by which total income exceeds the threshold.

The result object must store:
- tax before rebate
- rebate amount
- tax after rebate
- cess amount
- final tax
- final tax per month

## 10.5 Edge cases
The engine must correctly handle:
- zero salary
- partial-year employment
- monthly vs annual input mismatch
- no HRA
- rent paid but no HRA
- PF only, no NPS
- NPS employer contribution cap overflow
- 80C overflow above ₹1,50,000
- 80CCD(1) and 80CCD(1B) combined cap overflow
- 80D cap overflow by family bucket and parents bucket
- senior citizen vs super senior citizen age boundary
- savings interest only
- FD interest only
- self-occupied home loan interest only
- no deductions at all
- regimes within a few rupees of each other

## 11. Recommendation rules

The final result should not just show numbers. It should explain the result in simple language.

### Recommendation copy pattern
- **Pick the old regime. You save ₹X.**
- **Pick the new regime. You save ₹X.**
- If difference is tiny: **Both regimes are almost the same. Choose the one with less paperwork.**

### Reasoning bullets
Show 2 to 4 reason cards:
- Your HRA exemption is high.
- Your 80C and 80D deductions are large.
- Your employer NPS helps in both regimes.
- You do not have enough deductions to beat the new slabs.
- Your income is near the rebate threshold, so tax drops sharply.

### Personalized suggestions
Generate practical next-step suggestions:
- “You still have room under 80C. More PF / PPF / ELSS could help in old regime.”
- “If your employer offers NPS, ask whether 80CCD(2) is available.”
- “If you pay rent, keep HRA proofs ready in old regime.”
- “If you have a home loan and live in that house, old regime may benefit more.”
- “If your deductions are low and you do not want paperwork, new regime is simpler.”

The suggestion engine must be deterministic and based on rules, not vague AI guessing.

## 12. Result screen

The final screen should contain:

### Hero result card
- Better regime
- Estimated annual tax
- Estimated monthly tax
- Estimated annual savings versus other regime
- Confidence badge

### Side-by-side comparison
- Gross salary / annual income used
- Allowed deductions in each regime
- Taxable income in each regime
- Base slab tax
- Rebate
- Cess
- Final tax

### Slab-by-slab breakdown
For each regime, show a table of:
- slab range
- amount falling in slab
- tax from slab
- cumulative tax

### Personalized education section
Show a plain-language explanation:
- Which inputs reduced tax
- Which inputs did nothing in the chosen regime
- Which inputs were the biggest drivers
- Which deductions the user still has unused room for

### Actionable next steps
- “Check whether your employer supports NPS contribution.”
- “Review whether you are using the full 80C limit.”
- "Keep rent proofs if you claim HRA."
- “Review whether 80D is correctly split between self/family and parents.”

## 13. UI / UX requirements

## 13.1 Visual style
- Clean, premium, modern SaaS-like financial UI.
- **Color Palette**:
  - Backgrounds: Bright and clean (`#F7FAFA`).
  - Cards/Surfaces: Pure white (`#FFFFFF`) to stand out against the background.
  - Accent/Success: Soft mint/teal (`#14B8A6` and `#0EA5A4`).
  - Text: Slate and dark gray hierarchy (`#0F172A`, `#475569`, `#64748B`).
  - Borders: Soft gray (`#E2E8F0`).
- **Shapes & Elevations**: Large rounded corners (24px) with subtle, premium shadows.
- Avoid dark navy backgrounds, neon glow effects, and heavy gradients.
- Strictly light mode (no dark mode toggle).

## 13.2 Layout & Navigation
Desktop:
- Left: wizard content
- Right: live preview panel
- Sticky progress indicator at top
- Bottom area for FAQ and helper text

Mobile:
- Single column wizard
- Preview panel collapses into a sticky summary tray
- FAQ appears under each step

## 13.3 Interaction details
- **Scrolling Behavior**: Clicking 'Next' or 'Back' automatically scrolls the page to the top of the wizard container (step count bar) to ensure the user always starts at the top of the new question. On the final step, the view scrolls to the recommendation summary.
- Auto-save progress in localStorage
- Step editing from review screen
- Debounced preview updates
- Smooth transitions, no jarring page reloads
- Keyboard and screen-reader friendly

## 14. Trust and privacy requirements

- No backend required for v1.
- No server-side persistence of user salary or deduction data.
- No user account.
- Clear copy: “All calculations happen in your browser.”
- Optional local-only save / resume.
- No analytics that capture personal financial inputs.
- If analytics are later added, they must be privacy-preserving and opt-in.

## 15. Accessibility requirements

- Works with keyboard only.
- High contrast text.
- Input labels must be explicit.
- Helper text must be readable on mobile.
- Error messages must be plain language.
- Screen reader announcements for step changes and final regime selection.
- Numeric formatting must be INR-friendly and locale-aware.

## 16. Content and microcopy guidelines

### Avoid
- CTC
- gross salary
- taxable income head jargon without explanation
- obscure section numbers in the UI body

### Prefer
- “money that lands in your bank”
- “rent you pay”
- “PF cut from salary”
- “health insurance”
- “NPS through employer”
- “your tax before rebate”
- “this part is not counted in the new regime”

### Tooltips
Use short tooltips for tricky items:
- “Salary here means what your company pays you before tax, not your bank credit.”
- “Metro means Delhi, Mumbai, Kolkata, or Chennai.”
- “Senior citizen means age 60 or more; super senior means 80 or more.”

## 17. Data model

### State object
- profile
  - age
  - residency status
  - metro flag
  - employment type
- salary
  - monthly bank credit
  - months paid
  - bonus
  - employee PF
  - employee NPS
  - professional tax
  - employer NPS
  - HRA received
  - other allowances
- housing
  - rent paid
  - owns home
  - self-occupied home loan interest
  - repair / renovation flag
- deductions
  - 80C total
  - 80D self/family
  - 80D parents
  - 80CCD(1)
  - 80CCD(1B)
  - savings interest
  - FD interest
  - 80GG flag
- outputs
  - old regime tax
  - new regime tax
  - winner
  - savings
  - explanation strings
  - confidence score

### Derived values
- annual salary
- HRA exemption
- 80C bucket remaining
- 80D bucket remaining
- old regime taxable income
- new regime taxable income
- slab tax per regime

## 18. Calculation validation rules

- All money fields must be non-negative.
- Show errors only after input or on submit, not aggressively.
- Monthly values can be multiplied by 12 automatically, but the user can also switch to annual mode.
- Age must be validated against the relevant category.
- If rent is zero, HRA exemption must be zero.
- If the user owns and occupies the house, HRA may still be relevant only if they rent elsewhere.
- If a deduction is not allowed in the selected regime, the UI should gray it out in that regime’s breakdown.
- Where limits exist, show both entered amount and allowed amount.

## 19. Empty-state and confidence handling

### When inputs are missing
- Show “We need one more answer to sharpen this estimate.”
- Keep the live preview visible, but label it as approximate.

### Confidence score
Use a simple confidence indicator based on completeness:
- High: all relevant salary and deduction inputs entered
- Medium: a few optional items missing
- Low: only bank credit entered

## 20. Acceptance criteria

The product is ready when:

- A user can start from monthly in-hand salary and reach a recommendation without entering CTC first.
- The wizard asks one plain-language question at a time.
- Each step has a helpful FAQ section.
- The live preview updates after every meaningful answer.
- The final screen clearly states which regime is better and by how much.
- The result includes side-by-side comparison, slab breakdown, and simple explanations.
- The app stays fully in the browser with no data upload.
- The calculator uses FY 2025–26 / AY 2026–27 rules for salaried users.
- The comparison handles age-based old-regime slabs and the FY 2025–26 new-regime slabs.
- The calculator respects regime-specific deduction availability.

## 21. Suggested build plan

### Phase 1: MVP
- Landing page
- Wizard with salary, age, rent, PF, NPS, 80C, 80D, savings interest, home loan interest
- Old vs new comparison
- Result screen
- Local-only state

### Phase 2: Accuracy upgrades
- 80GG
- partial-year handling
- optional salary slip expansion
- detailed slab visualization
- suggestion engine

### Phase 3: Polish
- sample result preview on landing
- animated progress states
- accessibility audit
- mobile bottom-sheet preview

## 22. Copy snippets

### Landing headline
Find out which tax regime saves you more money.

### Subheadline
Start from the amount that actually reaches your bank account every month. No CTC confusion.

### Final result
Pick this regime. You save ₹X.

### Support copy
All calculations run in your browser.

## 23. Open questions for implementation

- Should the app support only resident Indians in v1, or expose non-resident handling later?
- Should salary reconstruction be exact-only when TDS is known, or should the app allow range estimates until salary-slip fields are added?
- Should 80GG be visible by default when rent is paid but HRA is absent?
- Should the preview panel show “monthly take-home after tax” or only “annual tax liability” by default?

## 24. Appendix: rules the app must remember

- FY 2025–26 maps to AY 2026–27.
- Old regime and new regime are both valid comparison targets.
- Standard deduction exists in both regimes, but at different amounts.
- HRA and professional tax are old-regime only.
- Employer NPS contribution under 80CCD(2) works in both regimes.
- 80TTA / 80TTB are old-regime features and must not be shown as new-regime deductions.
- Self-occupied home loan interest under 24(b) is old-regime only.
- The app must clearly distinguish between deduction-allowed and deduction-disallowed items.
- The app must not silently assume CTC or gross salary as the starting point.
