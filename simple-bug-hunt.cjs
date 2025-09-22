const puppeteer = require('puppeteer');

async function simpleBugHunt() {
  console.log('🔍 SIMPLE BUG HUNT: Looking for calculation discrepancies');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();

  // Listen for console logs
  page.on('console', msg => {
    console.log(`🟦 BROWSER: ${msg.text()}`);
  });

  try {
    // Go to pricing calculator
    await page.goto('http://localhost:3001/pricing');
    console.log('✅ Loaded pricing calculator');
    
    // Wait for page to load completely
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Take initial screenshot
    await page.screenshot({ path: 'hunt-step1-initial.png' });
    console.log('📸 Initial screenshot taken');
    
    // Try to interact with the form using simple JavaScript
    console.log('🖱️ Trying to configure form using JavaScript...');
    
    await page.evaluate(() => {
      // Try to find and fill event name
      const eventNameInput = document.querySelector('input[placeholder*="evento"], input[name*="event"]');
      if (eventNameInput) {
        eventNameInput.value = 'Evento Prueba Debug';
        eventNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('Event name set');
      }
      
      // Try to find and set dates
      const dateInputs = document.querySelectorAll('input[type="date"]');
      if (dateInputs.length >= 2) {
        dateInputs[0].value = '2025-12-20';
        dateInputs[1].value = '2025-12-20';
        dateInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        dateInputs[1].dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Dates set');
      }
      
      // Try to find and set times
      const timeInputs = document.querySelectorAll('input[type="time"]');
      if (timeInputs.length >= 2) {
        timeInputs[0].value = '08:00';
        timeInputs[1].value = '20:00';
        timeInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        timeInputs[1].dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Times set');
      }
    });
    
    // Wait and take another screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'hunt-step2-form-filled.png' });
    console.log('📸 Form filled screenshot taken');
    
    // Try to click "Agregar" buttons to add employees and products
    await page.evaluate(() => {
      const addButtons = document.querySelectorAll('button');
      let employeeAdded = false;
      let productAdded = false;
      
      addButtons.forEach(button => {
        const text = button.textContent || '';
        if (text.includes('Agregar') && !employeeAdded) {
          button.click();
          employeeAdded = true;
          console.log('Employee add button clicked');
        } else if (text.includes('Agregar') && employeeAdded && !productAdded) {
          button.click();
          productAdded = true;
          console.log('Product add button clicked');
        }
      });
    });
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'hunt-step3-items-added.png' });
    console.log('📸 Items added screenshot taken');
    
    // Now extract all monetary values and calculations
    const allData = await page.evaluate(() => {
      const data = {
        money_values: [],
        calculations: [],
        errors: [],
        forms: []
      };
      
      // Find all text content
      document.querySelectorAll('*').forEach(el => {
        const text = el.textContent || '';
        
        // Look for money
        const moneyMatches = text.match(/\$[\s\d,]+\.?\d*/g);
        if (moneyMatches) {
          moneyMatches.forEach(match => {
            data.money_values.push({
              value: match,
              context: text.substring(0, 100),
              element: el.tagName
            });
          });
        }
        
        // Look for calculations
        if (text.includes('Total') || text.includes('Subtotal') || text.includes('Margen')) {
          data.calculations.push({
            text: text.substring(0, 150),
            element: el.tagName
          });
        }
        
        // Look for errors
        if (text.includes('Error') || text.includes('requerido')) {
          data.errors.push(text.substring(0, 100));
        }
        
        // Look for form elements
        if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
          data.forms.push({
            type: el.type,
            value: el.value,
            name: el.name,
            placeholder: el.placeholder
          });
        }
      });
      
      return data;
    });
    
    console.log('\n💰 MONEY VALUES:');
    allData.money_values.forEach((v, i) => console.log(`${i+1}. ${v.value} - ${v.context}`));
    
    console.log('\n📊 CALCULATIONS:');
    allData.calculations.forEach((c, i) => console.log(`${i+1}. ${c.text}`));
    
    console.log('\n❌ ERRORS:');
    allData.errors.forEach((e, i) => console.log(`${i+1}. ${e}`));
    
    console.log('\n📝 FORM ELEMENTS:');
    allData.forms.forEach((f, i) => console.log(`${i+1}. ${f.type} - ${f.value} (${f.name})`));
    
    console.log('\n🎯 ANALYSIS SUMMARY:');
    console.log(`- Found ${allData.money_values.length} monetary values`);
    console.log(`- Found ${allData.calculations.length} calculation elements`);  
    console.log(`- Found ${allData.errors.length} form errors`);
    
    console.log('\n⏸️ Browser staying open for manual inspection (30 seconds)...');
    setTimeout(() => browser.close(), 30000);
    
  } catch (error) {
    console.error('❌ Hunt failed:', error);
    await page.screenshot({ path: 'hunt-error.png' });
    await browser.close();
  }
}

simpleBugHunt();