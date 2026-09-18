export type AdminUserRow = {
  id: string;
  email: string;
  createdAt: string;
  emailVerifiedAt: string | null;
  disabledAt: string | null;
  disabledReason: string | null;
  displayName: string | null;
  careerId: string | null;
  careerName: string | null;
  universityName: string | null;
  enrollmentYear: number | null;
};

export type AdminUserPage = {
  items: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type AccessResult = { ok: true } | { ok: false; message: string };
