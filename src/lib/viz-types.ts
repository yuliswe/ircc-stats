/**
 * Shared data contract for the Security-Screening Bias Explorer.
 *
 * The build step (`scripts/build-viz-data.mts`) parses the reconciled ATIP
 * screening CSV and emits JSON conforming to `VizData`. The UI reads that
 * JSON only — never the CSVs — and computes bias metrics (serious share,
 * enrichment, referral rate) client-side from these tidy cells so that the
 * global controls (top-dimension filter, time basis, min-screenings) stay
 * reactive without a rebuild. See docs/ui-spec.md §3.
 */

export type StreamId = 'PR' | 'TRV';

/** Which count column a metric is computed over, driven by the Time-basis control. */
export type ValueField = 'grand' | 'total2025';

/**
 * A citizenship-tier cell: the count of screenings of one activity type, for one
 * citizenship, within one top-dimension value. This is the finest tier used for
 * country metrics; office breakdowns live in `OfficeCell`. The build derives it
 * by summing the office leaves of each (category, activity, citizenship) group.
 */
export type CityCell = {
  /** Top-dimension value: immigration category (PR) or application type (TRV). */
  cat: string;
  /** Activity (screening) type. */
  act: string;
  /** Citizenship, as parsed (may carry OCR noise). */
  cit: string;
  /** ISO 3166-1 alpha-3, resolved from `cit`; null when unmatched. */
  iso3: string | null;
  /** total_2019_to_2025 count (cumulative 2019–2025). */
  g: number;
  /** total_2025 count. */
  t: number;
};

/** An office-tier cell: adds the processing office beneath a `CityCell`. */
export type OfficeCell = {
  cat: string;
  act: string;
  cit: string;
  off: string;
  g: number;
  t: number;
};

export type StreamData = {
  id: StreamId;
  /** Raw hierarchy column name, e.g. "immigration_category". */
  topDimension: string;
  /** Human label for the control, e.g. "Immigration category". */
  topDimensionLabel: string;
  topDimensionValues: string[];
  /** Activity types in fixed reading order: routine first, then the rest. */
  activityTypes: string[];
  routineType: string;
  /** Activity types treated as "serious"; empty when the mapping is unknown (TRV). */
  seriousTypes: string[];
  /** False for TRV until an analyst supplies the VIT severity mapping (§2). */
  seriousMappingKnown: boolean;
  cityCells: CityCell[];
  officeCells: OfficeCell[];
  offices: string[];
  /**
   * Count of reconciliation-placeholder cells (data withheld from the ATIP
   * release under s.16(1)(c), or a group whose printed detail does not foot),
   * per value field. These are kept in the totals so each stream still foots to
   * the published grand total, and footnoted per chart.
   */
  placeholders: { grand: number; total2025: number };
  /** Citizenships that could not be mapped to an ISO3 code (map footnote). */
  unmatchedCitizenships: string[];
};

/**
 * One nationality's 2025 screening-vs-applications row, from
 * `data/derived/screening_vs_applications_2025.csv`. Unlike the hierarchical stream
 * data, this table pairs security-screening referrals with the *application*
 * volume for the same year, so it finally supports a referral rate over
 * applications (the true "chance of being referred") rather than a rate over
 * screenings. Non-country aggregate labels ("Missing data", "Other",
 * "Unspecified", "Stateless") and rows without an application denominator are
 * dropped at build time, so `applications` is always > 0 here.
 */
export type ScreeningAppRow = {
  /** Citizenship, as printed in the CSV. */
  cit: string;
  /** ISO 3166-1 alpha-3, resolved from `cit`; null when unmatched. */
  iso3: string | null;
  /** Referred to any screening type in 2025 (referred_any_type_2025_fullyear). */
  referred: number;
  /** All applications received in 2025 (total_applications_2025_fullyear). */
  applications: number;
  /** TRV-side screening referrals (vit_34/35/37 subtotal). */
  trvReferred: number;
  /** PR-side screening referrals (HIRV + Org Crime + Security subtotal). */
  prReferred: number;
  /** PR application intake. */
  prIntake: number;
  /** Study permits processed. */
  spProcessed: number;
  /** TRV application intake. */
  trvIntake: number;
};

/**
 * One nationality's 2025 temporary-residence approval outcome, from
 * `data/derived/tr_approval_vs_applications_2025.csv`. The rate is IRCC's own
 * approved-over-processed share for the year. Rows whose approved or processed
 * count IRCC suppressed (a privacy hold on counts of 1–4), and rows with a zero
 * processed denominator, carry no computable rate and are dropped at build time,
 * so `processed` is always > 0 and `rate` is always defined here. The two
 * aggregate rows ("Total", "Other*") are removed as well: "Total" becomes
 * `trApprovalTotal` and the residual "Other*" bucket is discarded.
 */
export type TrApprovalRow = {
  /** Source-country label, as printed in the CSV. */
  cit: string;
  /** ISO 3166-1 alpha-3, resolved from `cit`; null when unmatched. */
  iso3: string | null;
  /** Temporary-residence applications approved (tr_approved). */
  approved: number;
  /** Temporary-residence applications finalized (tr_processed). */
  processed: number;
  /** processed − approved (tr_non_approval). */
  nonApproval: number;
  /** approved ÷ processed. */
  rate: number;
};

/** The all-countries "Total" aggregate row, used as the national-average baseline. */
export type TrApprovalTotal = {
  approved: number;
  processed: number;
  rate: number;
};

/**
 * One country's 2025 permanent-residence outcome, from
 * `data/derived/pr_estimate_approval_vs_applications_2025.csv`. `coprIssued` is
 * the count of Confirmation-of-Permanent-Residence documents issued for the
 * country in 2025, which is the number of its nationals actually admitted as
 * permanent residents, while `prIntake` is the estimated permanent-residence
 * application intake. The non-country aggregate rows ("Other*", "Stateless")
 * are dropped at build time because a country map cannot place them.
 */
export type CoprRow = {
  /** Source-country label, as printed in the CSV. */
  cit: string;
  /** ISO 3166-1 alpha-3, resolved from `cit`; null when unmatched. */
  iso3: string | null;
  /** Estimated permanent-residence application intake (pr_intake). */
  prIntake: number;
  /** Confirmations of Permanent Residence issued in 2025 (copr_issued). */
  coprIssued: number;
};

/**
 * One nationality's security-screening *outcome*, joining the non-favourable
 * (failed) results from ATIP release OPP-DART-2025-34337 to the referral counts
 * from `1A-2025-08687`. The failed-results file reports failures by nationality
 * and calendar year (2019 → Jul 2025); the referral counts come from the stream
 * cells (cumulative `g` and 2025 `t`). Because a screening concludes roughly a
 * year after referral, the honest rate divides failures observed in a window by
 * the referral cohort that generated them, so this row carries both a same-window
 * (naive) basis and a one-year lag-aligned basis, and the chart shows the range
 * between them. Suppressed failure cells (printed `--`, meaning 1–4) are counted
 * as 0, so every failure figure is a lower bound. Only nationalities coded to an
 * ISO3 with a positive referral denominator are emitted.
 */
export type ScreeningOutcomeRow = {
  /** Citizenship, as printed in the failed-results CSV. */
  cit: string;
  /** ISO 3166-1 alpha-3; always present (uncoded rows are dropped). */
  iso3: string;
  /** Referrals to security screening, cumulative 2019–2025 (naive denominator). */
  referralsCum: number;
  /** Referrals 2019–2024 (cumulative − 2025), the lag-aligned denominator. */
  referrals2019to2024: number;
  /** Failed (non-favourable) results, all years 2019–2025 (naive numerator). */
  failuresAll: number;
  /** Failed results 2020–2025, the lag-aligned numerator (all years but 2019). */
  failures2020to2025: number;
};

/** All-nationalities screening-outcome totals, the national-average baseline. */
export type ScreeningOutcomeTotal = {
  referralsCum: number;
  referrals2019to2024: number;
  failuresAll: number;
  failures2020to2025: number;
};

export type VizData = {
  meta: {
    atip: string;
    generatedFrom: string[];
    /** ccn3 (numeric ISO, as string) → ISO3, for joining the choropleth topology. */
    ccn3ToIso3: Record<string, string>;
    /** ISO3 → display name, for tooltips on countries with no screening data. */
    iso3ToName: Record<string, string>;
  };
  streams: Record<StreamId, StreamData>;
  /** 2025 screening referrals vs. application volume, per nationality. */
  screeningApplications: ScreeningAppRow[];
  /** 2025 temporary-residence approval outcome, per nationality. */
  trApprovals: TrApprovalRow[];
  /** IRCC's all-countries approval total, the national-average baseline. */
  trApprovalTotal: TrApprovalTotal;
  /** 2025 CoPRs issued (permanent residents admitted) per country. */
  coprByCountry: CoprRow[];
  /** Security-screening failure outcomes per nationality (OPP-DART-2025-34337). */
  screeningOutcomes: ScreeningOutcomeRow[];
  /** All-nationalities screening-outcome totals, the national baseline. */
  screeningOutcomeTotal: ScreeningOutcomeTotal;
};
