
# US-Tax

A React calculator for determining eligible US mortgage-interest deductions from Form 1098 data. It supports pre-2017 and post-2017 acquisition-debt rules, direct loans, refinances, and first/second loan combinations.

## Features

- Federal and state mortgage-interest limit calculations
- Dynamic refinance loan entry (add as many loans as needed)
- Copyable, line-by-line description text for Drake tax returns
- 3D-style visual summary of outstanding balance and deduction split
- Reserved navigation item for a future loan-limit-days calculator

## Run locally

1. Install [Node.js](https://nodejs.org/) version 20 or newer.
2. In this folder, run `npm install`.
3. Start the application with `npm run dev`.
4. Open the local link shown in the terminal (normally `http://localhost:5173`).

## Build for deployment

Run `npm run build`. The production files will be created in `dist/`.

## GitHub

Create a new GitHub repository called `US-Tax`, then from this project folder run:

```bash
git init
git add .
git commit -m "Initial US-Tax mortgage loan limit calculator"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/US-Tax.git
git push -u origin main
```

## Important

This is a calculation aid. Confirm the applicable tax-year guidance, acquisition-debt rules, refinance tracing, and state requirements before filing.
