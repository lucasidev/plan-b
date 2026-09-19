export type AcademicUnit = {
  id: string;
  name: string;
  slug: string;
  address: string;
  province: string | null;
  localityId: string | null;
  localityName: string | null;
  careerCount: number;
};

export type InstitutionProfile = {
  universityId: string;
  websiteUrl: string | null;
  address: string | null;
  province: string | null;
  localityId: string | null;
  localityName: string | null;
  logoVersion: number | null;
  academicUnitCount: number;
  careerCount: number;
  planCount: number;
  units: AcademicUnit[];
};

export type CatalogFormState = { status: 'idle' | 'success' | 'error'; message?: string };
export const initialCatalogState: CatalogFormState = { status: 'idle' };
