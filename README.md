# India Tax Calculator (FY 2025-26) 🇮🇳

A modern, privacy-first, in-browser tax calculator designed for Indian Salaried Employees. This application helps you easily compare the **Old Tax Regime vs New Tax Regime** to find out which one saves you more money. 

Forget complex CTC jargon—this calculator is built around the amount that actually lands in your bank account every month.

## 🌟 Features

* **Privacy First**: Completely serverless. No logins, no database uploads. All calculations happen locally inside your browser.
* **Modern Premium UI**: A clean, distraction-free "Wealthfront-style" interface featuring a beautiful teal & mint color palette with large, soft UI elements.
* **Smart Re-construction**: Starts from your monthly in-hand salary and automatically reconstructs your gross income based on your PF/PT deductions.
* **Guided Wizard**: An intuitive step-by-step form asking plain-language questions (e.g., "Do you pay rent?", "What is your age group?").
* **Live Tax Estimator**: A split-screen layout that updates your estimated tax in real-time as you enter deductions.
* **Detailed Breakdown**: A full side-by-side comparison of standard deductions, HRA exemptions, 80C/80D savings, and the final tax due under both regimes.
* **Personalized Suggestions**: Actionable recommendations on what else you can do to save tax before the financial year ends.

## 🚀 Getting Started

This project is built using [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) for extremely fast performance.

### Prerequisites
* Node.js (v18+ recommended)
* npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/tax-calculator-app.git
   cd tax-calculator-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the local URL provided by Vite (usually `http://localhost:5173`).

## 🛠️ Build for Production

To create a highly optimized production build:

```bash
npm run build
```
This will compile the application into the `dist/` directory, which can be deployed to any static hosting provider (Vercel, Netlify, GitHub Pages, etc.).

## 🧮 How the Engine Works

The core business logic is isolated in `src/taxEngine.js`. 
1. **Gross Salary Reconstruction**: It takes the net monthly in-hand amount and adds back expected cuts (PF, PT, Employer NPS).
2. **Old Regime Flow**: Applies age-based slabs, calculates HRA and 80GG dynamically, deducts 80C, 80D, 24b, applies the 87A rebate if eligible, and calculates final 4% cess.
3. **New Regime Flow**: Applies the FY 2025-26 updated slabs, standard deduction, the new regime 87A rebate, and cess.

## 🎨 Design System

The application uses standard Vanilla CSS to achieve its premium look, keeping dependencies minimal. 
* **Primary Accents**: Teal (`#14B8A6`) 
* **Typography**: `Plus Jakarta Sans`
* Global styles and CSS variables can be easily tweaked in `src/index.css`. Component-specific layouts are located in `src/App.css`.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
