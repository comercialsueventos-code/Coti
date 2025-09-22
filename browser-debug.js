// 🤖 ULTRATHINK Browser Debug Script
// Paste este script en la consola del navegador mientras tienes la aplicación abierta

(function() {
    console.log('🤖 ULTRATHINK: Iniciando debugging browser-side...');
    
    const debugReport = {
        timestamp: new Date().toISOString(),
        current_page: window.location.href,
        currency_values: [],
        quote_numbers: [],
        discrepancies: [],
        dom_analysis: {}
    };

    // Función para buscar todos los valores monetarios en la página
    function findAllCurrencyValues() {
        console.log('💰 Buscando valores monetarios...');
        
        const allElements = document.querySelectorAll('*');
        const currencyValues = [];
        
        allElements.forEach((element, index) => {
            const text = element.textContent || '';
            
            // Buscar patrones de moneda ($XXX,XXX o COP XXX,XXX)
            const currencyMatches = text.match(/(\$|COP)\s*[\d,]+\.?\d*/gi);
            
            if (currencyMatches) {
                currencyMatches.forEach(match => {
                    const cleanValue = match.replace(/[^\d,\.]/g, '');
                    currencyValues.push({
                        raw_value: match,
                        clean_value: cleanValue,
                        element_tag: element.tagName,
                        element_id: element.id,
                        element_class: element.className,
                        parent_element: element.parentElement?.tagName,
                        full_text: text.substring(0, 100).trim(),
                        xpath: getElementXPath(element)
                    });
                });
            }
        });
        
        debugReport.currency_values = currencyValues;
        console.log(`💰 Encontrados ${currencyValues.length} valores monetarios:`, currencyValues);
        return currencyValues;
    }

    // Función para buscar números de cotización
    function findAllQuoteNumbers() {
        console.log('📄 Buscando números de cotización...');
        
        const allElements = document.querySelectorAll('*');
        const quoteNumbers = [];
        
        allElements.forEach((element) => {
            const text = element.textContent || '';
            
            // Buscar patrón SUE-YYYY-XXX
            const quoteMatches = text.match(/SUE-\d{4}-\d{3}/g);
            
            if (quoteMatches) {
                quoteMatches.forEach(match => {
                    quoteNumbers.push({
                        quote_number: match,
                        element_tag: element.tagName,
                        element_id: element.id,
                        element_class: element.className,
                        parent_element: element.parentElement?.tagName,
                        full_text: text.substring(0, 100).trim(),
                        xpath: getElementXPath(element)
                    });
                });
            }
        });
        
        debugReport.quote_numbers = quoteNumbers;
        console.log(`📄 Encontrados ${quoteNumbers.length} números de cotización:`, quoteNumbers);
        return quoteNumbers;
    }

    // Función para buscar específicamente los valores problemáticos
    function findProblematicValues() {
        console.log('🚨 Buscando valores problemáticos (232,643 y 224,643)...');
        
        const problematicValues = debugReport.currency_values.filter(cv => 
            cv.clean_value.includes('232,643') || cv.clean_value.includes('224,643') ||
            cv.clean_value.includes('232643') || cv.clean_value.includes('224643')
        );
        
        if (problematicValues.length > 0) {
            console.log('🚨 VALORES PROBLEMÁTICOS ENCONTRADOS:', problematicValues);
            debugReport.discrepancies = problematicValues;
            
            // Resaltar elementos en la página
            problematicValues.forEach(pv => {
                const element = document.evaluate(pv.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (element) {
                    element.style.border = '3px solid red';
                    element.style.backgroundColor = 'yellow';
                    element.setAttribute('data-ultrathink-debug', 'problematic-value');
                }
            });
        } else {
            console.log('✅ No se encontraron valores problemáticos específicos');
        }
        
        return problematicValues;
    }

    // Función para analizar binding issues
    function analyzeBindingIssues() {
        console.log('🔍 Analizando posibles problemas de binding...');
        
        // Buscar elementos que podrían tener binding incorrecto
        const suspiciousElements = [];
        
        debugReport.quote_numbers.forEach(qn => {
            debugReport.currency_values.forEach(cv => {
                // Si un número de cotización aparece cerca de un valor monetario, verificar contexto
                const quoteElement = document.evaluate(qn.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                const currencyElement = document.evaluate(cv.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                
                if (quoteElement && currencyElement) {
                    const distance = getElementDistance(quoteElement, currencyElement);
                    if (distance < 500) { // Si están cerca en el DOM
                        suspiciousElements.push({
                            quote: qn,
                            currency: cv,
                            distance: distance,
                            potential_issue: 'Quote number near currency value - possible binding confusion'
                        });
                    }
                }
            });
        });
        
        debugReport.dom_analysis.suspicious_elements = suspiciousElements;
        console.log('🔍 Elementos sospechosos encontrados:', suspiciousElements);
        return suspiciousElements;
    }

    // Función para analizar el estado de React/Vue (si existe)
    function analyzeReactState() {
        console.log('⚛️ Analizando estado de React...');
        
        // Buscar componentes React
        const reactComponents = [];
        const allElements = document.querySelectorAll('[data-reactroot], [data-reactid]');
        
        allElements.forEach(element => {
            if (element._reactInternalFiber || element._reactInternalInstance) {
                reactComponents.push({
                    element: element.tagName,
                    has_react_data: true,
                    props: element._reactInternalFiber?.memoizedProps || 'N/A'
                });
            }
        });
        
        debugReport.dom_analysis.react_components = reactComponents;
        console.log('⚛️ Componentes React encontrados:', reactComponents.length);
    }

    // Función para analizar console.logs relacionados con cálculos
    function captureCalculationLogs() {
        console.log('📊 Buscando logs de cálculos...');
        
        // Override console.log to capture calculation-related logs
        const originalLog = console.log;
        const calculationLogs = [];
        
        console.log = function(...args) {
            const logText = args.join(' ');
            if (logText.includes('ULTRATHINK') || 
                logText.includes('calculation') || 
                logText.includes('232') || 
                logText.includes('224') ||
                logText.includes('total') ||
                logText.includes('subtotal')) {
                calculationLogs.push({
                    timestamp: new Date().toISOString(),
                    message: logText,
                    args: args
                });
            }
            originalLog.apply(console, args);
        };
        
        debugReport.dom_analysis.calculation_logs = calculationLogs;
        
        // Restaurar después de 5 segundos
        setTimeout(() => {
            console.log = originalLog;
            console.log('📊 Logs capturados:', calculationLogs);
        }, 5000);
    }

    // Funciones auxiliares
    function getElementXPath(element) {
        if (element.id) {
            return `//*[@id="${element.id}"]`;
        }
        if (element === document.body) {
            return '/html/body';
        }
        
        let ix = 0;
        const siblings = element.parentNode?.childNodes || [];
        for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            if (sibling === element) {
                return getElementXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
            }
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                ix++;
            }
        }
    }

    function getElementDistance(el1, el2) {
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();
        
        const dx = rect1.left - rect2.left;
        const dy = rect1.top - rect2.top;
        
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Función principal de debugging
    function runFullDebug() {
        console.log('🤖 ULTRATHINK: Ejecutando análisis completo...');
        
        findAllCurrencyValues();
        findAllQuoteNumbers();
        findProblematicValues();
        analyzeBindingIssues();
        analyzeReactState();
        captureCalculationLogs();
        
        // Crear reporte final
        setTimeout(() => {
            console.log('📋 REPORTE FINAL DE DEBUG:', debugReport);
            
            // Crear resumen visual
            if (debugReport.discrepancies.length > 0) {
                console.log('%c🚨 PROBLEMAS ENCONTRADOS:', 'color: red; font-weight: bold; font-size: 16px;');
                debugReport.discrepancies.forEach(d => {
                    console.log(`❌ Valor: ${d.raw_value} en ${d.element_tag}.${d.element_class}`);
                });
            } else {
                console.log('%c✅ No se encontraron discrepancias específicas', 'color: green; font-weight: bold;');
            }
            
            // Mostrar estadísticas
            console.log(`💰 Total valores monetarios: ${debugReport.currency_values.length}`);
            console.log(`📄 Total números cotización: ${debugReport.quote_numbers.length}`);
            console.log(`🔍 Elementos sospechosos: ${debugReport.dom_analysis.suspicious_elements?.length || 0}`);
            
            // Guardar en window para acceso posterior
            window.ULTRATHINK_DEBUG_REPORT = debugReport;
            console.log('💾 Reporte guardado en window.ULTRATHINK_DEBUG_REPORT');
            
        }, 6000);
    }

    // Exponer funciones globalmente para uso manual
    window.ULTRATHINK_DEBUG = {
        runFullDebug,
        findAllCurrencyValues,
        findAllQuoteNumbers,
        findProblematicValues,
        analyzeBindingIssues,
        getReport: () => debugReport
    };

    console.log('🤖 ULTRATHINK Debug Tools instaladas. Usa ULTRATHINK_DEBUG.runFullDebug() para análisis completo');
    
    // Ejecutar automáticamente
    runFullDebug();
})();