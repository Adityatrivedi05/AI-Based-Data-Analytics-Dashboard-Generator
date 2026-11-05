import { DatasetRow } from './types';

export interface SampleDataset {
  id: string;
  name: string;
  domain: string;
  description: string;
  recommendedGoal: string;
  rows: DatasetRow[];
  headers: string[];
}

// 1. Sales & E-Commerce Dataset
const salesRows: DatasetRow[] = [
  { OrderID: 'ORD-101', Date: '2024-01-05', Region: 'North America', Category: 'Electronics', SubCategory: 'Laptops', CustomerSegment: 'Corporate', Units: 4, Revenue: 4800, Cost: 3200, Profit: 1600, Discount: 0.05 },
  { OrderID: 'ORD-102', Date: '2024-01-12', Region: 'Europe', Category: 'Furniture', SubCategory: 'Chairs', CustomerSegment: 'Consumer', Units: 8, Revenue: 2400, Cost: 1800, Profit: 600, Discount: 0.10 },
  { OrderID: 'ORD-103', Date: '2024-01-20', Region: 'Asia Pacific', Category: 'Electronics', SubCategory: 'Smartphones', CustomerSegment: 'Small Business', Units: 15, Revenue: 11250, Cost: 7500, Profit: 3750, Discount: 0.00 },
  { OrderID: 'ORD-104', Date: '2024-02-02', Region: 'North America', Category: 'Office Supplies', SubCategory: 'Storage', CustomerSegment: 'Consumer', Units: 20, Revenue: 1600, Cost: 900, Profit: 700, Discount: 0.15 },
  { OrderID: 'ORD-105', Date: '2024-02-14', Region: 'Latin America', Category: 'Electronics', SubCategory: 'Accessories', CustomerSegment: 'Consumer', Units: 35, Revenue: 2450, Cost: 1200, Profit: 1250, Discount: 0.00 },
  { OrderID: 'ORD-106', Date: '2024-02-25', Region: 'Europe', Category: 'Electronics', SubCategory: 'Laptops', CustomerSegment: 'Corporate', Units: 6, Revenue: 7500, Cost: 5100, Profit: 2400, Discount: 0.05 },
  { OrderID: 'ORD-107', Date: '2024-03-04', Region: 'North America', Category: 'Furniture', SubCategory: 'Tables', CustomerSegment: 'Small Business', Units: 3, Revenue: 3600, Cost: 2500, Profit: 1100, Discount: 0.20 },
  { OrderID: 'ORD-108', Date: '2024-03-15', Region: 'Asia Pacific', Category: 'Office Supplies', SubCategory: 'Binders', CustomerSegment: 'Corporate', Units: 50, Revenue: 1250, Cost: 600, Profit: 650, Discount: 0.00 },
  { OrderID: 'ORD-109', Date: '2024-03-28', Region: 'Europe', Category: 'Furniture', SubCategory: 'Bookcases', CustomerSegment: 'Consumer', Units: 5, Revenue: 2100, Cost: 1500, Profit: 600, Discount: 0.10 },
  { OrderID: 'ORD-110', Date: '2024-04-03', Region: 'North America', Category: 'Electronics', SubCategory: 'Smartphones', CustomerSegment: 'Corporate', Units: 12, Revenue: 9600, Cost: 6200, Profit: 3400, Discount: 0.05 },
  { OrderID: 'ORD-111', Date: '2024-04-18', Region: 'Latin America', Category: 'Office Supplies', SubCategory: 'Paper', CustomerSegment: 'Small Business', Units: 80, Revenue: 1600, Cost: 800, Profit: 800, Discount: 0.00 },
  { OrderID: 'ORD-112', Date: '2024-04-29', Region: 'Asia Pacific', Category: 'Electronics', SubCategory: 'Laptops', CustomerSegment: 'Consumer', Units: 7, Revenue: 8400, Cost: 5600, Profit: 2800, Discount: 0.00 },
  { OrderID: 'ORD-113', Date: '2024-05-10', Region: 'Europe', Category: 'Furniture', SubCategory: 'Chairs', CustomerSegment: 'Corporate', Units: 14, Revenue: 4200, Cost: 2900, Profit: 1300, Discount: 0.15 },
  { OrderID: 'ORD-114', Date: '2024-05-22', Region: 'North America', Category: 'Electronics', SubCategory: 'Accessories', CustomerSegment: 'Consumer', Units: 40, Revenue: 2800, Cost: 1400, Profit: 1400, Discount: 0.05 },
  { OrderID: 'ORD-115', Date: '2024-06-05', Region: 'Asia Pacific', Category: 'Furniture', SubCategory: 'Tables', CustomerSegment: 'Small Business', Units: 6, Revenue: 6900, Cost: 4800, Profit: 2100, Discount: 0.10 },
  { OrderID: 'ORD-116', Date: '2024-06-19', Region: 'North America', Category: 'Office Supplies', SubCategory: 'Storage', CustomerSegment: 'Corporate', Units: 25, Revenue: 2250, Cost: 1300, Profit: 950, Discount: 0.00 },
  { OrderID: 'ORD-117', Date: '2024-07-02', Region: 'Europe', Category: 'Electronics', SubCategory: 'Smartphones', CustomerSegment: 'Consumer', Units: 10, Revenue: 8000, Cost: 5200, Profit: 2800, Discount: 0.00 },
  { OrderID: 'ORD-118', Date: '2024-07-16', Region: 'Latin America', Category: 'Furniture', SubCategory: 'Chairs', CustomerSegment: 'Consumer', Units: 9, Revenue: 2700, Cost: 1900, Profit: 800, Discount: 0.10 },
  { OrderID: 'ORD-119', Date: '2024-08-01', Region: 'North America', Category: 'Electronics', SubCategory: 'Laptops', CustomerSegment: 'Corporate', Units: 8, Revenue: 10400, Cost: 6800, Profit: 3600, Discount: 0.05 },
  { OrderID: 'ORD-120', Date: '2024-08-18', Region: 'Asia Pacific', Category: 'Office Supplies', SubCategory: 'Paper', CustomerSegment: 'Corporate', Units: 100, Revenue: 2000, Cost: 1000, Profit: 1000, Discount: 0.00 },
  { OrderID: 'ORD-121', Date: '2024-09-04', Region: 'Europe', Category: 'Office Supplies', SubCategory: 'Binders', CustomerSegment: 'Small Business', Units: 45, Revenue: 1350, Cost: 700, Profit: 650, Discount: 0.05 },
  { OrderID: 'ORD-122', Date: '2024-09-21', Region: 'North America', Category: 'Furniture', SubCategory: 'Bookcases', CustomerSegment: 'Consumer', Units: 7, Revenue: 3150, Cost: 2200, Profit: 950, Discount: 0.10 },
  { OrderID: 'ORD-123', Date: '2024-10-09', Region: 'Asia Pacific', Category: 'Electronics', SubCategory: 'Smartphones', CustomerSegment: 'Corporate', Units: 16, Revenue: 12800, Cost: 8400, Profit: 4400, Discount: 0.05 },
  { OrderID: 'ORD-124', Date: '2024-10-25', Region: 'Latin America', Category: 'Electronics', SubCategory: 'Accessories', CustomerSegment: 'Small Business', Units: 30, Revenue: 2100, Cost: 1100, Profit: 1000, Discount: 0.00 },
  { OrderID: 'ORD-125', Date: '2024-11-12', Region: 'Europe', Category: 'Electronics', SubCategory: 'Laptops', CustomerSegment: 'Consumer', Units: 9, Revenue: 11700, Cost: 7800, Profit: 3900, Discount: 0.00 },
  { OrderID: 'ORD-126', Date: '2024-11-28', Region: 'North America', Category: 'Furniture', SubCategory: 'Tables', CustomerSegment: 'Corporate', Units: 5, Revenue: 6250, Cost: 4200, Profit: 2050, Discount: 0.15 },
  { OrderID: 'ORD-127', Date: '2024-12-08', Region: 'Asia Pacific', Category: 'Furniture', SubCategory: 'Chairs', CustomerSegment: 'Consumer', Units: 11, Revenue: 3300, Cost: 2200, Profit: 1100, Discount: 0.00 },
  { OrderID: 'ORD-128', Date: '2024-12-22', Region: 'North America', Category: 'Electronics', SubCategory: 'Smartphones', CustomerSegment: 'Consumer', Units: 18, Revenue: 14400, Cost: 9500, Profit: 4900, Discount: 0.10 },
];

// 2. Marketing & Ads Dataset
const marketingRows: DatasetRow[] = [
  { Campaign: 'Spring Sale 24', Channel: 'Google Ads', Date: '2024-03-01', Device: 'Mobile', Spend: 3400, Impressions: 125000, Clicks: 4800, Conversions: 260, Revenue: 18200 },
  { Campaign: 'Spring Sale 24', Channel: 'Facebook Ads', Date: '2024-03-01', Device: 'Mobile', Spend: 2800, Impressions: 190000, Clicks: 3900, Conversions: 175, Revenue: 12400 },
  { Campaign: 'Spring Sale 24', Channel: 'LinkedIn', Date: '2024-03-01', Device: 'Desktop', Spend: 1900, Impressions: 35000, Clicks: 920, Conversions: 68, Revenue: 8900 },
  { Campaign: 'Brand Awareness Q1', Channel: 'YouTube', Date: '2024-03-05', Device: 'Connected TV', Spend: 4200, Impressions: 380000, Clicks: 2100, Conversions: 95, Revenue: 7600 },
  { Campaign: 'Brand Awareness Q1', Channel: 'Instagram', Date: '2024-03-05', Device: 'Mobile', Spend: 3100, Impressions: 240000, Clicks: 5200, Conversions: 210, Revenue: 14700 },
  { Campaign: 'Retargeting March', Channel: 'Google Ads', Date: '2024-03-10', Device: 'Desktop', Spend: 2100, Impressions: 45000, Clicks: 3100, Conversions: 240, Revenue: 21500 },
  { Campaign: 'Retargeting March', Channel: 'Facebook Ads', Date: '2024-03-10', Device: 'Mobile', Spend: 1800, Impressions: 78000, Clicks: 2400, Conversions: 160, Revenue: 13800 },
  { Campaign: 'Product Launch X', Channel: 'Google Ads', Date: '2024-04-02', Device: 'Mobile', Spend: 5200, Impressions: 210000, Clicks: 7400, Conversions: 390, Revenue: 31200 },
  { Campaign: 'Product Launch X', Channel: 'TikTok', Date: '2024-04-02', Device: 'Mobile', Spend: 3600, Impressions: 420000, Clicks: 9800, Conversions: 285, Revenue: 19900 },
  { Campaign: 'Product Launch X', Channel: 'YouTube', Date: '2024-04-02', Device: 'Desktop', Spend: 4000, Impressions: 290000, Clicks: 3400, Conversions: 140, Revenue: 11200 },
  { Campaign: 'Summer Promo', Channel: 'Google Ads', Date: '2024-05-15', Device: 'Mobile', Spend: 4400, Impressions: 165000, Clicks: 6100, Conversions: 320, Revenue: 24600 },
  { Campaign: 'Summer Promo', Channel: 'Instagram', Date: '2024-05-15', Device: 'Mobile', Spend: 3900, Impressions: 310000, Clicks: 7200, Conversions: 290, Revenue: 21000 },
  { Campaign: 'Summer Promo', Channel: 'TikTok', Date: '2024-05-15', Device: 'Mobile', Spend: 3200, Impressions: 380000, Clicks: 8400, Conversions: 245, Revenue: 17200 },
  { Campaign: 'B2B LeadGen Q2', Channel: 'LinkedIn', Date: '2024-06-01', Device: 'Desktop', Spend: 4800, Impressions: 62000, Clicks: 1450, Conversions: 110, Revenue: 28500 },
  { Campaign: 'B2B LeadGen Q2', Channel: 'Google Ads', Date: '2024-06-01', Device: 'Desktop', Spend: 3500, Impressions: 85000, Clicks: 2900, Conversions: 180, Revenue: 19400 },
  { Campaign: 'Retargeting June', Channel: 'Facebook Ads', Date: '2024-06-18', Device: 'Mobile', Spend: 2300, Impressions: 92000, Clicks: 3300, Conversions: 215, Revenue: 18900 },
  { Campaign: 'Retargeting June', Channel: 'Google Ads', Date: '2024-06-18', Device: 'Desktop', Spend: 2600, Impressions: 54000, Clicks: 3700, Conversions: 270, Revenue: 24100 },
  { Campaign: 'Back to School', Channel: 'Google Ads', Date: '2024-08-05', Device: 'Mobile', Spend: 4900, Impressions: 180000, Clicks: 6900, Conversions: 360, Revenue: 27800 },
  { Campaign: 'Back to School', Channel: 'Instagram', Date: '2024-08-05', Device: 'Mobile', Spend: 4100, Impressions: 330000, Clicks: 7800, Conversions: 310, Revenue: 22400 },
  { Campaign: 'Back to School', Channel: 'TikTok', Date: '2024-08-05', Device: 'Mobile', Spend: 3800, Impressions: 450000, Clicks: 10200, Conversions: 330, Revenue: 23100 },
];

// 3. HR & People Operations Dataset
const hrRows: DatasetRow[] = [
  { EmployeeID: 'EMP-001', Department: 'Engineering', Role: 'Senior Software Engineer', Gender: 'Female', Age: 34, TenureYears: 4.5, Salary: 142000, PerformanceRating: 4.5, Attrition: 'No', OverTime: 'Yes', Education: 'Master' },
  { EmployeeID: 'EMP-002', Department: 'Engineering', Role: 'Staff Engineer', Gender: 'Male', Age: 41, TenureYears: 7.2, Salary: 185000, PerformanceRating: 4.8, Attrition: 'No', OverTime: 'No', Education: 'Master' },
  { EmployeeID: 'EMP-003', Department: 'Sales', Role: 'Account Executive', Gender: 'Male', Age: 29, TenureYears: 2.1, Salary: 88000, PerformanceRating: 3.9, Attrition: 'Yes', OverTime: 'Yes', Education: 'Bachelor' },
  { EmployeeID: 'EMP-004', Department: 'Marketing', Role: 'Growth Marketer', Gender: 'Female', Age: 31, TenureYears: 3.0, Salary: 96000, PerformanceRating: 4.1, Attrition: 'No', OverTime: 'No', Education: 'Bachelor' },
  { EmployeeID: 'EMP-005', Department: 'Product', Role: 'Product Manager', Gender: 'Female', Age: 36, TenureYears: 5.0, Salary: 155000, PerformanceRating: 4.6, Attrition: 'No', OverTime: 'No', Education: 'MBA' },
  { EmployeeID: 'EMP-006', Department: 'Engineering', Role: 'Frontend Engineer', Gender: 'Non-binary', Age: 26, TenureYears: 1.5, Salary: 110000, PerformanceRating: 3.8, Attrition: 'No', OverTime: 'No', Education: 'Bachelor' },
  { EmployeeID: 'EMP-007', Department: 'Sales', Role: 'Sales Director', Gender: 'Female', Age: 46, TenureYears: 8.5, Salary: 195000, PerformanceRating: 4.7, Attrition: 'No', OverTime: 'Yes', Education: 'Bachelor' },
  { EmployeeID: 'EMP-008', Department: 'Customer Support', Role: 'Support Specialist', Gender: 'Male', Age: 24, TenureYears: 1.0, Salary: 52000, PerformanceRating: 3.5, Attrition: 'Yes', OverTime: 'Yes', Education: 'Associate' },
  { EmployeeID: 'EMP-009', Department: 'Customer Support', Role: 'Support Lead', Gender: 'Female', Age: 32, TenureYears: 4.0, Salary: 74000, PerformanceRating: 4.2, Attrition: 'No', OverTime: 'No', Education: 'Bachelor' },
  { EmployeeID: 'EMP-010', Department: 'Human Resources', Role: 'People Partner', Gender: 'Female', Age: 38, TenureYears: 6.0, Salary: 105000, PerformanceRating: 4.3, Attrition: 'No', OverTime: 'No', Education: 'Master' },
  { EmployeeID: 'EMP-011', Department: 'Engineering', Role: 'Backend Engineer', Gender: 'Male', Age: 28, TenureYears: 2.5, Salary: 125000, PerformanceRating: 4.0, Attrition: 'No', OverTime: 'No', Education: 'Bachelor' },
  { EmployeeID: 'EMP-012', Department: 'Engineering', Role: 'DevOps Engineer', Gender: 'Male', Age: 35, TenureYears: 3.8, Salary: 138000, PerformanceRating: 4.2, Attrition: 'Yes', OverTime: 'Yes', Education: 'Bachelor' },
  { EmployeeID: 'EMP-013', Department: 'Finance', Role: 'Senior Financial Analyst', Gender: 'Female', Age: 33, TenureYears: 4.2, Salary: 118000, PerformanceRating: 4.4, Attrition: 'No', OverTime: 'No', Education: 'Master' },
  { EmployeeID: 'EMP-014', Department: 'Sales', Role: 'Sales Development Rep', Gender: 'Male', Age: 23, TenureYears: 0.8, Salary: 58000, PerformanceRating: 3.6, Attrition: 'Yes', OverTime: 'Yes', Education: 'Bachelor' },
  { EmployeeID: 'EMP-015', Department: 'Product', Role: 'Product Designer', Gender: 'Female', Age: 29, TenureYears: 2.8, Salary: 115000, PerformanceRating: 4.4, Attrition: 'No', OverTime: 'No', Education: 'Bachelor' },
  { EmployeeID: 'EMP-016', Department: 'Engineering', Role: 'Engineering Manager', Gender: 'Female', Age: 42, TenureYears: 7.0, Salary: 210000, PerformanceRating: 4.9, Attrition: 'No', OverTime: 'No', Education: 'Master' },
  { EmployeeID: 'EMP-017', Department: 'Finance', Role: 'Finance Director', Gender: 'Male', Age: 49, TenureYears: 9.5, Salary: 205000, PerformanceRating: 4.6, Attrition: 'No', OverTime: 'No', Education: 'CPA' },
  { EmployeeID: 'EMP-018', Department: 'Marketing', Role: 'Content Strategist', Gender: 'Female', Age: 30, TenureYears: 2.2, Salary: 85000, PerformanceRating: 3.9, Attrition: 'No', OverTime: 'No', Education: 'Bachelor' },
  { EmployeeID: 'EMP-019', Department: 'Customer Support', Role: 'Support Specialist', Gender: 'Female', Age: 25, TenureYears: 1.2, Salary: 54000, PerformanceRating: 3.7, Attrition: 'No', OverTime: 'Yes', Education: 'Bachelor' },
  { EmployeeID: 'EMP-020', Department: 'Sales', Role: 'Account Executive', Gender: 'Female', Age: 31, TenureYears: 3.5, Salary: 94000, PerformanceRating: 4.2, Attrition: 'No', OverTime: 'No', Education: 'Bachelor' },
];

// 4. Finance & Corporate Expenses Dataset
const financeRows: DatasetRow[] = [
  { InvoiceID: 'INV-401', Date: '2024-01-15', Department: 'Engineering', ExpenseCategory: 'Cloud Infrastructure', Vendor: 'AWS Web Services', Amount: 14200, Budget: 15000, PaymentStatus: 'Paid', Quarter: 'Q1' },
  { InvoiceID: 'INV-402', Date: '2024-01-22', Department: 'Marketing', ExpenseCategory: 'Advertising', Vendor: 'Google Ads', Amount: 8500, Budget: 8000, PaymentStatus: 'Paid', Quarter: 'Q1' },
  { InvoiceID: 'INV-403', Date: '2024-02-05', Department: 'Sales', ExpenseCategory: 'Client Entertainment', Vendor: 'Marriott Hotels', Amount: 3200, Budget: 3500, PaymentStatus: 'Paid', Quarter: 'Q1' },
  { InvoiceID: 'INV-404', Date: '2024-02-18', Department: 'Operations', ExpenseCategory: 'Office Rent & Facilities', Vendor: 'WeWork Global', Amount: 12000, Budget: 12000, PaymentStatus: 'Paid', Quarter: 'Q1' },
  { InvoiceID: 'INV-405', Date: '2024-03-02', Department: 'Engineering', ExpenseCategory: 'Software Subscriptions', Vendor: 'GitHub Enterprise', Amount: 4800, Budget: 5000, PaymentStatus: 'Paid', Quarter: 'Q1' },
  { InvoiceID: 'INV-406', Date: '2024-03-19', Department: 'Human Resources', ExpenseCategory: 'Recruiting Services', Vendor: 'LinkedIn Talent', Amount: 6400, Budget: 6000, PaymentStatus: 'Paid', Quarter: 'Q1' },
  { InvoiceID: 'INV-407', Date: '2024-04-10', Department: 'Engineering', ExpenseCategory: 'Cloud Infrastructure', Vendor: 'Google Cloud Platform', Amount: 11500, Budget: 12000, PaymentStatus: 'Paid', Quarter: 'Q2' },
  { InvoiceID: 'INV-408', Date: '2024-04-24', Department: 'Marketing', ExpenseCategory: 'Advertising', Vendor: 'Meta Business', Amount: 7800, Budget: 7500, PaymentStatus: 'Paid', Quarter: 'Q2' },
  { InvoiceID: 'INV-409', Date: '2024-05-08', Department: 'Sales', ExpenseCategory: 'Travel & Lodging', Vendor: 'Delta Airlines', Amount: 4100, Budget: 4000, PaymentStatus: 'Paid', Quarter: 'Q2' },
  { InvoiceID: 'INV-410', Date: '2024-05-20', Department: 'Operations', ExpenseCategory: 'Hardware & IT Gear', Vendor: 'Apple Store for Business', Amount: 9600, Budget: 10000, PaymentStatus: 'Paid', Quarter: 'Q2' },
  { InvoiceID: 'INV-411', Date: '2024-06-03', Department: 'Engineering', ExpenseCategory: 'Cloud Infrastructure', Vendor: 'AWS Web Services', Amount: 15800, Budget: 15500, PaymentStatus: 'Paid', Quarter: 'Q2' },
  { InvoiceID: 'INV-412', Date: '2024-06-18', Department: 'Human Resources', ExpenseCategory: 'Employee Perks & Training', Vendor: 'Coursera Enterprise', Amount: 3800, Budget: 4000, PaymentStatus: 'Paid', Quarter: 'Q2' },
  { InvoiceID: 'INV-413', Date: '2024-07-09', Department: 'Marketing', ExpenseCategory: 'Events & Conferences', Vendor: 'SaaStr Annual', Amount: 16500, Budget: 15000, PaymentStatus: 'Pending', Quarter: 'Q3' },
  { InvoiceID: 'INV-414', Date: '2024-07-25', Department: 'Engineering', ExpenseCategory: 'Cloud Infrastructure', Vendor: 'Datadog Monitoring', Amount: 5200, Budget: 5000, PaymentStatus: 'Paid', Quarter: 'Q3' },
  { InvoiceID: 'INV-415', Date: '2024-08-11', Department: 'Sales', ExpenseCategory: 'Software Subscriptions', Vendor: 'Salesforce CRM', Amount: 13200, Budget: 13000, PaymentStatus: 'Paid', Quarter: 'Q3' },
  { InvoiceID: 'INV-416', Date: '2024-08-28', Department: 'Operations', ExpenseCategory: 'Legal & Compliance', Vendor: 'Latham & Watkins', Amount: 18000, Budget: 20000, PaymentStatus: 'Paid', Quarter: 'Q3' },
  { InvoiceID: 'INV-417', Date: '2024-09-14', Department: 'Engineering', ExpenseCategory: 'Cloud Infrastructure', Vendor: 'AWS Web Services', Amount: 16200, Budget: 16000, PaymentStatus: 'Paid', Quarter: 'Q3' },
  { InvoiceID: 'INV-418', Date: '2024-09-30', Department: 'Human Resources', ExpenseCategory: 'Healthcare & Wellness', Vendor: 'Cigna Health', Amount: 24500, Budget: 24000, PaymentStatus: 'Paid', Quarter: 'Q3' },
];

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'sales-ecommerce',
    name: 'Global E-Commerce Sales',
    domain: 'Sales & E-Commerce',
    description: 'Order transactions across regions, product categories, revenue, profit, and customer segments.',
    recommendedGoal: 'Analyze regional profitability, identify high-margin product categories, and evaluate discount impact.',
    rows: salesRows,
    headers: Object.keys(salesRows[0]),
  },
  {
    id: 'marketing-ads',
    name: 'Omnichannel Marketing Campaigns',
    domain: 'Marketing & Advertising',
    description: 'Ad performance across Google, Meta, TikTok, and LinkedIn tracking spend, clicks, conversions, and revenue.',
    recommendedGoal: 'Maximize Return on Ad Spend (ROAS), pinpoint top-performing acquisition channels, and optimize device conversions.',
    rows: marketingRows,
    headers: Object.keys(marketingRows[0]),
  },
  {
    id: 'hr-workforce',
    name: 'HR Workforce & Retention',
    domain: 'Human Resources & People Ops',
    description: 'Employee demographics, compensation, performance reviews, tenure, overtime, and turnover statistics.',
    recommendedGoal: 'Diagnose attrition drivers, review department pay equity, and track high-performer overtime load.',
    rows: hrRows,
    headers: Object.keys(hrRows[0]),
  },
  {
    id: 'finance-expenses',
    name: 'Corporate Budget vs Actual Expenses',
    domain: 'Finance & Expense Operations',
    description: 'Departmental operating expenses, vendor spending, quarterly variance against budget, and payment status.',
    recommendedGoal: 'Track budget variances by department, control vendor concentration, and audit top operational cost drivers.',
    rows: financeRows,
    headers: Object.keys(financeRows[0]),
  },
];
