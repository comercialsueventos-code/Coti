# Shared Components & Utilities

This directory contains consolidated implementations created during Epic 2.

## 🎯 Purpose

The `/shared` directory houses consolidated versions of previously duplicated code, providing:
- **Single source of truth** for common functionality
- **Consistent patterns** across the application  
- **Easier maintenance** and updates
- **Better developer experience** with well-documented APIs

## 📁 Directory Structure

```
src/shared/
├── components/     # Consolidated UI components
├── hooks/          # Consolidated React hooks
├── services/       # Consolidated service classes
├── types/          # Consolidated type definitions
├── utils/          # Consolidated utility functions
├── constants/      # Consolidated constants
└── README.md      # This file
```

## 🚀 Usage

All consolidated components follow these patterns:

### Import Pattern
```typescript
// Always import from shared when available
import { BaseEntityService } from '@/shared/services'
import { useEntityHooks } from '@/shared/hooks'
import { GenericForm } from '@/shared/components'
```

### Feature Flags
Some consolidations use feature flags for gradual rollout:

```typescript
import { isFeatureEnabled } from '@/shared/utils/featureFlags'

// Check if consolidation is enabled
const useNewImplementation = isFeatureEnabled('USE_CONSOLIDATED_COMP_01')
```

## 📚 Documentation

Each subdirectory contains:
- **README.md** - API documentation and usage examples
- **examples/** - Code examples (when applicable)
- **types.ts** - TypeScript definitions

## 🔧 Development Guidelines

### Creating New Consolidated Components

1. **Follow the consolidation workflow**: See `docs/CONSOLIDATION_WORKFLOW.md`
2. **Use generic implementations**: Prefer generics over specific implementations
3. **Maintain backward compatibility**: Don't break existing APIs
4. **Document thoroughly**: Include usage examples and API documentation
5. **Test comprehensively**: Ensure equivalent behavior to original implementations

### Best Practices

- **Prefer composition over inheritance** for flexibility
- **Use TypeScript generics** for reusability
- **Include proper error handling** with meaningful messages
- **Follow existing naming conventions**
- **Write self-documenting code** with clear interfaces

## 🧪 Testing

Consolidated components must maintain:
- **>95% test coverage**
- **Equivalent behavior** to original implementations  
- **Performance within ±5%** of baseline
- **No breaking changes** for consumers

## 📈 Metrics

Track the impact of consolidations:
- **Lines of code reduced**
- **Developer velocity improvements**
- **Reduced bug rate**
- **Faster onboarding**

## 🚨 Migration Notes

When consolidations are complete:
1. Old implementations are removed
2. All imports are updated automatically
3. Feature flags are cleaned up
4. Documentation is updated

## 🔗 Related Documentation

- [Epic 2 Detailed Plan](../../../docs/EPIC_2_DETAILED_PLAN.md)
- [Consolidation Workflow](../../../docs/CONSOLIDATION_WORKFLOW.md) 
- [Prioritization Matrix](../../../docs/PRIORITIZATION_MATRIX.md)

---

*This directory is part of Epic 2: Consolidación de Alto Impacto*