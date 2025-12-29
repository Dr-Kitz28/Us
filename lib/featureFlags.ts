// Enhanced feature flag utility with research-backed features
// Usage: isFeatureEnabled('enableGpt5Preview')

export type FeatureName = 
  | 'enableGpt5Preview'
  | 'stableMatchingAlgorithm' 
  | 'choiceOverloadProtection'
  | 'qualityOverQuantity'
  | 'authenticityPrompts'
  | 'burnoutPrevention'
  | 'diversityInjection'

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (typeof value !== 'string') return fallback
  const v = value.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

const defaults: Record<FeatureName, boolean> = {
  // Core AI enhancement
  enableGpt5Preview: true,
  
  // Research-backed algorithmic improvements
  stableMatchingAlgorithm: true, // Gale-Shapley inspired matching
  choiceOverloadProtection: true, // Limit profiles to prevent decision fatigue
  qualityOverQuantity: true, // Focus on better matches over more matches
  
  // Gen-Z focused features
  authenticityPrompts: true, // Encourage genuine self-expression
  
  // Well-being features
  burnoutPrevention: true, // Detect and prevent dating app fatigue
  diversityInjection: true, // Prevent algorithmic bias and echo chambers
}

export function isFeatureEnabled(name: FeatureName): boolean {
  switch (name) {
    case 'enableGpt5Preview':
      return parseBool(process.env.FEATURE_ENABLE_GPT5_PREVIEW, defaults.enableGpt5Preview)
    case 'stableMatchingAlgorithm':
      return parseBool(process.env.FEATURE_STABLE_MATCHING, defaults.stableMatchingAlgorithm)
    case 'choiceOverloadProtection':
      return parseBool(process.env.FEATURE_CHOICE_PROTECTION, defaults.choiceOverloadProtection)
    case 'qualityOverQuantity':
      return parseBool(process.env.FEATURE_QUALITY_FOCUS, defaults.qualityOverQuantity)
    case 'authenticityPrompts':
      return parseBool(process.env.FEATURE_AUTHENTICITY, defaults.authenticityPrompts)
    case 'burnoutPrevention':
      return parseBool(process.env.FEATURE_BURNOUT_PREVENTION, defaults.burnoutPrevention)
    case 'diversityInjection':
      return parseBool(process.env.FEATURE_DIVERSITY, defaults.diversityInjection)
  }
}

export function getAllFlags(): Record<FeatureName, boolean> {
  return {
    enableGpt5Preview: isFeatureEnabled('enableGpt5Preview'),
    stableMatchingAlgorithm: isFeatureEnabled('stableMatchingAlgorithm'),
    choiceOverloadProtection: isFeatureEnabled('choiceOverloadProtection'),
    qualityOverQuantity: isFeatureEnabled('qualityOverQuantity'),
    authenticityPrompts: isFeatureEnabled('authenticityPrompts'),
    burnoutPrevention: isFeatureEnabled('burnoutPrevention'),
    diversityInjection: isFeatureEnabled('diversityInjection'),
  }
}

// Get research citations for each feature
export function getFeatureResearch(name: FeatureName): string {
  const research = {
    enableGpt5Preview: "Advanced AI for enhanced matching algorithms and user experience",
    stableMatchingAlgorithm: "Based on Gale-Shapley algorithm research. Hinge's Most Compatible feature shows 8x higher phone number exchange rates (Harvard Business School, 2018)",
    choiceOverloadProtection: "Pronk & Denissen (2020) found 27% drop in acceptance from first to last profile due to choice overload",
    qualityOverQuantity: "Research shows collaborative filtering outperforms simple demographic matching in precision and recall (UCLA study, 200k users)",
    authenticityPrompts: "90% of Indian Gen-Z use dating apps for friendship too, valuing authentic self-expression over polished profiles (Economic Times, 2023)",
    burnoutPrevention: "79% of Gen-Z report dating app fatigue (NDTV, 2024). LSE research shows dopamine-driven design can become addictive",
    diversityInjection: "MonsterMatch simulation showed CF algorithms can exclude minority users through bias feedback loops (MIT, 2022)"
  }
  return research[name] || "Research-backed feature for improved user experience"
}

// Backwards-compatibility object for older imports expecting `featureFlags`
export const featureFlags = {
  // legacy key used in some modules
  FEATURE_RSBM_MATCHING: isFeatureEnabled('stableMatchingAlgorithm'),
  // map some commonly referenced env-driven flags
  FEATURE_ENABLE_GPT5_PREVIEW: isFeatureEnabled('enableGpt5Preview'),
  FEATURE_STABLE_MATCHING: isFeatureEnabled('stableMatchingAlgorithm'),
  FEATURE_CHOICE_PROTECTION: isFeatureEnabled('choiceOverloadProtection'),
  FEATURE_QUALITY_FOCUS: isFeatureEnabled('qualityOverQuantity'),
  FEATURE_AUTHENTICITY: isFeatureEnabled('authenticityPrompts'),
  FEATURE_BURNOUT_PREVENTION: isFeatureEnabled('burnoutPrevention'),
  FEATURE_DIVERSITY: isFeatureEnabled('diversityInjection'),
}