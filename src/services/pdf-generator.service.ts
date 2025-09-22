import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Quote, Client, Employee, Product } from '../types'
import moment from 'moment'
import 'moment/locale/es' // Import Spanish locale
import sueLogoUrl from '../assets/sue-logo.png'
import { QuoteTemplatesService, QuoteTemplate } from './quoteTemplates.service'

interface PDFQuoteData {
  quote: Quote
  client: Client
  employees: any[]
  products: any[]
  summary: {
    subtotal: number
    margin_amount: number
    tax_retention_amount: number
    total_cost: number
    employees_subtotal: number
    products_subtotal: number
    transport_subtotal?: number
    multipleTransportZones?: any[] // Nueva información para múltiples zonas
  }
  template?: QuoteTemplate // Plantilla opcional, si no se proporciona usará la predeterminada
}

// Configure moment to use Spanish locale
moment.locale('es')

export class PDFGeneratorService {
  private static readonly colors = {
    primary: '#1976d2',
    secondary: '#757575',
    accent: '#ff9800',
    text: '#212121',
    textLight: '#666666',
    border: '#e0e0e0',
    background: '#f5f5f5'
  }

  /**
   * Detect if this is a multiday event based on daily_schedules presence
   */
  private static isMultidayEvent(quote: Quote): boolean {
    return !!(quote.daily_schedules && quote.daily_schedules.length > 0)
  }

  /**
   * Format multiday schedule information as HTML
   */
  private static formatMultidayScheduleHTML(dailySchedules: any[]): string {
    if (!dailySchedules || dailySchedules.length === 0) {
      return ''
    }

    return dailySchedules
      .map((schedule, index) => {
        const dayNumber = index + 1
        const formattedDate = moment(schedule.event_date).format('MMMM DD [de] YYYY')
        const timeRange = schedule.start_time && schedule.end_time 
          ? `${schedule.start_time} a ${schedule.end_time}`
          : ''
        
        return `<div style="margin-bottom: 8px;">
          <strong>Día ${dayNumber}:</strong> ${formattedDate}${timeRange ? ` - ${timeRange}` : ''}
        </div>`
      })
      .join('')
  }

  /**
   * Get date display for single or multiday events
   */
  private static getEventDateDisplay(quote: Quote, formatDateFn: Function): string {
    if (this.isMultidayEvent(quote)) {
      // For multiday events, show date range
      const schedules = quote.daily_schedules!
      const firstDate = schedules[0]?.event_date
      const lastDate = schedules[schedules.length - 1]?.event_date
      
      if (firstDate && lastDate && firstDate !== lastDate) {
        return `${formatDateFn(firstDate)} - ${formatDateFn(lastDate)}`
      } else if (firstDate) {
        return formatDateFn(firstDate)
      }
    }
    
    // Fallback to single event date
    return formatDateFn(quote.event_date)
  }

  /**
   * Get time display for single or multiday events
   */
  private static getEventTimeDisplay(quote: Quote): string {
    if (this.isMultidayEvent(quote)) {
      // For multiday events, we'll show detailed schedule in the dates section
      return 'Ver horario detallado abajo'
    }
    
    // Fallback to single event time
    return quote.event_start_time && quote.event_end_time 
      ? `${quote.event_start_time} a ${quote.event_end_time}`
      : ''
  }

  /**
   * Format multiline content as HTML paragraphs
   */
  private static formatContentAsHTML(content: string): string {
    if (!content) return ''
    
    return content
      .split('\n')
      .filter(line => line.trim()) // Remove empty lines
      .map(line => `<div style="margin-bottom: 6px;">${line.trim()}</div>`)
      .join('')
  }

  /**
   * Get client contact name - handles both old and new format
   */
  private static getClientContact(client: any): string {
    // Try new format first (contacts array)
    if (client.contacts && Array.isArray(client.contacts) && client.contacts.length > 0) {
      const primaryContact = client.contacts.find((c: any) => c.is_primary) || client.contacts[0]
      return primaryContact.name || ''
    }
    // Fall back to deprecated format
    return client.contact_person || ''
  }

  /**
   * Get client phone - handles both old and new format
   */
  private static getClientPhone(client: any): string {
    // Try new format first (contacts array)
    if (client.contacts && Array.isArray(client.contacts) && client.contacts.length > 0) {
      const primaryContact = client.contacts.find((c: any) => c.is_primary) || client.contacts[0]
      return primaryContact.phone || ''
    }
    // Handle object phone field
    if (client.phone && typeof client.phone === 'object') {
      return client.phone.phone || client.phone.number || client.phone.value || String(client.phone) || ''
    }
    // Fall back to deprecated format
    return client.phone || ''
  }

  /**
   * Get client email - handles both old and new format
   */
  private static getClientEmail(client: any): string {
    // Try new format first (contacts array)
    if (client.contacts && Array.isArray(client.contacts) && client.contacts.length > 0) {
      const primaryContact = client.contacts.find((c: any) => c.is_primary) || client.contacts[0]
      return primaryContact.email || ''
    }
    // Handle object email field
    if (client.email && typeof client.email === 'object') {
      return client.email.email || client.email.value || String(client.email) || ''
    }
    // Fall back to deprecated format
    return client.email || ''
  }

  /**
   * Generate quote PDF with Sue Events branding
   */
  static async generateQuotePDF(data: PDFQuoteData): Promise<void> {
    try {
      // Obtener plantilla si no se proporcionó una
      let template = data.template
      if (!template) {
        try {
          template = await QuoteTemplatesService.getDefault()
          // Template obtained
        } catch (error) {
          console.warn('No se pudo obtener plantilla, usando valores predeterminados:', error)
        }
      }

      // Create HTML content
      const htmlContent = this.generateQuoteHTML({ ...data, template })
      
      // Create a temporary container
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlContent
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '0'
      tempDiv.style.width = '794px' // A4 width in pixels
      tempDiv.style.minHeight = '1123px' // A4 height in pixels
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.zIndex = '1000'
      tempDiv.style.visibility = 'visible'
      tempDiv.style.transform = 'scale(1)'
      tempDiv.style.transformOrigin = 'top left'
      document.body.appendChild(tempDiv)

      try {
        // Starting PDF generation
        
        // Wait for DOM to be fully ready and fonts to load
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Calculating content dimensions
        
        // Generate PDF from HTML
        const canvas = await html2canvas(tempDiv, {
          scale: 3, // Increased from 1 to 3 for better resolution
          logging: true,
          useCORS: true,
          backgroundColor: '#ffffff',
          allowTaint: true,
          foreignObjectRendering: false,
          removeContainer: false,
          imageTimeout: 15000, // Increased timeout for high-res images
          windowWidth: 794,
          windowHeight: tempDiv.scrollHeight,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          dpi: 300, // High DPI for crisp text and images
          letterRendering: true, // Better text rendering
          onclone: (clonedDoc) => {
            // Ensure images load properly in cloned document
            const images = clonedDoc.querySelectorAll('img');
            images.forEach(img => {
              img.style.imageRendering = 'crisp-edges';
              img.style.imageRendering = '-webkit-optimize-contrast';
            });
          }
        })
        
        // Canvas generated successfully

        const imgData = canvas.toDataURL('image/png', 1.0) // Maximum quality
        
        if (!imgData || imgData === 'data:,' || canvas.width === 0 || canvas.height === 0) {
          console.error('Canvas generation failed:', { imgData: imgData.substring(0, 50), width: canvas.width, height: canvas.height })
          throw new Error('Failed to generate canvas image')
        }
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: false, // Don't compress for better quality
          precision: 16, // High precision for better quality
        })

        // A4 dimensions in mm
        const pageWidth = pdf.internal.pageSize.getWidth()  // 210mm
        const pageHeight = pdf.internal.pageSize.getHeight() // 297mm
        
        // Calculate proper image dimensions maintaining aspect ratio
        const imgAspectRatio = canvas.width / canvas.height
        const pageAspectRatio = pageWidth / pageHeight
        
        let imgWidth, imgHeight
        
        if (imgAspectRatio > pageAspectRatio) {
          // Canvas is wider - fit to width
          imgWidth = pageWidth
          imgHeight = pageWidth / imgAspectRatio
        } else {
          // Canvas is taller - fit to height  
          imgHeight = pageHeight
          imgWidth = pageHeight * imgAspectRatio
        }
        
        // Center the image on the page
        const x = (pageWidth - imgWidth) / 2
        const y = (pageHeight - imgHeight) / 2
        
        // For multi-page content, split the canvas
        let currentY = 0
        let pageNumber = 0
        
        while (currentY < canvas.height) {
          if (pageNumber > 0) {
            pdf.addPage()
          }
          
          // Calculate what portion of the canvas to show on this page
          const remainingCanvasHeight = canvas.height - currentY
          const canvasHeightForThisPage = Math.min(remainingCanvasHeight, canvas.height / 3) // Assuming 3 pages
          
          // Create a portion of the image for this page
          const cropCanvas = document.createElement('canvas')
          cropCanvas.width = canvas.width
          cropCanvas.height = canvasHeightForThisPage
          const cropCtx = cropCanvas.getContext('2d')
          
          cropCtx.drawImage(canvas, 0, currentY, canvas.width, canvasHeightForThisPage, 0, 0, canvas.width, canvasHeightForThisPage)
          
          const cropImgData = cropCanvas.toDataURL('image/png', 1.0) // Maximum quality
          
          // Add this portion to the PDF page, fitting full page
          pdf.addImage(cropImgData, 'PNG', 0, 0, pageWidth, pageHeight, '', 'FAST')
          
          currentY += canvasHeightForThisPage
          pageNumber++
        }

        // Save the PDF
        const fileName = `Cotizacion_${data.quote.quote_number}_${moment().format('YYYYMMDD')}.pdf`
        pdf.save(fileName)
      } finally {
        // Clean up temporary element
        document.body.removeChild(tempDiv)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw error
    }
  }

  /**
   * Generate HTML content for Sue Events quote
   */
  private static generateQuoteHTML(data: PDFQuoteData & { template?: QuoteTemplate }): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(amount)
    }

    const formatDate = (dateStr: string) => {
      return moment(dateStr).format('MMMM DD [de] YYYY')
    }

    // Calculate services for the table
    const services = []
    
    // Add employee services
    data.employees.forEach(emp => {
      services.push({
        description: `${emp.employee_type} - ${emp.employee_name} (${emp.hours} horas)`,
        value: formatCurrency(emp.total_cost)
      })
    })

    // 🔥 NEW: Handle multiple transport zones with manual distribution
    const multipleZones = data.quote.multiple_transport_zones || []
    const hasMultipleZones = multipleZones && multipleZones.length > 0
    
    // Create a copy of products to modify with transport costs
    const productsWithTransport = [...data.products]
    
    if (hasMultipleZones && data.marginMode !== 'per_line') {
      // Distribute ALL transport costs from zones (manual or automatic)
      // Skip transport distribution if marginMode is per_line (already included in product costs)
      console.log('🔧 PDF: marginMode is', data.marginMode, '- applying transport distribution')
      multipleZones.forEach((zoneInput: any, zoneIndex: number) => {
        const baseCost = zoneInput.zone?.base_cost || 0
        const equipmentCost = zoneInput.includeEquipmentTransport ? (zoneInput.zone?.additional_equipment_cost || 0) : 0
        const totalZoneCost = (baseCost + equipmentCost) * (zoneInput.transportCount || 1)
        
        const useManualDistribution = zoneInput.useFlexibleTransport && zoneInput.transportAllocations && zoneInput.transportAllocations.length > 0
        
        if (useManualDistribution) {
          console.log(`📊 Zone ${zoneIndex + 1} (${zoneInput.zone?.name}): Using MANUAL distribution - Total: ${formatCurrency(totalZoneCost)}`)
          
          const costPerTransport = baseCost + equipmentCost
          
          // Distribute according to manual allocations
          zoneInput.transportAllocations.forEach((allocation: any) => {
            const productIndex = productsWithTransport.findIndex(p => p.product_id === allocation.productId)
            if (productIndex >= 0) {
              const transportCost = allocation.quantity * costPerTransport
              productsWithTransport[productIndex] = {
                ...productsWithTransport[productIndex],
                total_cost: (productsWithTransport[productIndex].total_cost || 0) + transportCost
              }
              console.log(`  → Product ${allocation.productId}: +${formatCurrency(transportCost)} (${allocation.quantity} transports)`)
            }
          })
        } else {
          console.log(`⚖️ Zone ${zoneIndex + 1} (${zoneInput.zone?.name}): Using AUTOMATIC distribution - Total: ${formatCurrency(totalZoneCost)}`)
          
          // Distribute equally among all products
          const productsForThisZone = zoneInput.transportProductIds && zoneInput.transportProductIds.length > 0 
            ? productsWithTransport.filter(p => zoneInput.transportProductIds.includes(p.product_id))
            : productsWithTransport
          
          const costPerProduct = productsForThisZone.length > 0 ? totalZoneCost / productsForThisZone.length : 0
          
          productsForThisZone.forEach(prod => {
            const productIndex = productsWithTransport.findIndex(p => p.product_id === prod.product_id)
            if (productIndex >= 0) {
              productsWithTransport[productIndex] = {
                ...productsWithTransport[productIndex],
                total_cost: (productsWithTransport[productIndex].total_cost || 0) + costPerProduct
              }
              console.log(`  → Product ${prod.product_id}: +${formatCurrency(costPerProduct)} (automatic)`)
            }
          })
        }
      })
    } else if (hasMultipleZones && data.marginMode === 'per_line') {
      console.log('🔧 PDF: marginMode is per_line - skipping transport distribution (already included in product costs)')
    }
    
    // Add product services (now with transport costs included for manual zones)
    productsWithTransport.forEach(prod => {
      const quantity = prod.quantity || 1
      const baseDescription = quantity > 1 
        ? `${prod.product_name} (${quantity} ${prod.product?.unit || 'unidades'})`
        : prod.product_name
      
      services.push({
        description: baseDescription,
        value: formatCurrency(prod.total_cost || 0)
      })
    })

    // 🔥 NEW: Handle multiple transport zones - NO separate transport lines
    // Transport costs are now distributed into products above
    if (!hasMultipleZones) {
      // Compatibilidad con implementación anterior (zona única)
      const useManualTransport = data.quote.use_flexible_transport || false
      if (!useManualTransport) {
        const transportCost = data.summary.transport_subtotal || 0
        if (transportCost > 0) {
          services.push({
            description: 'Transporte y logística',
            value: formatCurrency(transportCost)
          })
        }
      }
    }
    // Para múltiples zonas, los costos ya están distribuidos en los productos

    return this.getHTMLTemplate(data, services, formatCurrency, formatDate, data.template)
  }

  private static getHTMLTemplate(
    data: PDFQuoteData, 
    services: any[], 
    formatCurrencyFn: Function, 
    formatDateFn: Function, 
    template?: QuoteTemplate
  ): string {
    // Use only the actual services from the quote
    const allServices = [...services]

    return `
      <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.4;
            color: #333;
            background: #f8f9fa;
            width: 100%;
            height: 100%;
        }
        
        .document {
            width: 794px;
            background: white;
            margin: 0;
            padding: 0;
            font-size: 100%;
            zoom: 1;
        }
        
        .page {
            width: 794px;
            height: 1123px;
            padding: 0;
            margin: 0;
            background: white;
            position: relative;
            page-break-after: always;
            box-sizing: border-box;
            overflow: hidden;
        }
        
        .page:last-child {
            page-break-after: avoid;
        }
        
        .header-container {
            position: relative;
            height: 200px;
            overflow: hidden;
        }
        
        .pink-section {
            position: absolute;
            top: 0;
            left: 0;
            width: 75%;
            height: 100%;
            background: linear-gradient(135deg, #f3d3f1, #dbb1e4);
            z-index: 1;
        }
        
        .gray-section {
            position: absolute;
            top: 0;
            right: 0;
            width: 40%;
            height: 100%;
            background: #dbb1e4;
            z-index: 2;
        }
        
        .blue-section {
            position: absolute;
            top: 0;
            right: 0;
            width: 25%;
            height: 100%;
            background: #b391e0;
            z-index: 3;
        }
        
        .logo-container {
            position: absolute;
            top: 40px;
            left: 40px;
            z-index: 4;
            color: white;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .logo-image {
            width: 90px;
            height: 90px;
            object-fit: contain;
            filter: brightness(0) invert(1);
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
            image-rendering: pixelated;
        }
        
        .logo-text-container {
            display: flex;
            flex-direction: column;
        }
        
        .sue-text {
            font-size: 28px;
            font-weight: 400;
            color: white;
            font-style: italic;
            margin-bottom: 10px;
        }
        
        .logo-events {
            font-family: 'Arial', sans-serif;
            font-size: 14px;
            font-weight: 300;
            letter-spacing: 8px;
            margin-bottom: 8px;
            text-align: left;
        }
        
        .logo-tagline {
            font-family: 'Arial', sans-serif;
            font-size: 9px;
            font-weight: 300;
            letter-spacing: 3px;
            opacity: 0.9;
            text-align: left;
            line-height: 1.2;
        }
        
        .logo-rut {
            font-family: 'Arial', sans-serif;
            font-size: 10px;
            font-weight: 300;
            opacity: 0.8;
            text-align: left;
            margin-top: 8px;
        }
        
        .content {
            padding: 40px;
        }
        
        .quote-header {
            margin-bottom: 30px;
        }
        
        .quote-title {
            font-size: 32px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .quote-number {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .quote-date {
            font-size: 14px;
            color: #666;
            margin-bottom: 30px;
        }
        
        .section-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 15px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 100px 1fr;
            gap: 8px 15px;
            font-size: 13px;
        }
        
        .label {
            font-weight: 600;
            color: #2c3e50;
        }
        
        .value {
            color: #2c3e50;
        }
        
        .services-container {
            margin: 40px 0;
        }
        
        .services-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        .services-table th {
            background: #2c3e50;
            color: white;
            padding: 12px;
            text-align: left;
            font-size: 14px;
            font-weight: bold;
        }
        
        .services-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
            font-size: 13px;
        }
        
        .services-table .service-desc {
            width: 70%;
        }
        
        .services-table .service-price {
            width: 30%;
            text-align: right;
            font-weight: 600;
        }
        
        .total-row {
            background: #f8f9fa;
        }
        
        .total-row td {
            font-weight: bold;
            font-size: 16px;
            padding: 15px 12px;
        }
        
        .total-amount {
            color: #2c3e50;
            font-size: 18px;
        }
        
        .disclaimer {
            background: #b391e0;
            color: white;
            padding: 8px 15px;
            margin: 20px 0;
            font-size: 11px;
            font-weight: bold;
            text-align: center;
        }
        
        .footer-contact {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
        
        .contact-line {
            margin: 3px 0;
        }

        .page-content {
            font-size: 13px;
            margin-bottom: 25px;
            line-height: 1.5;
        }

        .payment-section {
            margin-bottom: 25px;
        }

        .payment-title {
            font-weight: bold;
            margin-bottom: 4px;
        }

        .payment-detail {
            margin-bottom: 4px;
        }

        .requirements-section {
            margin-bottom: 25px;
        }

        .requirement-item {
            margin-bottom: 4px;
            font-size: 13px;
        }

        .observations-section {
            font-size: 13px;
        }

        .observation-item {
            margin-bottom: 4px;
        }

        .signature-section {
            margin-top: 40px;
        }

        .signature-name {
            font-weight: bold;
            font-size: 14px;
            margin-top: 15px;
        }
      </style>
      
      <div class="document">
        <!-- Página 1 -->
        <div class="page">
            <div class="header-container">
                <div class="pink-section"></div>
                <div class="gray-section"></div>
                <div class="blue-section"></div>
                
                <div class="logo-container">
                    <img src="${sueLogoUrl}" alt="Sue Events Logo" class="logo-image">
                </div>
            </div>
            
            <div class="content">
                <div class="quote-header">
                    <div class="quote-title">COTIZACIÓN</div>
                    <div class="quote-number">No. ${data.quote.quote_number}</div>
                    <div class="quote-date">${this.getEventDateDisplay(data.quote, formatDateFn)}</div>
                </div>
                
                <div class="section-container">
                    <div>
                        <div class="section-title">DATOS DEL CLIENTE</div>
                        <div class="info-grid">
                            <div class="label">Empresa</div>
                            <div class="value">${data.client.name}</div>
                            <div class="label">Nit</div>
                            <div class="value">${data.client.tax_id || ''}</div>
                            ${this.getClientContact(data.client) ? `
                            <div class="label">Contacto</div>
                            <div class="value">${this.getClientContact(data.client)}</div>` : ''}
                            ${this.getClientPhone(data.client) ? `
                            <div class="label">Teléfono</div>
                            <div class="value">${this.getClientPhone(data.client)}</div>` : ''}
                            ${this.getClientEmail(data.client) ? `
                            <div class="label">E-mail</div>
                            <div class="value">${this.getClientEmail(data.client)}</div>` : ''}
                            ${data.client.city ? `
                            <div class="label">Ciudad</div>
                            <div class="value">${data.client.city}</div>` : ''}
                            ${data.client.address ? `
                            <div class="label">Dirección</div>
                            <div class="value">${data.client.address}</div>` : ''}
                        </div>
                    </div>
                    
                    <div>
                        <div class="section-title">DATOS DEL EVENTO</div>
                        <div class="info-grid">
                            <div class="label">Nombre</div>
                            <div class="value">${data.quote.event_title || ''}</div>
                            <div class="label">Tipo de Evento</div>
                            <div class="value">${data.quote.client_type === 'corporativo' ? 'Corporativo' : 'Social'}</div>
                            <div class="label">Fecha(s)</div>
                            <div class="value">${this.getEventDateDisplay(data.quote, formatDateFn)}</div>
                            <div class="label">Horario</div>
                            <div class="value">${this.getEventTimeDisplay(data.quote)}</div>
                            <div class="label">Ciudad</div>
                            <div class="value">${data.quote.event_city || data.quote.event_location?.split(',')[1]?.trim() || ''}</div>
                            <div class="label">Dirección</div>
                            <div class="value">${data.quote.event_location || data.quote.event_address || ''}</div>
                        </div>
                        ${this.isMultidayEvent(data.quote) ? `
                        <div style="margin-top: 20px;">
                            <div class="section-title">CRONOGRAMA DETALLADO</div>
                            <div style="margin-top: 10px;">
                                ${this.formatMultidayScheduleHTML(data.quote.daily_schedules!)}
                            </div>
                        </div>` : ''}
                    </div>
                </div>
                
                <div class="services-container">
                    <table class="services-table">
                        <thead>
                            <tr>
                                <th class="service-desc">SERVICIO</th>
                                <th class="service-price">VALOR</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allServices.map(service => `
                                <tr>
                                    <td class="service-desc">${service.description}</td>
                                    <td class="service-price">${service.value}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td class="service-desc">TOTAL</td>
                                <td class="service-price total-amount">${formatCurrencyFn(data.summary.total_cost)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="disclaimer">
                        ESTE VALOR NO INCLUYE RETENCIONES QUE NOS REALICEN.
                    </div>
                </div>
                
                <div class="footer-contact">
                    <div class="contact-line">Celular / Whatsapp: ${template?.company_phone || '3174421013'}</div>
                    <div class="contact-line">Email: ${template?.company_email || 'comercial@sue-events.com'}</div>
                    <div class="contact-line">Instagram: ${template?.company_instagram || '@sueevents'}</div>
                </div>
            </div>
        </div>
        
        <!-- Página 2 -->
        <div class="page">
            <div class="header-container">
                <div class="pink-section"></div>
                <div class="gray-section"></div>
                <div class="blue-section"></div>
                
                <div class="logo-container">
                    <img src="${sueLogoUrl}" alt="Sue Events Logo" class="logo-image">
                </div>
            </div>
            
            <div class="content">
                <div class="section-title">${template?.includes_title || 'INCLUYE'}</div>
                <div class="page-content">
                    ${this.formatContentAsHTML(template?.includes_content || 
                      'Show culinario con equipos profesionales y utensilios especializados\nIngredientes premium para degustación. Menú personalizado según preferencias del cliente.\nChef especializado con experiencia en eventos corporativos\nTransporte de equipos y logística completa')}
                </div>
                
                <div class="section-title">${template?.payment_title || 'FORMA DE PAGO'}</div>
                <div class="payment-section">
                    ${this.formatContentAsHTML(template?.payment_content || 
                      'Anticipo: 50% - tres (3) semanas antes, para reservar la fecha del evento.\nSaldo: 50% - el primer día del evento\nCuenta de ahorros de Bancolombia No. 10743399787 - Peggy Cervantes - CC. 22.461.151\nElaboramos cuenta de cobro como documento para solicitar el pago del servicio.')}
                </div>
                
                <div class="section-title">${template?.requirements_title || 'REQUERIMIENTOS DE INSTALACIÓN PARA EQUIPOS'}</div>
                <div class="requirements-section">
                    ${this.formatContentAsHTML(template?.requirements_content || 
                      'La instalación se realiza dos horas antes de iniciar el evento.\nCada equipo de cocción debe estar conectado a un punto de 110v, por separado.\nPara eventos en hoteles o centros de convenciones, el cliente nos debe suministrar el punto eléctrico del equipo dentro del área asignada para su mejor funcionamiento.\nEn el caso de algún daño eléctrico en el lugar del evento que ocasioné daños a nuestros equipos, o que su personal los conecten en puntos 220 v, el cliente debe pagar el arreglo de este.\nNinguno de los equipos se puede brandear o pegar algún adhesivo. Se puede adherir con cinta de enmascarar la etiqueta del logo de su empresa o del cliente.')}
                </div>
                
                <div class="section-title">${template?.observations_title || 'OBSERVACIONES'}</div>
                <div class="observations-section">
                    ${this.formatContentAsHTML(template?.observations_content || 
                      'Para requerir el servicio por favor enviar una orden de compra que contenga el tipo de servicio, cantidad, fecha, lugar, horario del evento, y las fechas de pago.\nSi en el lugar del evento (Centros de Convenciones, Hoteles, etc.) solicitan descorche por nuestros productos y/o servicios, el cliente debe realizar este pago.\nLa cantidad de servicios contratados, es independiente al número de personas que asisten a su evento\nLos servicios acordados de esta oferta deben ser prestados durante el horario del evento, ya que al ser servicios personalizados no se realizaran devoluciones o disminuciones de las cantidades solicitadas inicialmente.')}
                </div>
                
                <div class="footer-contact">
                    <div class="contact-line">Celular / Whatsapp: ${template?.company_phone || '3174421013'}</div>
                    <div class="contact-line">Email: ${template?.company_email || 'comercial@sue-events.com'}</div>
                    <div class="contact-line">Instagram: ${template?.company_instagram || '@sueevents'}</div>
                </div>
            </div>
        </div>
        
        <!-- Página 3 -->
        <div class="page">
            <div class="header-container">
                <div class="pink-section"></div>
                <div class="gray-section"></div>
                <div class="blue-section"></div>
                
                <div class="logo-container">
                    <img src="${sueLogoUrl}" alt="Sue Events Logo" class="logo-image">
                </div>
            </div>
            
            <div class="content">
                <div class="page-content">
                    * En el caso que durante el evento no se consuman los servicios acordados y/o el horario del evento haya disminuido, el saldo por pagar por el cliente es el mismo, dado que las compras de las materias primas, las preparaciones de los productos, los acuerdos con el personal especializado, de transporte y de reservas de estadías, en el caso de estas últimas para otras ciudades, ya fueron realizadas.
                </div>
                
                <div style="font-size: 13px; margin-bottom: 8px;">* Se autoriza el uso de imágenes del evento para ser publicadas en nuestras redes sociales.</div>
                <div style="font-size: 13px; margin-bottom: 40px;">* La vigencia de la presente cotización es de 30 días.</div>
                
                <div style="margin-bottom: 25px;">
                    Esperamos hacer realidad esta solicitud para su completa satisfacción.
                </div>
                
                <div style="margin-bottom: 25px;">
                    Si necesita alguna otra información, no dude en contactarnos.
                </div>
                
                <div class="signature-section">
                    <div style="margin-bottom: 15px;">
                        Atentamente,
                    </div>
                    
                    <div class="signature-name">
                        ${template?.signature_name || 'PEGGY CERVANTES G.'}
                    </div>
                </div>
                
                <div class="footer-contact">
                    <div class="contact-line">Celular / Whatsapp: ${template?.company_phone || '3174421013'}</div>
                    <div class="contact-line">Email: ${template?.company_email || 'comercial@sue-events.com'}</div>
                    <div class="contact-line">Instagram: ${template?.company_instagram || '@sueevents'}</div>
                </div>
            </div>
        </div>
      </div>
    `
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let yPosition = margin

    // Helper functions
    const addNewPageIfNeeded = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
        addHeader(true)
        return true
      }
      return false
    }

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(amount)
    }

    // Add header
    const addHeader = (isNewPage = false) => {
      // Company logo/name
      doc.setFillColor(25, 118, 210) // Primary color
      doc.rect(0, 0, pageWidth, 30, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('SUE EVENTS', margin, 15)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Sistema Unificado de Eventos', margin, 22)
      
      // Quote number
      doc.setFontSize(12)
      doc.text(data.quote.quote_number, pageWidth - margin, 15, { align: 'right' })
      doc.setFontSize(9)
      doc.text('Cotización', pageWidth - margin, 20, { align: 'right' })
      
      doc.setTextColor(33, 33, 33) // Reset text color
      
      if (!isNewPage) {
        yPosition = 40
      } else {
        yPosition = 35
      }
    }

    addHeader()

    // Client information section
    doc.setFillColor(245, 245, 245)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 35, 'F')
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('INFORMACIÓN DEL CLIENTE', margin + 5, yPosition + 7)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let clientY = yPosition + 14
    doc.text(`Cliente: ${data.client.name}`, margin + 5, clientY)
    doc.text(`Tipo: ${data.client.type === 'corporativo' ? 'Corporativo' : 'Social'}`, margin + 100, clientY)
    
    clientY += 6
    doc.text(`Contacto: ${data.client.contact_person || 'N/A'}`, margin + 5, clientY)
    doc.text(`Teléfono: ${data.client.phone || 'N/A'}`, margin + 100, clientY)
    
    clientY += 6
    if (data.client.email) {
      doc.text(`Email: ${data.client.email}`, margin + 5, clientY)
    }
    if (data.client.address) {
      doc.text(`Dirección: ${data.client.address}`, margin + 100, clientY)
    }

    yPosition += 40

    // Event information
    doc.setFillColor(245, 245, 245)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 25, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('INFORMACIÓN DEL EVENTO', margin + 5, yPosition + 7)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let eventY = yPosition + 14
    doc.text(`Evento: ${data.quote.event_title}`, margin + 5, eventY)
    const eventDateDisplay = this.isMultidayEvent(data.quote) 
      ? this.getEventDateDisplay(data.quote, (date: string) => moment(date).format('DD/MM/YYYY'))
      : moment(data.quote.event_date).format('DD/MM/YYYY')
    doc.text(`Fecha: ${eventDateDisplay}`, margin + 100, eventY)
    
    eventY += 6
    doc.text(`Duración: ${(data.quote as any).duration_hours || 4} horas`, margin + 5, eventY)
    doc.text(`Asistentes: ${data.quote.estimated_attendees}`, margin + 100, eventY)

    yPosition += 30

    // Employees section
    if (data.employees.length > 0) {
      addNewPageIfNeeded(30 + data.employees.length * 8)
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('PERSONAL ASIGNADO', margin, yPosition)
      yPosition += 7

      // Table header
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F')
      
      doc.setFontSize(9)
      doc.text('Empleado', margin + 2, yPosition + 5)
      doc.text('Tipo', margin + 60, yPosition + 5)
      doc.text('Horas', margin + 100, yPosition + 5)
      doc.text('Tarifa/Hora', margin + 120, yPosition + 5)
      doc.text('Total', pageWidth - margin - 2, yPosition + 5, { align: 'right' })
      
      yPosition += 10
      doc.setFont('helvetica', 'normal')
      
      data.employees.forEach((emp) => {
        doc.setFontSize(9)
        doc.text(emp.employee_name, margin + 2, yPosition)
        doc.text(emp.employee_type, margin + 60, yPosition)
        doc.text(`${emp.hours}h`, margin + 100, yPosition)
        doc.text(formatCurrency(emp.hourly_rate), margin + 120, yPosition)
        doc.text(formatCurrency(emp.total_cost), pageWidth - margin - 2, yPosition, { align: 'right' })
        yPosition += 6
      })
      
      // Subtotal
      doc.setLineWidth(0.5)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 5
      doc.setFont('helvetica', 'bold')
      doc.text('Subtotal Personal:', margin + 100, yPosition)
      doc.text(formatCurrency(data.summary.employees_subtotal), pageWidth - margin - 2, yPosition, { align: 'right' })
      
      yPosition += 10
    }

    // Products section
    if (data.products.length > 0) {
      addNewPageIfNeeded(30 + data.products.length * 8)
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('PRODUCTOS Y SERVICIOS', margin, yPosition)
      yPosition += 7

      // Table header
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F')
      
      doc.setFontSize(9)
      doc.text('Producto', margin + 2, yPosition + 5)
      doc.text('Cantidad', margin + 80, yPosition + 5)
      doc.text('Total', pageWidth - margin - 2, yPosition + 5, { align: 'right' })
      
      yPosition += 10
      doc.setFont('helvetica', 'normal')
      
      data.products.forEach((prod) => {
        doc.setFontSize(9)
        const productName = prod.product_name.length > 40 
          ? prod.product_name.substring(0, 40) + '...' 
          : prod.product_name
        doc.text(productName, margin + 2, yPosition)
        doc.text(prod.quantity.toString(), margin + 80, yPosition)
        doc.text(formatCurrency(prod.total_cost), pageWidth - margin - 2, yPosition, { align: 'right' })
        yPosition += 6
      })
      
      // Subtotal
      doc.setLineWidth(0.5)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 5
      doc.setFont('helvetica', 'bold')
      doc.text('Subtotal Productos:', margin + 100, yPosition)
      doc.text(formatCurrency(data.summary.products_subtotal), pageWidth - margin - 2, yPosition, { align: 'right' })
      
      yPosition += 10
    }

    // Transport section - Handle multiple zones or legacy single zone
    const multipleZones = data.quote.multiple_transport_zones || []
    const hasMultipleZones = multipleZones && multipleZones.length > 0
    const legacyTransportCost = data.summary.transport_subtotal || 0
    
    if (hasMultipleZones) {
      // Nueva implementación: Múltiples zonas de transporte
      addNewPageIfNeeded(30 + (multipleZones.length * 8))
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('TRANSPORTE - MÚNLTIPLES ZONAS', margin, yPosition)
      yPosition += 10
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      
      multipleZones.forEach((zoneInput: any, index: number) => {
        const zoneName = zoneInput.zone?.name || `Zona ${index + 1}`
        const transportCount = zoneInput.transportCount || 1
        const includeEquipment = zoneInput.includeEquipmentTransport || false
        const baseCost = zoneInput.zone?.base_cost || 0
        const equipmentCost = includeEquipment ? (zoneInput.zone?.additional_equipment_cost || 0) : 0
        const unitCost = baseCost + equipmentCost
        const totalZoneCost = unitCost * transportCount
        
        // Nombre de la zona
        doc.setFont('helvetica', 'bold')
        doc.text(`• ${zoneName}:`, margin + 5, yPosition)
        yPosition += 5
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        
        // Detalles
        if (transportCount > 1) {
          doc.text(`   - ${transportCount} transportes x ${formatCurrency(unitCost)}`, margin + 10, yPosition)
          yPosition += 4
        }
        if (includeEquipment) {
          doc.text(`   - Incluye equipo adicional (+${formatCurrency(equipmentCost)} c/u)`, margin + 10, yPosition)
          yPosition += 4
        }
        if (zoneInput.useFlexibleTransport) {
          doc.text(`   - Distribución manual por productos`, margin + 10, yPosition)
          yPosition += 4
        }
        
        // Costo total de esta zona
        doc.setFontSize(9)
        doc.text(`   Total zona: ${formatCurrency(totalZoneCost)}`, margin + 10, yPosition)
        yPosition += 8
      })
      
      // Línea divisoria
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 5
      
      // Total general de transporte
      doc.setFont('helvetica', 'bold')
      doc.text('Total Transporte:', margin + 100, yPosition)
      const totalTransportCost = multipleZones.reduce((total: number, zoneInput: any) => {
        const baseCost = zoneInput.zone?.base_cost || 0
        const equipmentCost = zoneInput.includeEquipmentTransport ? (zoneInput.zone?.additional_equipment_cost || 0) : 0
        const transportCount = zoneInput.transportCount || 1
        return total + ((baseCost + equipmentCost) * transportCount)
      }, 0)
      doc.text(formatCurrency(totalTransportCost), pageWidth - margin - 2, yPosition, { align: 'right' })
      
      yPosition += 10
      
    } else if (legacyTransportCost > 0) {
      // Compatibilidad: Implementación anterior (zona única)
      addNewPageIfNeeded(20)
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('TRANSPORTE', margin, yPosition)
      yPosition += 7
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('Costo de transporte:', margin + 100, yPosition)
      doc.text(formatCurrency(legacyTransportCost), pageWidth - margin - 2, yPosition, { align: 'right' })
      
      yPosition += 10
    }

    // Financial summary
    addNewPageIfNeeded(60)
    
    doc.setFillColor(25, 118, 210)
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('RESUMEN FINANCIERO', margin + 5, yPosition + 5)
    doc.setTextColor(33, 33, 33)
    
    yPosition += 12
    
    // Summary details
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    const summaryItems = [
      { label: 'Subtotal:', value: data.summary.subtotal },
      { label: 'Margen de Ganancia:', value: data.summary.margin_amount }
    ]
    
    // ULTRATHINK: Retención eliminada del PDF - solo para uso interno
    
    summaryItems.forEach(item => {
      doc.text(item.label, margin + 100, yPosition)
      const value = item.value < 0 
        ? `-${formatCurrency(Math.abs(item.value))}`
        : formatCurrency(item.value)
      doc.text(value, pageWidth - margin - 2, yPosition, { align: 'right' })
      yPosition += 6
    })
    
    // Total
    doc.setLineWidth(1)
    doc.line(margin + 95, yPosition, pageWidth - margin, yPosition)
    yPosition += 6
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('TOTAL A PAGAR:', margin + 85, yPosition)
    doc.setTextColor(25, 118, 210)
    doc.text(formatCurrency(data.summary.total_cost), pageWidth - margin - 2, yPosition, { align: 'right' })
    doc.setTextColor(33, 33, 33)
    
    yPosition += 15

    // Terms and conditions
    addNewPageIfNeeded(40)
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('TÉRMINOS Y CONDICIONES', margin, yPosition)
    yPosition += 6
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const terms = [
      '• Esta cotización tiene una validez de 30 días a partir de la fecha de emisión.',
      '• Se requiere un anticipo del 50% para confirmar la reserva del evento.',
      '• El saldo restante debe ser cancelado 24 horas antes del evento.',
      '• Los precios incluyen todo el personal y equipos especificados.',
      '• Cualquier servicio adicional no incluido en esta cotización será facturado por separado.',
      '• En caso de cancelación, aplicarán las políticas de cancelación vigentes.'
    ]
    
    terms.forEach(term => {
      const lines = doc.splitTextToSize(term, pageWidth - 2 * margin - 5)
      lines.forEach((line: string) => {
        doc.text(line, margin + 2, yPosition)
        yPosition += 4
      })
      yPosition += 1
    })

    // Footer
    const footerY = pageHeight - 15
    // Save the PDF
    const fileName = `Cotizacion_${data.quote.quote_number}_${moment().format('YYYYMMDD')}.pdf`
    doc.save(fileName)
  }

  static async generateQuoteFromHTML(elementId: string, quoteName: string): Promise<void> {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error('Element not found')
    }

    const canvas = await html2canvas(element, {
      scale: 3, // Increased for better resolution
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff',
      dpi: 300, // High DPI
      letterRendering: true, // Better text rendering
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // Improve image rendering in cloned document
        const images = clonedDoc.querySelectorAll('img');
        images.forEach(img => {
          img.style.imageRendering = 'crisp-edges';
          img.style.imageRendering = '-webkit-optimize-contrast';
        });
      }
    })

    const imgData = canvas.toDataURL('image/png', 1.0) // Maximum quality
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: false, // Don't compress for better quality
      precision: 16, // High precision
    })

    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST')
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST')
      heightLeft -= pageHeight
    }

    pdf.save(`${quoteName}.pdf`)
  }

  static async generateEmployeeSchedule(
    employees: Employee[],
    shifts: any[],
    startDate: string,
    endDate: string
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15
    let yPosition = margin

    // Header
    doc.setFillColor(25, 118, 210)
    doc.rect(0, 0, pageWidth, 25, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('CALENDARIO DE DISPONIBILIDAD', margin, 15)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`${moment(startDate).format('DD/MM/YYYY')} - ${moment(endDate).format('DD/MM/YYYY')}`, margin, 20)
    
    doc.setTextColor(33, 33, 33)
    yPosition = 35

    // Create calendar grid
    const daysInRange = moment(endDate).diff(moment(startDate), 'days') + 1
    const cellWidth = (pageWidth - 2 * margin - 40) / Math.min(daysInRange, 7)
    const cellHeight = 8
    const employeeColWidth = 40

    // Draw header row with dates
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, yPosition, employeeColWidth, cellHeight, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Empleado', margin + 2, yPosition + 5)

    let currentDate = moment(startDate)
    for (let i = 0; i < Math.min(daysInRange, 7); i++) {
      const xPos = margin + employeeColWidth + i * cellWidth
      doc.setFillColor(240, 240, 240)
      doc.rect(xPos, yPosition, cellWidth, cellHeight, 'F')
      doc.setFontSize(8)
      doc.text(currentDate.format('DD/MM'), xPos + 2, yPosition + 5)
      currentDate.add(1, 'day')
    }

    yPosition += cellHeight + 2

    // Draw employee rows
    doc.setFont('helvetica', 'normal')
    employees.forEach(employee => {
      // Employee name
      doc.setFontSize(9)
      doc.text(
        employee.name.length > 15 
          ? employee.name.substring(0, 15) + '...' 
          : employee.name,
        margin + 2, 
        yPosition + 5
      )

      // Draw availability for each day
      currentDate = moment(startDate)
      for (let i = 0; i < Math.min(daysInRange, 7); i++) {
        const xPos = margin + employeeColWidth + i * cellWidth
        const dayShifts = shifts.filter(s => 
          s.employee_id === employee.id && 
          s.date === currentDate.format('YYYY-MM-DD')
        )

        if (dayShifts.length > 0) {
          const shift = dayShifts[0]
          let color = [200, 200, 200] // Default gray
          let text = ''

          switch (shift.status) {
            case 'available':
              color = [76, 175, 80] // Green
              text = 'D'
              break
            case 'booked':
              color = [244, 67, 54] // Red
              text = 'O'
              break
            case 'vacation':
              color = [33, 150, 243] // Blue
              text = 'V'
              break
            case 'sick':
              color = [255, 152, 0] // Orange
              text = 'E'
              break
          }

          doc.setFillColor(color[0], color[1], color[2])
          doc.rect(xPos, yPosition, cellWidth - 1, cellHeight - 1, 'F')
          
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(7)
          doc.text(text, xPos + cellWidth / 2 - 1, yPosition + 5)
          doc.setTextColor(33, 33, 33)
        } else {
          // Empty cell
          doc.setDrawColor(200, 200, 200)
          doc.rect(xPos, yPosition, cellWidth - 1, cellHeight - 1, 'S')
        }

        currentDate.add(1, 'day')
      }

      yPosition += cellHeight
    })

    // Legend
    yPosition += 10
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Leyenda:', margin, yPosition)
    
    const legendItems = [
      { color: [76, 175, 80], text: 'D - Disponible' },
      { color: [244, 67, 54], text: 'O - Ocupado' },
      { color: [33, 150, 243], text: 'V - Vacaciones' },
      { color: [255, 152, 0], text: 'E - Enfermo' }
    ]

    doc.setFont('helvetica', 'normal')
    legendItems.forEach((item, index) => {
      const xPos = margin + 20 + index * 40
      doc.setFillColor(item.color[0], item.color[1], item.color[2])
      doc.rect(xPos, yPosition - 3, 4, 4, 'F')
      doc.setFontSize(8)
      doc.text(item.text, xPos + 6, yPosition)
    })

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 10
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text(`Generado el ${moment().format('DD/MM/YYYY HH:mm')}`, pageWidth / 2, footerY, { align: 'center' })

    // Save PDF
    doc.save(`Calendario_Disponibilidad_${moment().format('YYYYMMDD')}.pdf`)
  }
}

export default PDFGeneratorService