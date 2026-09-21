<div align="center">

# 🏛️ US-Tax — Mortgage Limit Studio

### Form 1098 Mortgage Interest Deduction & IRS Publication 936 Calculator

[![Live Application](https://img.shields.io/badge/Live%20Application-ustax--cyan.vercel.app-2563eb?style=for-the-badge&logo=vercel&logoColor=white)](https://ustax-cyan.vercel.app/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![IRS Pub 936](https://img.shields.io/badge/IRS%20Pub-936%20Table%201-10b981?style=for-the-badge&logo=databricks&logoColor=white)](https://www.irs.gov/publications/p936)

<br />

**A fast, compliant calculation engine for determining deductible home mortgage interest under IRC § 163(h), IRS Pub 936 (Table 1 Average Balance Method), and State Conformity rules — with formatted, copyable explanation statements for Drake Tax.**

[🚀 Open Live App](https://ustax-cyan.vercel.app/) • [✨ Features](#-features) • [📐 Calculation Engine](#-calculation-engine-irs-pub-936) • [📋 Drake Tax Integration](#-drake-tax-statement-integration) • [💻 Local Setup](#-getting-started)

---

</div>

## 🌐 Live Application

The application is deployed and available at:

> **🔗 [https://ustax-cyan.vercel.app/](https://ustax-cyan.vercel.app/)**

---

## 📌 Overview

Under the **Tax Cuts and Jobs Act (TCJA)** and **IRS Publication 936**, taxpayers who hold mortgage debt exceeding statutory thresholds ($750,000 for post-2017 debt, $1,000,000 for pre-2017 debt) must limit their deductible mortgage interest on Schedule A (Form 1040). Furthermore, many states (e.g., California, New York) do not conform to the TCJA $750,000 federal cap and retain the legacy $1,000,000 limit, creating a state deduction adjustment.

**US-Tax** streamlines this entire workflow for tax preparers, accountants, and taxpayers by:
1. Calculating average loan balances according to IRS Pub 936 Table 1 methods.
2. Accurately modeling direct loans, sequential refinances, and concurrent 1st/2nd mortgages.
3. Segregating federal allowable interest from state-allowable supplemental deductions.
4. Providing real-time 3D visual debt vs. deduction insights.
5. Generating clean, line-by-line audit-ready justification statements formatted specifically for pasting into Drake Tax return descriptions.

---

## ✨ Features

- **Dual Acquisition Regimes**
  - **Pre-2017**: Grandfathered debt acquired on or before Dec. 15, 2017 ($1,000,000 federal cap).
  - **Post-2017**: TCJA debt acquired after Dec. 15, 2017 ($750,000 federal cap with state gap window).
- **Comprehensive Loan Arrangements**
  - **Direct Loan**: Single ongoing mortgage using `(Beginning + Ending) ÷ 2` average balance.
  - **Refinance**: Sequential replacement loans calculated as `(Σ Average Balances) ÷ 2`, with dynamic loan entry (add as many loans as needed).
  - **1st + 2nd Mortgages**: Concurrent loans calculated as `Σ Average Balances`.
- **IRS Pub 936 4-Phase Calculation Architecture**
  - Robust handling of single-balance entries (start-only or end-only) avoiding inappropriate halving.
  - State conformity logic calculating the non-conforming state benefit gap ($750,000 to $1,000,000).
- **Configurable Percentage Precision**
  - Select between **1, 2, 3, 4, or 5 decimal places** (default: 3 decimals, e.g., `83.333%`).
  - Strict compliance with IRS rounding standards.
- **Drake Software-Ready Explanations**
  - Formats line-by-line descriptions ready to paste into Drake Tax return description screens.
  - Switch between **Simple** and **Detailed** descriptive statements.
  - One-click individual line copy or complete multi-line block copy.
- **Interactive 3D Visualizer**
  - 15° slanted 3D isometric representation of outstanding balances vs statutory caps.
  - Toggle between **Deduction Split** (Federal vs State vs Disallowed) and **Debt Balance Overview**.

---

## 📐 Calculation Engine (IRS Pub 936)

The calculation pipeline follows four distinct mathematical phases defined in `src/utils/calculations.js`:

### Phase 1: Individual Loan Average Balance
| Scenario | Condition | Formula |
|:---|:---|:---|
| **Case 1A** | Both Start & End balances provided | `(Beginning Balance + Ending Balance) ÷ 2` |
| **Case 1B** | Only Beginning balance provided | `Beginning Balance` (full year balance assumed) |
| **Case 1C** | Only Ending balance provided | `Ending Balance` |
| **Case 1D** | No balances provided | `$0.00` fallback |

### Phase 2: Net Outstanding Mortgage Debt
| Structure | Type | Formula |
|:---|:---|:---|
| **Case 2A** | Direct Loan | `Average Balance of Loan 1` |
| **Case 2B** | Refinance | `(Average Balance L1 + Average Balance L2 + ...) ÷ 2` |
| **Case 2C** | 1st & 2nd Loans | `Average Balance L1 + Average Balance L2` |

### Phase 3: Federal Limitation (IRS Table 1)
- **Within Limit** (`Debt ≤ Limit`): `100%` deductible (`Ratio = 1.0`).
- **Over Limit** (`Debt > Limit`):
  $$\text{Federal Ratio} = \text{round}\left(\frac{\text{Federal Cap}}{\text{Net Mortgage}}, \text{decimals}\right) \quad (\text{e.g. } 0.694 \text{ for 3 decimals})$$
  $$\text{Federal Percentage} = \text{Federal Ratio} \times 100 \quad (\text{e.g. } 69.4\%)$$
  $$\text{Federal Deductible} = \text{Federal Ratio} \times \text{Total Form 1098 Interest}$$

### Phase 4: State Conformity & Gap Window
For post-2017 debt in states that retain the $1,000,000 cap:
- **Case 4A** (`Debt ≤ $750,000`): State deductible equals Federal deductible (no adjustment needed).
- **Case 4B (The Gap)** (`$750,000 < Debt ≤ $1,000,000`):
  - Federal interest is limited by the $750K ratio.
  - State allows 100% of the interest.
  - **Additional State Deduction** = `Total Interest - Federal Deductible`.
- **Case 4C** (`Debt > $1,000,000`):
  $$\text{State Ratio} = \text{round}\left(\frac{\$1,000,000}{\text{Net Mortgage}}, \text{decimals}\right) \quad (\text{e.g. } 0.926)$$
  $$\text{State Percentage} = \text{State Ratio} \times 100 \quad (\text{e.g. } 92.6\%)$$
  $$\text{State Total} = \text{State Ratio} \times \text{Total Interest}$$
  $$\text{Additional State Deduction} = \text{State Total} - \text{Federal Deductible}$$

---

## 📋 Drake Tax Statement Integration

US-Tax produces copyable audit lines tailored for Drake Tax Schedule A explanations:

```text
Net Mortgage: $900,000.00
Form 1098 Box 1 Interest: $45,000.00
Federal Limit ($750,000): $750,000.00 ÷ $900,000.00 = 0.833 (83.3%)
Federal Deductible: $45,000.00 × 0.833 (83.3%) = $37,485.00
State Limit ($1,000,000): Within limit (100% eligible)
Additional State Deductible: $45,000.00 − $37,485.00 = $7,515.00
```

Each statement line includes an instant **Copy** button to speed up high-volume tax return data entry.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
|:---|:---|:---|
| **Framework** | [React 19](https://react.dev/) | High-performance reactive UI with modern hooks |
| **Build Tool** | [Vite 7](https://vitejs.dev/) | Next-generation frontend tooling and fast HMR |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first styling system |
| **Calculations** | Pure Vanilla ES Modules | Deterministic, audited tax logic with no external dependencies |
| **Deployment** | [Vercel](https://vercel.com/) | Global edge distribution & automatic CI/CD |

---

## 💻 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) version 20.x or newer
- `npm` (bundled with Node.js)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gpavananithish/ustax.git
   cd ustax
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173/`.

### Production Build

To compile an optimized production bundle:

```bash
npm run build
```

The compiled assets will be placed in the `dist/` directory, ready to preview with:

```bash
npm run preview
```

---

## 📁 Repository Structure

```text
US-Tax/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── public/
│   ├── favicon.svg             # Application logo
│   └── vite.svg
├── src/
│   ├── utils/
│   │   ├── calculations.js     # IRS Pub 936 4-phase calculation engine
│   │   └── formatters.js       # Currency and percentage formatters
│   ├── main.jsx                # Interactive UI and 3D visualizer
│   └── styles.css              # Global styles and Tailwind configuration
├── index.html                  # HTML entry point
├── package.json                # Project dependencies and scripts
├── vite.config.js              # Vite bundler configuration
└── README.md                   # Documentation
```

---

## ⚠️ Compliance Disclaimer

> **Notice**: This tool is an informational calculation aid designed to assist tax professionals and taxpayers. Always verify applicable tax-year regulations, acquisition date documentation, refinance tracing, and specific state conformity statutes prior to filing any federal or state tax returns.

---

<div align="center">

Made for tax practitioners and accountants · **[ustax-cyan.vercel.app](https://ustax-cyan.vercel.app/)**

</div>