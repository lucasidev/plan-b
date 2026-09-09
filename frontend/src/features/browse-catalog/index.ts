export type { CrumbItem } from './components/breadcrumb';
export { CatalogBreadcrumb } from './components/breadcrumb';
export { CareerCoverageList } from './components/career-coverage-list';
export { CareerList } from './components/career-list';
export { CatalogErrorState } from './components/catalog-error-state';
export { CatalogLoadingSkeleton } from './components/catalog-loading-skeleton';
export { CatalogTopbar } from './components/catalog-topbar';
export type { ExploreLens } from './components/explore-lens-switch';
export { ExploreLensSwitch } from './components/explore-lens-switch';
export { PlanList } from './components/plan-list';
export { SubjectGrid } from './components/subject-grid';
export { UniversityList } from './components/university-list';
export { describeCareerCoverage, describeUniversityCoverage } from './lib/describe-career-coverage';
export type { CareerUniversityGroup } from './lib/group-careers-by-university';
export {
  groupCareersByUniversity,
  summarizeUniversitiesCoverage,
} from './lib/group-careers-by-university';
export type { SubjectYearGroup } from './lib/group-subjects';
export { groupSubjectsByYear } from './lib/group-subjects';
export type {
  Career,
  CareerCoverage,
  CareerPlan,
  CareerPlanSummary,
  Subject,
  University,
  UniversityWithCoverage,
} from './types';
