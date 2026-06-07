export interface MonthlyData {
  month: string;
  enterpriseRevenue: number;
  retailRevenue: number;
  otherIncome: number;
  totalRevenue: number;
  payroll: number;
  marketing: number;
  infrastructure: number;
  operations: number;
  otherExpenses: number;
  totalExpenses: number;
  pbt: number;
  adjustedProfit: number;
  pbtPercentage: number;
  adjustedProfitPercentage: number;
}

export interface BalanceSheetData {
  month: string;
  cash: number;
  receivables: number;
  inventory: number;
  fixedAssets: number;
  payables: number;
  debt: number;
  equity: number;
}

export const financialData: MonthlyData[] = [
  {
    month: "Jan 25",
    enterpriseRevenue: 136000,
    retailRevenue: 68000,
    otherIncome: 22714,
    totalRevenue: 226714,
    payroll: 112000,
    marketing: 41000,
    infrastructure: 28000,
    operations: 18000,
    otherExpenses: 5947,
    totalExpenses: 204947,
    pbt: 21767,
    adjustedProfit: 21767,
    pbtPercentage: (21767 / 226714) * 100,
    adjustedProfitPercentage: (21767 / 226714) * 100,
  },
  {
    month: "Feb 25",
    enterpriseRevenue: 132000,
    retailRevenue: 66000,
    otherIncome: 23534,
    totalRevenue: 221534,
    payroll: 116000,
    marketing: 42000,
    infrastructure: 30000,
    operations: 19000,
    otherExpenses: 4240,
    totalExpenses: 211240,
    pbt: 10294,
    adjustedProfit: 10294,
    pbtPercentage: (10294 / 221534) * 100,
    adjustedProfitPercentage: (10294 / 221534) * 100,
  },
  {
    month: "Mar 25",
    enterpriseRevenue: 140000,
    retailRevenue: 70000,
    otherIncome: 23676,
    totalRevenue: 233676,
    payroll: 116000,
    marketing: 43000,
    infrastructure: 31000,
    operations: 19000,
    otherExpenses: 3474,
    totalExpenses: 212474,
    pbt: 21201,
    adjustedProfit: 21201,
    pbtPercentage: (21201 / 233676) * 100,
    adjustedProfitPercentage: (21201 / 233676) * 100,
  },
  {
    month: "April 25",
    enterpriseRevenue: 136000,
    retailRevenue: 68000,
    otherIncome: 23781,
    totalRevenue: 227781,
    payroll: 114000,
    marketing: 42000,
    infrastructure: 30000,
    operations: 18000,
    otherExpenses: 4196,
    totalExpenses: 208196,
    pbt: 19585,
    adjustedProfit: 19585,
    pbtPercentage: (19585 / 227781) * 100,
    adjustedProfitPercentage: (19585 / 227781) * 100,
  },
  {
    month: "May 25",
    enterpriseRevenue: 142000,
    retailRevenue: 71000,
    otherIncome: 24804,
    totalRevenue: 237804,
    payroll: 115000,
    marketing: 42000,
    infrastructure: 30000,
    operations: 18000,
    otherExpenses: 4104,
    totalExpenses: 209104,
    pbt: 28700,
    adjustedProfit: 28700,
    pbtPercentage: (28700 / 237804) * 100,
    adjustedProfitPercentage: (28700 / 237804) * 100,
  },
  {
    month: "June 25",
    enterpriseRevenue: 127000,
    retailRevenue: 64000,
    otherIncome: 21908,
    totalRevenue: 212908,
    payroll: 118000,
    marketing: 44000,
    infrastructure: 32000,
    operations: 19000,
    otherExpenses: 2363,
    totalExpenses: 215363,
    pbt: -2455,
    adjustedProfit: -2455,
    pbtPercentage: (-2455 / 212908) * 100,
    adjustedProfitPercentage: (-2455 / 212908) * 100,
  },
  {
    month: "July 25",
    enterpriseRevenue: 142000,
    retailRevenue: 71000,
    otherIncome: 23884,
    totalRevenue: 236884,
    payroll: 114000,
    marketing: 42000,
    infrastructure: 30000,
    operations: 18000,
    otherExpenses: 4631,
    totalExpenses: 208631,
    pbt: 28253,
    adjustedProfit: 28253,
    pbtPercentage: (28253 / 236884) * 100,
    adjustedProfitPercentage: (28253 / 236884) * 100,
  },
];

export const balanceSheetData: BalanceSheetData[] = [
  {
    month: "Jan 25",
    cash: 1855000,
    receivables: 0,
    inventory: 0,
    fixedAssets: 0,
    payables: 0,
    debt: 0,
    equity: 1260000,
  },
  {
    month: "Feb 25",
    cash: 1865000,
    receivables: 0,
    inventory: 0,
    fixedAssets: 0,
    payables: 0,
    debt: 0,
    equity: 1278000,
  },
  {
    month: "Mar 25",
    cash: 1902000,
    receivables: 0,
    inventory: 0,
    fixedAssets: 0,
    payables: 0,
    debt: 0,
    equity: 1314000,
  },
  {
    month: "April 25",
    cash: 1918000,
    receivables: 0,
    inventory: 0,
    fixedAssets: 0,
    payables: 0,
    debt: 0,
    equity: 1331000,
  },
  {
    month: "May 25",
    cash: 1951000,
    receivables: 0,
    inventory: 0,
    fixedAssets: 0,
    payables: 0,
    debt: 0,
    equity: 1375000,
  },
  {
    month: "June 25",
    cash: 1949000,
    receivables: 0,
    inventory: 0,
    fixedAssets: 0,
    payables: 0,
    debt: 0,
    equity: 1369000,
  },
  {
    month: "July 25",
    cash: 1990000,
    receivables: 0,
    inventory: 0,
    fixedAssets: 0,
    payables: 0,
    debt: 0,
    equity: 1426000,
  },
];
