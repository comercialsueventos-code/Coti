/**
 * 🔧 ULTRATHINK FIX: Corrección de cálculo de retención
 * 
 * Este script corrige todas las cotizaciones corporativas existentes
 * para aplicar la retención sobre (subtotal + margen) en lugar de solo subtotal.
 * 
 * PROBLEMA CORREGIDO:
 * - Antes: retention = subtotal * 4%
 * - Ahora: retention = (subtotal + margin) * 4%
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase (usar las variables de entorno del proyecto)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'your-supabase-url'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function fixRetentionCalculations() {
  console.log('🔧 ULTRATHINK: Iniciando corrección de cálculos de retención...')
  
  try {
    // 1. Obtener todas las cotizaciones corporativas
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('*')
      .eq('client_type', 'corporativo')
      .order('created_at', { ascending: false })

    if (quotesError) {
      throw new Error(`Error obteniendo cotizaciones: ${quotesError.message}`)
    }

    if (!quotes || quotes.length === 0) {
      console.log('ℹ️ No hay cotizaciones corporativas para corregir.')
      return
    }

    console.log(`📊 Encontradas ${quotes.length} cotizaciones corporativas`)

    let corrected = 0
    let errors = 0

    // 2. Procesar cada cotización
    for (const quote of quotes) {
      try {
        console.log(`\n🔍 Procesando: ${quote.quote_number} (ID: ${quote.id})`)
        
        // Obtener los items de la cotización
        const { data: items, error: itemsError } = await supabase
          .from('quote_items')
          .select('*')
          .eq('quote_id', quote.id)

        if (itemsError) {
          console.error(`❌ Error obteniendo items: ${itemsError.message}`)
          errors++
          continue
        }

        // Recalcular usando la lógica corregida
        const subtotal = (items || []).reduce((sum, item) => sum + item.total_price, 0)
        const marginPercentage = quote.margin_percentage || 20
        const marginAmount = subtotal * (marginPercentage / 100)
        
        // ✅ CORRECCIÓN: Aplicar retención sobre (subtotal + margen)
        const baseForRetention = subtotal + marginAmount
        const taxRetentionAmount = baseForRetention * 0.04 // 4% para corporativos
        
        const newTotalCost = subtotal + marginAmount - taxRetentionAmount + (quote.transport_cost || 0)

        // Comparar con el valor actual
        const currentTotal = quote.total_cost || 0
        const difference = Math.abs(newTotalCost - currentTotal)

        console.log(`   📊 Subtotal: $${subtotal.toLocaleString()}`)
        console.log(`   📈 Margen (${marginPercentage}%): $${marginAmount.toLocaleString()}`)
        console.log(`   📉 Retención base: $${baseForRetention.toLocaleString()}`)
        console.log(`   📉 Retención amount: $${taxRetentionAmount.toLocaleString()}`)
        console.log(`   🚛 Transporte: $${(quote.transport_cost || 0).toLocaleString()}`)
        console.log(`   💰 Total anterior: $${currentTotal.toLocaleString()}`)
        console.log(`   💰 Total corregido: $${newTotalCost.toLocaleString()}`)
        console.log(`   📊 Diferencia: $${difference.toLocaleString()}`)

        // Solo actualizar si hay diferencia significativa (más de $1)
        if (difference > 1) {
          const { error: updateError } = await supabase
            .from('quotes')
            .update({
              subtotal,
              margin_amount: marginAmount,
              tax_retention_amount: taxRetentionAmount,
              total_cost: newTotalCost,
              // Agregar nota de corrección
              internal_notes: `${quote.internal_notes || ''}\n🔧 ULTRATHINK: Retención corregida ${new Date().toISOString()}`
            })
            .eq('id', quote.id)

          if (updateError) {
            console.error(`❌ Error actualizando cotización ${quote.quote_number}: ${updateError.message}`)
            errors++
          } else {
            console.log(`   ✅ CORREGIDO: Diferencia de $${difference.toLocaleString()}`)
            corrected++
          }
        } else {
          console.log(`   ✅ Sin cambios necesarios`)
        }

      } catch (error) {
        console.error(`❌ Error procesando ${quote.quote_number}: ${error.message}`)
        errors++
      }
    }

    // 3. Resumen final
    console.log('\n🎯 RESUMEN DE CORRECCIÓN:')
    console.log(`📊 Cotizaciones procesadas: ${quotes.length}`)
    console.log(`✅ Cotizaciones corregidas: ${corrected}`)
    console.log(`❌ Errores: ${errors}`)
    
    if (corrected > 0) {
      console.log('\n🎉 ¡Corrección completada exitosamente!')
      console.log('📋 Las cotizaciones corregidas ahora mostrarán el mismo total en la vista externa e interna.')
    }

  } catch (error) {
    console.error('💥 Error fatal:', error.message)
    process.exit(1)
  }
}

// Función para verificar una cotización específica
async function checkSpecificQuote(quoteNumber) {
  console.log(`🔍 ULTRATHINK: Verificando cotización específica: ${quoteNumber}`)
  
  try {
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('quote_number', quoteNumber)
      .single()

    if (error || !quote) {
      console.log(`❌ No se encontró la cotización: ${quoteNumber}`)
      return
    }

    const { data: items } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quote.id)

    const subtotal = (items || []).reduce((sum, item) => sum + item.total_price, 0)
    const marginAmount = subtotal * (quote.margin_percentage / 100)
    const baseForRetention = subtotal + marginAmount
    const correctedRetention = baseForRetention * 0.04
    const correctedTotal = subtotal + marginAmount - correctedRetention + (quote.transport_cost || 0)

    console.log(`\n📋 ANÁLISIS DE: ${quote.quote_number}`)
    console.log(`📊 Subtotal: $${subtotal.toLocaleString()}`)
    console.log(`📈 Margen: $${marginAmount.toLocaleString()}`)
    console.log(`📉 Base retención: $${baseForRetention.toLocaleString()}`)
    console.log(`📉 Retención actual: $${quote.tax_retention_amount?.toLocaleString() || '0'}`)
    console.log(`📉 Retención correcta: $${correctedRetention.toLocaleString()}`)
    console.log(`💰 Total actual: $${quote.total_cost?.toLocaleString() || '0'}`)
    console.log(`💰 Total correcto: $${correctedTotal.toLocaleString()}`)
    console.log(`📊 Diferencia: $${Math.abs(correctedTotal - (quote.total_cost || 0)).toLocaleString()}`)

  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Ejecutar según argumentos de línea de comandos
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args.length > 0 && args[0].startsWith('SUE-')) {
    checkSpecificQuote(args[0])
  } else {
    fixRetentionCalculations()
  }
}

module.exports = { fixRetentionCalculations, checkSpecificQuote }