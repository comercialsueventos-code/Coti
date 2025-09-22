// Feature flags for gradual consolidation rollout
// This file is managed by consolidation scripts - do not edit manually

export const FEATURE_FLAGS = {
  // Epic 2 consolidation flags will be added here automatically
  // Example: USE_CONSOLIDATED_COMP_01: false,
} as const

export type FeatureFlag = keyof typeof FEATURE_FLAGS

/**
 * Check if a feature flag is enabled
 * @param flag - The feature flag to check
 * @returns true if the feature is enabled, false otherwise
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag] ?? false
}

/**
 * Get all feature flags and their current state
 * @returns object containing all feature flags
 */
export function getFeatureFlags() {
  return FEATURE_FLAGS
}

/**
 * Get consolidation-specific flags only
 * @returns object containing only consolidation feature flags
 */
export function getConsolidationFlags() {
  return Object.fromEntries(
    Object.entries(FEATURE_FLAGS).filter(([key]) => 
      key.startsWith('USE_CONSOLIDATED_')
    )
  )
}

/**
 * Check if any consolidation is in progress
 * @returns true if at least one consolidation flag exists
 */
export function hasActiveConsolidations(): boolean {
  return Object.keys(getConsolidationFlags()).length > 0
}