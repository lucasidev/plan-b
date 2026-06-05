import { HistoryOptions } from '@/features/onboarding';

/**
 * `/onboarding/history` step 03 (US-037-f). Three options to load the transcript: PDF
 * (US-014), manual (US-013), "lo cargo después".
 *
 * No profile guard here: the normal flow comes from step 02 (which already created
 * the profile). If a user hits the URL directly without a prior profile they'd see
 * the history options without context, but the "lo cargo después" path is
 * non-destructive and advances to /onboarding/done which shows confirmation. No edge
 * case breaks.
 *
 * Fully server component: it has no state.
 */
export default function OnboardingHistoryPage() {
  return <HistoryOptions />;
}
