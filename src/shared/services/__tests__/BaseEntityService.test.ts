/**
 * BaseEntityService Comprehensive Tests
 * Tests the generic CRUD service that eliminates 33+ duplicated functions
 */

import BaseEntityService, { EntityServiceConfig, BaseEntityFilters } from '../BaseEntityService'
import { BaseEntity } from '../../types'

// Mock Supabase
jest.mock('../../../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }))
  }
}))

interface TestEntity extends BaseEntity {
  name: string
  description?: string
}

interface CreateTestEntity {
  name: string
  description?: string
}

describe('BaseEntityService', () => {
  let service: BaseEntityService<TestEntity, CreateTestEntity>
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    const config: EntityServiceConfig = {
      tableName: 'test_entities',
      defaultSelect: '*, category(*)',
      defaultOrderBy: 'name',
      filterActiveByDefault: true
    }

    service = new BaseEntityService<TestEntity, CreateTestEntity>(config)
    mockSupabase = require('../../../services/supabase').supabase
  })

  describe('CRUD Operations', () => {
    it('should handle getAll with filters', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            ilike: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: 1, name: 'Test', is_active: true }],
                  error: null
                })
              })
            })
          })
        })
      })

      const result = await service.getAll({ search: 'test' })
      expect(mockSupabase.from).toHaveBeenCalledWith('test_entities')
      expect(result).toHaveLength(1)
    })

    it('should handle create operations', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 1, name: 'New Entity', is_active: true },
              error: null
            })
          })
        })
      })

      const result = await service.create({ name: 'New Entity' })
      expect(result.name).toBe('New Entity')
    })

    it('should handle update operations', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 1, name: 'Updated', is_active: true },
                error: null
              })
            })
          })
        })
      })

      const result = await service.update(1, { name: 'Updated' })
      expect(result.name).toBe('Updated')
    })

    it('should handle soft delete', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      })

      await service.delete(1)
      expect(mockSupabase.from).toHaveBeenCalledWith('test_entities')
    })
  })

  describe('Error Handling', () => {
    it('should throw errors from failed operations', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })

      await expect(service.getAll()).rejects.toThrow()
    })
  })
})