/**
 * Comprehensive Glossary of Financial, Underwriting, Legal, Statutory, and Institutional Terms
 * Used across the Argus Acquisition Intelligence Platform.
 * Designed for user clarity with plain-English explanations, statutory formulas, and contextual tips.
 */

export type GlossaryCategory =
  | "UNDERWRITING_FINANCE"
  | "LEGAL_STATUTORY"
  | "INSTITUTIONAL_TITANS"
  | "TAX_ALPHA"
  | "COMPLIANCE_OPERATIONS";

export interface GlossaryTerm {
  id: string;
  name: string;
  shortName: string;
  category: GlossaryCategory;
  categoryLabel: string;
  simpleDefinition: string;
  formulaOrRule?: string;
  whyItMatters: string;
  idealRange?: string;
  example?: string;
  statuteCitation?: string;
}

export const GLOSSARY_TERMS: Record<string, GlossaryTerm> = {
  DSCR: {
    id: "DSCR",
    name: "Debt Service Coverage Ratio (DSCR)",
    shortName: "DSCR",
    category: "UNDERWRITING_FINANCE",
    categoryLabel: "Underwriting & Finance",
    simpleDefinition:
      "A measure of whether a business produces enough cash profit to comfortably pay its required loan payments each year.",
    formulaOrRule: "DSCR = Annual Net Cash Flow / Annual Principal & Interest Debt Service",
    whyItMatters:
      "Lenders and investors use DSCR to make sure the business won't go bankrupt if revenue dips. A ratio below 1.0x means the business doesn't make enough cash to pay its debt.",
    idealRange: ">= 1.25x (SBA Minimum Floor), >= 1.35x (Principal Mandate Target)",
    example: "If a business generates $250,000 cash flow and has $100,000 in loan payments, DSCR is 2.50x (very safe).",
    statuteCitation: "SBA SOP 50 10 8.1",
  },

  BASE_DSCR: {
    id: "BASE_DSCR",
    name: "Base DSCR (Post-GM Deduction)",
    shortName: "Base DSCR",
    category: "UNDERWRITING_FINANCE",
    categoryLabel: "Underwriting & Finance",
    simpleDefinition:
      "The true cash coverage ratio calculated after deducting an $85,000/year salary for a replacement General Manager.",
    formulaOrRule: "Base DSCR = (Reported Cash Flow - $85,000 GM Salary) / Annual Senior Debt Service",
    whyItMatters:
      "Many small business owners work 50+ hours a week for free. Deducting a realistic replacement manager salary prevents buying a business that only looks profitable because the owner worked unpaid overtime.",
    idealRange: ">= 1.35x post-GM deduction",
    example: "A company with $200,000 EBITDA and $80,000 debt service has a Base DSCR of ($200k - $85k) / $80k = 1.44x.",
    statuteCitation: "Principal Investment Mandate Rule 3.2",
  },

  STRESS_DSCR: {
    id: "STRESS_DSCR",
    name: "Stressed DSCR (Macro Downside Shock)",
    shortName: "Stress DSCR",
    category: "UNDERWRITING_FINANCE",
    categoryLabel: "Underwriting & Finance",
    simpleDefinition:
      "A recession stress-test checking if the business remains solvent if revenue suddenly drops by 15% while bank interest rates rise by 2.0% (200 bps).",
    formulaOrRule: "Stress DSCR = (EBITDA * 0.85 - Capex - Taxes) / (Debt Service at Base Rate + 2.00%)",
    whyItMatters:
      "Guarantees the family office will not need to make emergency capital injections during an economic downturn or rate hike.",
    idealRange: ">= 1.15x under concurrent revenue compression and rate shock",
    example: "If Base DSCR is 1.45x, a stress-test might bring it down to 1.19x, which still safely passes the 1.15x floor.",
    statuteCitation: "Aladdin Risk Management Protocol",
  },

  ASKING_BASIS: {
    id: "ASKING_BASIS",
    name: "Asking / Cure Payoff Basis",
    shortName: "Asking / Basis",
    category: "UNDERWRITING_FINANCE",
    categoryLabel: "Underwriting & Finance",
    simpleDefinition:
      "The total purchase price or delinquent loan cure amount required to acquire or clear the asset from foreclosure.",
    formulaOrRule: "Cure Basis = Defaulted Senior Principal + Accrued Default Interest + Legal Fees + Unpaid Taxes",
    whyItMatters:
      "Represents the true initial check size needed to assume control or halt a Substitute Trustee auction.",
    idealRange: "<= $5,000,000 (Mandate In-Box), <= $5,750,000 (Near-Miss Band)",
    example: "A commercial warehouse with a $2.5M assessed value might have a cure basis of only $1.4M in delinquent notes.",
  },

  BASIS_RATIO: {
    id: "BASIS_RATIO",
    name: "Basis-to-Replacement Value Ratio",
    shortName: "Basis Ratio",
    category: "UNDERWRITING_FINANCE",
    categoryLabel: "Underwriting & Finance",
    simpleDefinition:
      "The percentage comparing the acquisition price against the true physical replacement or assessed value of the real estate.",
    formulaOrRule: "Basis Ratio = Total All-In Acquisition Cost / County Assessed Real Estate Value",
    whyItMatters:
      "Ensures the Principal always buys with an equity cushion of at least 30%, guaranteeing immediate downside asset protection.",
    idealRange: "<= 70.0% of assessed value (Code of Virginia § 55.1-321 compliance threshold)",
    example: "Paying $1,400,000 for a property assessed at $2,000,000 equals a 70% basis ratio (30% instant discount).",
    statuteCitation: "Va. Code § 55.1-321",
  },

  COLLATERAL_FLOOR: {
    id: "COLLATERAL_FLOOR",
    name: "Collateral Liquidation Floor (FLV)",
    shortName: "Collateral Floor",
    category: "UNDERWRITING_FINANCE",
    categoryLabel: "Underwriting & Finance",
    simpleDefinition:
      "The worst-case estimated cash that would be recovered if the physical land, buildings, and machinery had to be auctioned off tomorrow.",
    formulaOrRule: "FLV = (Land * 80%) + (Building * 65%) + (Machinery Quick-Sale Value * 50%)",
    whyItMatters:
      "Provides hard downside capital preservation. If the liquidation floor exceeds the purchase loan, the investment has zero principal risk.",
    idealRange: "FLV >= 100% of senior loan amount",
    example: "If a loan is $1.2M and the hard auction floor of the building is $1.6M, downside coverage is 133%.",
  },

  SDE: {
    id: "SDE",
    name: "Seller's Discretionary Earnings (SDE)",
    shortName: "SDE",
    category: "UNDERWRITING_FINANCE",
    categoryLabel: "Underwriting & Finance",
    simpleDefinition:
      "The full financial benefit a single owner-operator receives from the business in a year, including salary, perks, and net profit.",
    formulaOrRule: "SDE = Net Profit + Owner Salary + Discretionary Perks + Interest + Depreciation",
    whyItMatters:
      "Standard valuation metric for small businesses (<$1M EBITDA). It shows total available cash to support the owner and debt service.",
    idealRange: "$250,000 - $1,500,000 annually",
    example: "A company with $80,000 tax profit, $100,000 owner salary, and $20,000 vehicle perks has an SDE of $200,000.",
  },

  EBITDA: {
    id: "EBITDA",
    name: "EBITDA (Normalized Operating Profit)",
    shortName: "EBITDA",
    category: "UNDERWRITING_FINANCE",
    categoryLabel: "Underwriting & Finance",
    simpleDefinition:
      "Operating earnings before subtracting interest expenses, income taxes, depreciation, and amortization.",
    formulaOrRule: "EBITDA = Operating Income + Depreciation Expense + Amortization Expense",
    whyItMatters:
      "The universal institutional benchmark for business profitability, stripping out financing decisions and accounting conventions.",
    idealRange: "$300,000 - $2,000,000 for mid-market brick-and-mortar targets",
  },

  REPLACEMENT_GM_SALARY: {
    id: "REPLACEMENT_GM_SALARY",
    name: "Mandatory Replacement GM Deduction",
    shortName: "$85k GM Ded.",
    category: "UNDERWRITING_FINANCE",
    categoryLabel: "Underwriting & Finance",
    simpleDefinition:
      "A mandatory $85,000/year expense deducted from earnings whenever the existing owner works more than 20 hours per week.",
    formulaOrRule: "Normalized Cash Flow = Reported SDE - $85,000 Replacement GM Salary",
    whyItMatters:
      "Prevents overpaying for a business where the outgoing owner's 60-hour work week disguised the need to hire a full-time manager.",
    idealRange: "Strict invariant: $85,000/year applied to every active owner deal",
  },

  NWC_PEG: {
    id: "NWC_PEG",
    name: "Net Working Capital (NWC) Peg",
    shortName: "NWC Peg",
    category: "UNDERWRITING_FINANCE",
    categoryLabel: "Underwriting & Finance",
    simpleDefinition:
      "The exact dollar amount of cash, accounts receivable, and inventory the seller is legally obligated to leave in the business at closing.",
    formulaOrRule: "NWC Peg = 12-Month Average Current Assets (ex-cash) - Current Liabilities (ex-debt)",
    whyItMatters:
      "Prevents the seller from draining all inventory and bank accounts right before handover, forcing the buyer to inject emergency cash.",
    idealRange: "Pegged to the trailing 12-month rolling median",
  },

  QOE: {
    id: "QOE",
    name: "Quality of Earnings (QoE) Audit",
    shortName: "QoE Audit",
    category: "UNDERWRITING_FINANCE",
    categoryLabel: "Underwriting & Finance",
    simpleDefinition:
      "An independent forensic CPA investigation verifying whether reported earnings are real, sustainable, and free of accounting tricks.",
    formulaOrRule: "Mandatory third-party CPA review triggered when SBA senior debt >= $3,000,000 net of real estate",
    whyItMatters:
      "Uncovers phantom customers, uncollected invoices, under-reported expenses, and unproven lifestyle add-backs before funds are wired.",
    statuteCitation: "SBA SOP 50 10 8.1 Section 5.3",
  },

  SBA_SOP_50_10_8_1: {
    id: "SBA_SOP_50_10_8_1",
    name: "SBA SOP 50 10 8.1 (Effective Oct 1, 2026)",
    shortName: "SBA SOP 50 10 8.1",
    category: "LEGAL_STATUTORY",
    categoryLabel: "Legal & Statutory",
    simpleDefinition:
      "The federal regulations governing government-guaranteed small business acquisition loans (SBA 7(a) and 504 loans).",
    formulaOrRule: "Mandatory: >= 10% equity injection; seller notes capped at <= 50% of injection; buyer unborrowed cash >= 5%",
    whyItMatters:
      "Provides low-cost, 10-to-25 year amortizing senior financing. Failure to strictly follow SOP rules voids government loan approval.",
    idealRange: "100% compliance required across all 5 underwriting gates",
    statuteCitation: "13 C.F.R. § 120 / SBA SOP 50 10 8.1",
  },

  LIMITED_EQUITY_CAP: {
    id: "LIMITED_EQUITY_CAP",
    name: "Limited Equity Cap (<= 50% of Injection)",
    shortName: "50% Limited Equity Cap",
    category: "LEGAL_STATUTORY",
    categoryLabel: "Legal & Statutory",
    simpleDefinition:
      "Under SBA rules, seller notes on full standby can cover at most half of the required 10% equity injection.",
    formulaOrRule: "Max Seller Standby Allowed = 50.0% of Required Equity Injection",
    whyItMatters:
      "Forces the buyer to have real 'skin in the game' by putting in their own unborrowed cash.",
    idealRange: "Seller standby note <= 5.0% of total project cost",
    statuteCitation: "SBA SOP 50 10 8.1",
  },

  UNBORROWED_CASH_FLOOR: {
    id: "UNBORROWED_CASH_FLOOR",
    name: "Buyer Minimum Unborrowed Cash Floor (>= 5%)",
    shortName: "5% Buyer Cash Floor",
    category: "LEGAL_STATUTORY",
    categoryLabel: "Legal & Statutory",
    simpleDefinition:
      "The buyer must personally inject at least 5% of the total acquisition cost in unborrowed, verified cash.",
    formulaOrRule: "Buyer Cash >= Total Project Cost * 0.0500",
    whyItMatters:
      "SBA lenders will immediately reject any deal where 100% of the down payment is borrowed or funded by seller debt.",
    idealRange: ">= 5.00% of project cost in cash",
    statuteCitation: "SBA SOP 50 10 8.1",
  },

  SELLER_STANDBY_NOTE: {
    id: "SELLER_STANDBY_NOTE",
    name: "36-Month Full Standby Seller Note",
    shortName: "36m Standby Lock",
    category: "LEGAL_STATUTORY",
    categoryLabel: "Legal & Statutory",
    simpleDefinition:
      "A loan from the seller where they agree to receive zero principal payments for at least 3 years after the sale.",
    formulaOrRule: "Mandatory Standby Lock Period >= 36 Months",
    whyItMatters:
      "Gives the buyer 3 years of cash flow cushion to stabilize and grow the company before paying the seller back.",
    idealRange: ">= 36 months standby required to count towards equity",
    statuteCitation: "SBA SOP 50 10 8.1",
  },

  SELLER_CONSULTING_CAP: {
    id: "SELLER_CONSULTING_CAP",
    name: "Seller Consulting Transition Cap (<= 24m)",
    shortName: "<= 24m Seller Cap",
    category: "LEGAL_STATUTORY",
    categoryLabel: "Legal & Statutory",
    simpleDefinition:
      "The outgoing owner can remain as an advisor or consultant for a maximum of 24 months after the transaction.",
    formulaOrRule: "Seller Consulting Contract Duration <= 24 Months",
    whyItMatters:
      "SBA regulations prohibit the previous owner from maintaining ongoing control or ownership of the business after selling.",
    idealRange: "6 to 12 months ideal; 24 months legal maximum",
    statuteCitation: "SBA SOP 50 10 8.1",
  },

  VA_CODE_55_1_321: {
    id: "VA_CODE_55_1_321",
    name: "Virginia Foreclosure Notice (§ 55.1-321)",
    shortName: "Va. Code § 55.1-321",
    category: "LEGAL_STATUTORY",
    categoryLabel: "Legal & Statutory",
    simpleDefinition:
      "Virginia state law requiring lenders to give property owners at least 14 days written notice before auctioning real estate.",
    formulaOrRule: "Notice Lead Days = Foreclosure Sale Date - Notice Service Date >= 14 Days",
    whyItMatters:
      "If a substitute trustee serves notice with fewer than 14 days, the foreclosure sale is legally void and title will be uninsurable.",
    idealRange: ">= 14 calendar days required by statute",
    statuteCitation: "Code of Virginia § 55.1-321",
  },

  SUBSTITUTE_TRUSTEE_SALE: {
    id: "SUBSTITUTE_TRUSTEE_SALE",
    name: "Substitute Trustee Foreclosure Sale",
    shortName: "Trustee Sale",
    category: "LEGAL_STATUTORY",
    categoryLabel: "Legal & Statutory",
    simpleDefinition:
      "In Virginia, a non-judicial foreclosure auction executed by a designated trustee without needing a court lawsuit.",
    formulaOrRule: "Conducted under Virginia Code §§ 55.1-320 to 55.1-322",
    whyItMatters:
      "Allows purchasing distressed commercial real estate directly on the courthouse steps or via pre-auction note acquisition.",
    statuteCitation: "Code of Virginia § 55.1-320",
  },

  TACS_TAX_SALE: {
    id: "TACS_TAX_SALE",
    name: "TACS Judicial Tax Auction",
    shortName: "TACS Tax Sale",
    category: "LEGAL_STATUTORY",
    categoryLabel: "Legal & Statutory",
    simpleDefinition:
      "A court-supervised auction to sell properties whose owners have failed to pay local real estate taxes for over 2–3 years.",
    formulaOrRule: "Conducted under Virginia Code § 58.1-3965 by Taxing Authority Consulting Services",
    whyItMatters:
      "Judicial sales extinguish prior private mortgages and junior liens, delivering clean, marketable title to the buyer.",
    statuteCitation: "Code of Virginia § 58.1-3965",
  },

  BANKRUPTCY_363: {
    id: "BANKRUPTCY_363",
    name: "Bankruptcy § 363 Asset Sale",
    shortName: "Ch. 11 § 363 Sale",
    category: "LEGAL_STATUTORY",
    categoryLabel: "Legal & Statutory",
    simpleDefinition:
      "An auction inside federal bankruptcy court where business assets are sold 'free and clear' of all previous debt and lawsuits.",
    formulaOrRule: "11 U.S.C. § 363 Court Order granting ownership free and clear of successor liabilities",
    whyItMatters:
      "The safest legal way to acquire a distressed operating business without inheriting its previous unpaid debts or pending lawsuits.",
    statuteCitation: "11 U.S.C. § 363",
  },

  IRS_120_DAY_REDEMPTION: {
    id: "IRS_120_DAY_REDEMPTION",
    name: "IRS 120-Day Right of Redemption (26 U.S.C. § 7425)",
    shortName: "IRS 120d Clock",
    category: "LEGAL_STATUTORY",
    categoryLabel: "Legal & Statutory",
    simpleDefinition:
      "If the IRS had a recorded tax lien on a foreclosed property, the federal government has 120 days after the auction to buy it back.",
    formulaOrRule: "IRS Redemption Clock = Sale Date + 120 Days (26 U.S.C. § 7425(d))",
    whyItMatters:
      "Title companies will not issue a clean title policy during these 120 days unless an indemnity escrow holdback is deposited.",
    idealRange: "Escrow holdback equal to IRS lien amount or formal IRS Form 14135 release waiver",
    statuteCitation: "26 U.S.C. § 7425(d)",
  },

  TITLE_CURATIVE_HOLDBACK: {
    id: "TITLE_CURATIVE_HOLDBACK",
    name: "Title Curative Escrow Holdback",
    shortName: "Curative Holdback",
    category: "LEGAL_STATUTORY",
    categoryLabel: "Legal & Statutory",
    simpleDefinition:
      "Funds held in an attorney escrow account at closing to pay off or resolve clouded liens, mechanic's liens, or IRS redemption claims.",
    formulaOrRule: "Holdback Amount = Total Unresolved Priority Encumbrances + 15% Contingency",
    whyItMatters:
      "Protects the buyer from paying off debts that the seller was legally responsible for clearing.",
  },

  SECTION_1031_EXCHANGE: {
    id: "SECTION_1031_EXCHANGE",
    name: "IRC § 1031 Like-Kind Tax Deferral",
    shortName: "§ 1031 Exchange",
    category: "TAX_ALPHA",
    categoryLabel: "Tax Alpha & Depreciation",
    simpleDefinition:
      "A tax rule allowing real estate investors to defer paying all capital gains taxes when selling a property if they reinvest into another one.",
    formulaOrRule: "Requires Qualified Intermediary (QI); 45-day ID window; 180-day closing window",
    whyItMatters:
      "Saves up to 29.55% in combined federal and Virginia capital gains taxes, keeping 100% of profits working in the portfolio.",
    idealRange: "Redeploy 100% of net equity proceeds into equal or greater value property",
    statuteCitation: "26 U.S.C. § 1031",
  },

  ID_WINDOW_45_DAY: {
    id: "ID_WINDOW_45_DAY",
    name: "Statutory 45-Day Identification Window",
    shortName: "45-Day ID Clock",
    category: "TAX_ALPHA",
    categoryLabel: "Tax Alpha & Depreciation",
    simpleDefinition:
      "The strict statutory deadline requiring the buyer to formally submit in writing up to 3 replacement properties within 45 days of selling.",
    formulaOrRule: "Deadline = Sale Closing Date + 45 Calendar Days (Midnight deadline)",
    whyItMatters:
      "Missing this deadline by even one minute completely disqualifies the exchange, triggering immediate taxation on the full capital gain.",
    statuteCitation: "Treas. Reg. § 1.1031(k)-1(b)",
  },

  CLOSE_WINDOW_180_DAY: {
    id: "CLOSE_WINDOW_180_DAY",
    name: "Statutory 180-Day Exchange Closing Window",
    shortName: "180-Day Close Clock",
    category: "TAX_ALPHA",
    categoryLabel: "Tax Alpha & Depreciation",
    simpleDefinition:
      "The statutory deadline to finish acquiring and close escrow on the identified replacement property within 180 days of the original sale.",
    formulaOrRule: "Deadline = Sale Closing Date + 180 Calendar Days",
    whyItMatters:
      "All funds must be wired and deeds recorded before day 180 to preserve tax-deferred status.",
    statuteCitation: "26 U.S.C. § 1031(a)(3)",
  },

  MACRS_COST_SEGREGATION: {
    id: "MACRS_COST_SEGREGATION",
    name: "MACRS Cost Segregation Study",
    shortName: "Cost Segregation",
    category: "TAX_ALPHA",
    categoryLabel: "Tax Alpha & Depreciation",
    simpleDefinition:
      "An engineering study that separates a building's cost into carpets, wiring, plumbing, and parking lots to write them off in 5 or 15 years instead of 39 years.",
    formulaOrRule: "Decomposes basis into 5-Year (personal property), 15-Year (land improvements), and 39-Year (structural core)",
    whyItMatters:
      "Creates massive Year 1 tax deductions that shield ordinary business income from federal and state taxes.",
    idealRange: "Reclassify 25% to 35% of total depreciable building basis",
    statuteCitation: "26 U.S.C. § 168(k)",
  },

  BONUS_DEPRECIATION: {
    id: "BONUS_DEPRECIATION",
    name: "Bonus Depreciation (IRC § 168(k))",
    shortName: "Bonus Depr. (60%)",
    category: "TAX_ALPHA",
    categoryLabel: "Tax Alpha & Depreciation",
    simpleDefinition:
      "A federal tax incentive allowing buyers to immediately deduct 60% of the cost of qualifying equipment and land improvements in Year 1.",
    formulaOrRule: "Deduction = Qualifying Asset Basis * 60.0% Statutory Rate",
    whyItMatters:
      "Generates immediate six-figure cash tax savings during the first year of ownership, boosting cash reserves.",
    idealRange: "60% bonus rate under current tax law",
    statuteCitation: "26 U.S.C. § 168(k)",
  },

  GOLDMAN_SECDB_DAG: {
    id: "GOLDMAN_SECDB_DAG",
    name: "Goldman Sachs SecDB / Athena Reactive DAG",
    shortName: "Reactive DAG",
    category: "INSTITUTIONAL_TITANS",
    categoryLabel: "Institutional Titan Suite",
    simpleDefinition:
      "A reactive graph calculation engine modeled on Goldman Sachs' SecDB and J.P. Morgan's Athena, recalculating only numbers that changed in microseconds.",
    formulaOrRule: "Kahn's Topological Sort with Forward Dirty Mark Invalidation (<50μs evaluation)",
    whyItMatters:
      "Allows instant real-time risk simulation across interest rate shocks and price changes with zero floating-point math errors.",
  },

  BLACKROCK_WATERFALL: {
    id: "BLACKROCK_WATERFALL",
    name: "BlackRock eFront 4-Tier Distribution Waterfall",
    shortName: "PE Waterfall",
    category: "INSTITUTIONAL_TITANS",
    categoryLabel: "Institutional Titan Suite",
    simpleDefinition:
      "The private equity formula dictating how profits are split between passive family investors (LPs) and managing partners (GPs) upon sale.",
    formulaOrRule: "Tier 1: 100% Capital Return -> Tier 2: 8% Pref Return -> Tier 3: 80/20 GP Catch-up -> Tier 4: 80/20 Carry",
    whyItMatters:
      "Ensures investors get 100% of their money back plus an 8% annual return before managers take any profit share.",
  },

  PREFERRED_RETURN: {
    id: "PREFERRED_RETURN",
    name: "Preferred Return Hurdle (8.00% Annually)",
    shortName: "8% Pref Return",
    category: "INSTITUTIONAL_TITANS",
    categoryLabel: "Institutional Titan Suite",
    simpleDefinition:
      "A guaranteed annual profit hurdle (typically 8%) that investors must receive before the deal manager can take performance fees.",
    formulaOrRule: "Preferred Return = Invested LP Equity * 8.0% * Holding Period Years",
    whyItMatters:
      "Protects the family capital by making sure capital providers earn a healthy baseline return first.",
    idealRange: "8.00% annualized cumulative hurdle",
  },

  CARRIED_INTEREST: {
    id: "CARRIED_INTEREST",
    name: "Carried Interest (20% Performance Share)",
    shortName: "20% Carry",
    category: "INSTITUTIONAL_TITANS",
    categoryLabel: "Institutional Titan Suite",
    simpleDefinition:
      "The 20% share of net investment profits earned by the managing team once investors have received their initial capital and preferred return.",
    formulaOrRule: "GP Carry = 20.0% of Distributable Proceeds above Preferred Return Hurdle",
    whyItMatters:
      "Aligns the executive team with the Principal to maximize asset valuation and cash flow.",
  },

  MOIC: {
    id: "MOIC",
    name: "Multiple on Invested Capital (MOIC)",
    shortName: "MOIC",
    category: "INSTITUTIONAL_TITANS",
    categoryLabel: "Institutional Titan Suite",
    simpleDefinition:
      "The total cash returned divided by the total cash originally invested. A 2.0x MOIC means you doubled your money.",
    formulaOrRule: "MOIC = Total Cash Distributions Received / Initial Equity Invested",
    whyItMatters:
      "Measures pure cash return regardless of how long the investment was held.",
    idealRange: ">= 1.50x target for conservative value-add acquisitions",
    example: "Investing $500,000 and receiving $1,000,000 total upon exit equals a 2.0x MOIC.",
  },

  CITADEL_FACTOR_NEUTRALITY: {
    id: "CITADEL_FACTOR_NEUTRALITY",
    name: "Citadel Portfolio Concentration Limits",
    shortName: "Concentration Limits",
    category: "INSTITUTIONAL_TITANS",
    categoryLabel: "Institutional Titan Suite",
    simpleDefinition:
      "Risk rules capping how much money the family office can put into a single industry (25%), county (40%), or bank lender (30%).",
    formulaOrRule: "Max 25% NAICS; Max 40% County FIPS; Max 30% Single Debt Counterparty",
    whyItMatters:
      "Prevents catastrophic losses if one specific industry or geographic county suffers an economic downturn.",
    idealRange: "100% compliant across all active portfolio positions",
  },

  DRY_POWDER: {
    id: "DRY_POWDER",
    name: "Dry Powder (Uncalled Liquid Capital)",
    shortName: "Dry Powder",
    category: "INSTITUTIONAL_TITANS",
    categoryLabel: "Institutional Titan Suite",
    simpleDefinition:
      "Cash reserves committed by the family office that are currently unspent and ready to deploy into distressed opportunities.",
    formulaOrRule: "Dry Powder = Total Committed Capital - Cumulative Deployed Equity",
    whyItMatters:
      "Having liquid cash ready allows the Principal to quickly snap up distressed assets when competitors can't get bank approval.",
    idealRange: "20% to 50% of total committed fund capital",
  },

  JANE_STREET_SMR: {
    id: "JANE_STREET_SMR",
    name: "Jane Street Canonical SMR Event Ledger",
    shortName: "SMR Event Stream",
    category: "INSTITUTIONAL_TITANS",
    categoryLabel: "Institutional Titan Suite",
    simpleDefinition:
      "An unchangeable, cryptographically secured historical journal of every single action, valuation, and signoff made in the system.",
    formulaOrRule: "SHA-256 Hash Chaining: event_hash = SHA256(sequence_no || parent_hash || payload_hash)",
    whyItMatters:
      "Guarantees that no one can tamper with numbers, falsify approvals, or retroactively change an underwriting model.",
  },

  BRIDGEWATER_MACRO_REGIME: {
    id: "BRIDGEWATER_MACRO_REGIME",
    name: "Bridgewater 4-Quadrant Macro Regime Matrix",
    shortName: "Dalio 4-Quadrant",
    category: "INSTITUTIONAL_TITANS",
    categoryLabel: "Institutional Titan Suite",
    simpleDefinition:
      "Ray Dalio's economic model testing whether a business can survive across all four combinations of rising/falling growth and rising/falling inflation.",
    formulaOrRule: "Simulates: 1. Reflation, 2. Productivity Boom, 3. Stagflation, 4. Deflationary Deleveraging",
    whyItMatters:
      "Ensures the portfolio is 'All-Weather' and won't go bankrupt regardless of what the Federal Reserve or economy does.",
    idealRange: "All-Weather Resilience Score >= 75 / 100 (Grade A or AAA)",
  },

  STAGFLATION_SHOCK: {
    id: "STAGFLATION_SHOCK",
    name: "Stagflation Shock (Dalio Quadrant 3)",
    shortName: "Stagflation Shock",
    category: "INSTITUTIONAL_TITANS",
    categoryLabel: "Institutional Titan Suite",
    simpleDefinition:
      "The most dangerous economic environment for businesses: customer sales drop by 15%, operating costs rise by 12%, and loan interest rates rise by 2.50%.",
    formulaOrRule: "-15% Revenue + 12% Cost Inflation + 250 bps Interest Rate Shock",
    whyItMatters:
      "Reveals whether a target business has the pricing power to pass cost increases to customers or if it collapses into insolvency.",
    idealRange: "Stressed DSCR must remain >= 1.05x even under stagflation",
  },

  SOFR_BENCHMARK: {
    id: "SOFR_BENCHMARK",
    name: "SOFR Benchmark Interest Rate",
    shortName: "SOFR Rate",
    category: "UNDERWRITING_FINANCE",
    categoryLabel: "Underwriting & Finance",
    simpleDefinition:
      "The Secured Overnight Financing Rate: the official benchmark interest rate used by banks to set floating commercial loan rates.",
    formulaOrRule: "Senior Loan Rate = 30-Day Average SOFR + Bank Margin (typically +275 to +350 bps)",
    whyItMatters:
      "As SOFR fluctuates, variable rate debt payments increase or decrease directly affecting free cash flow.",
  },

  FAR_ZONING_ENVELOPE: {
    id: "FAR_ZONING_ENVELOPE",
    name: "Floor Area Ratio (FAR) Expansion Envelope",
    shortName: "FAR Envelope",
    category: "LEGAL_STATUTORY",
    categoryLabel: "Legal & Statutory",
    simpleDefinition:
      "The municipal zoning rule setting how many square feet of building space you are legally allowed to build on a piece of land.",
    formulaOrRule: "FAR = Total Building Floor Square Footage / Total Parcel Land Square Footage",
    whyItMatters:
      "A low current FAR compared to the maximum allowable FAR means you can double or triple the building size without needing rezoning approval.",
    idealRange: "Current FAR significantly below Maximum FAR (expansion potential)",
  },

  FIDUCIARY_OUTREACH: {
    id: "FIDUCIARY_OUTREACH",
    name: "Fiduciary-First Outreach Protocol",
    shortName: "Fiduciary Outreach",
    category: "COMPLIANCE_OPERATIONS",
    categoryLabel: "Compliance & Operations",
    simpleDefinition:
      "Communication directed exclusively to professional fiduciaries (trustees, bankruptcy attorneys, CPAs, court receivers) rather than cold calling.",
    formulaOrRule: "Single-recipient (max_recipients == 1), verified professional email, 0 automated blasts",
    whyItMatters:
      "Protects the Principal's reputation and relationships, avoiding predatory cold-calling or divorce distress scraping.",
  },

  VA_CODE_59_1_514: {
    id: "VA_CODE_59_1_514",
    name: "Virginia Do-Not-Call Statute (§ 59.1-514)",
    shortName: "Va. Code § 59.1-514",
    category: "COMPLIANCE_OPERATIONS",
    categoryLabel: "Compliance & Operations",
    simpleDefinition:
      "Virginia state law strictly prohibiting unsolicited telemarketing calls and automated marketing blasts.",
    formulaOrRule: "Mandatory scrubbing against state and federal DNC registries prior to any outreach",
    whyItMatters:
      "Violations carry civil penalties and reputational damage. Argus enforces an automated zero-contact block on DNC numbers.",
    statuteCitation: "Code of Virginia § 59.1-514",
  },

  DUAL_HUMAN_SIGNOFF: {
    id: "DUAL_HUMAN_SIGNOFF",
    name: "Dual Cryptographic Human Signoff Protocol",
    shortName: "Dual Signoff",
    category: "COMPLIANCE_OPERATIONS",
    categoryLabel: "Compliance & Operations",
    simpleDefinition:
      "A safety rule requiring both the Principal's approval token and Counsel's compliance signature before any letter or funds can be sent.",
    formulaOrRule: "Requires BOTH PrincipalApprovalToken AND CounselComplianceSignoff",
    whyItMatters:
      "Ensures no AI system, rogue analyst, or automated script can ever send an unauthorized commitment on behalf of the family office.",
  },

  AUGURY_ASSET_HEALTH: {
    id: "AUGURY_ASSET_HEALTH",
    name: "Augury Physical AssetHealth™ Score",
    shortName: "AssetHealth™",
    category: "UNDERWRITING_FINANCE",
    categoryLabel: "Underwriting & Finance",
    simpleDefinition:
      "An AI physical health audit evaluating satellite imagery of commercial roofs, machine vibration logs, and deferred maintenance.",
    formulaOrRule: "Composite Score (0–100) combining Roof Sentinel, Darts CaPEx Model, and Cleanlab Audit",
    whyItMatters:
      "Prevents buying a business only to discover a broken $120,000 chiller or leaking roof on day two.",
    idealRange: ">= 75 / 100 (Grade A or B)",
  },

  PALANTIR_GOTHAM_GRAPH: {
    id: "PALANTIR_GOTHAM_GRAPH",
    name: "Palantir Gotham™ Leverage Hub Graph",
    shortName: "Gotham Graph",
    category: "INSTITUTIONAL_TITANS",
    categoryLabel: "Institutional Titan Suite",
    simpleDefinition:
      "A network diagram linking holding companies, owners, parcels, deeds of trust, and bank lenders to find the single key decision-maker.",
    formulaOrRule: "NetworkX Betweenness Centrality + Cycle Detection for Cross-Collateral Liens",
    whyItMatters:
      "Identifies the exact trustee or senior lender who has the legal authority to approve an off-market deal before auction.",
  },

  SPLINK_ENTITY_RESOLUTION: {
    id: "SPLINK_ENTITY_RESOLUTION",
    name: "Splink Probabilistic Entity Resolution",
    shortName: "Entity Resolution",
    category: "COMPLIANCE_OPERATIONS",
    categoryLabel: "Compliance & Operations",
    simpleDefinition:
      "Mathematical algorithm that matches company names and aliases across court dockets, tax rolls, and state corporate filings.",
    formulaOrRule: "Fellegi-Sunter Probabilistic Linkage using Jaro-Winkler string similarity and address token overlap",
    whyItMatters:
      "Connects court filings with county tax records even if the owner spelled their company name slightly differently in each document.",
  },

  H3_SPATIAL_INDEX: {
    id: "H3_SPATIAL_INDEX",
    name: "Uber H3 Spatial Hexagonal Index",
    shortName: "H3 Hex Index",
    category: "UNDERWRITING_FINANCE",
    categoryLabel: "Underwriting & Finance",
    simpleDefinition:
      "A geospatial system dividing the world into hexagonal geographic cells to measure demographic density and competitor proximity.",
    formulaOrRule: "Uber H3 Resolution 8 / 9 Discrete Global Grid System",
    whyItMatters:
      "Groups adjacent businesses together to spot 'roll-up' opportunities where buying 3 nearby shops creates massive economies of scale.",
  },
};

/**
 * Helper to retrieve a term safely with fallback
 */
export function getGlossaryTerm(termId: string): GlossaryTerm | null {
  if (!termId) return null;
  const normalized = termId.trim().toUpperCase().replace(/[-\s]/g, "_");
  if (GLOSSARY_TERMS[normalized]) {
    return GLOSSARY_TERMS[normalized];
  }
  // Try partial search
  const foundKey = Object.keys(GLOSSARY_TERMS).find((k) => k.includes(normalized) || normalized.includes(k));
  return foundKey ? GLOSSARY_TERMS[foundKey] : null;
}
