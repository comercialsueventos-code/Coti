const puppeteer = require('puppeteer');
const fs = require('fs');

async function reproduceBug() {
  console.log('🎯 ULTRATHINK: Reproducing $232k vs $224k calculation bug');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  // Capture all console logs with calculation data
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('CALCULATION') || text.includes('total') || text.includes('subtotal') || 
        text.includes('232') || text.includes('224') || text.includes('ULTRATHINK')) {
      console.log(`🔍 CALC LOG: ${text}`);
    }
  });

  try {
    console.log('🌐 Loading pricing calculator...');
    await page.goto('http://localhost:3001/pricing', { waitUntil: 'networkidle2' });
    
    console.log('📝 Filling out test quote with high-value items...');
    
    // Step 1: Select client
    console.log('1️⃣ Selecting client...');
    try {
      await page.waitForSelector('[role="button"]:has-text("Cliente"), .MuiSelect-select', { timeout: 5000 });
      await page.click('[role="button"]:has-text("Cliente"), .MuiSelect-select');
      await page.waitForTimeout(1000);
      
      // Select first client option
      const clientOption = await page.$('[role="option"]:first-child, li:first-child');
      if (clientOption) {
        await clientOption.click();
        console.log('✅ Client selected');
      }
    } catch (e) {
      console.log('⚠️ Could not select client:', e.message);
    }

    // Step 2: Set event dates
    console.log('2️⃣ Setting event dates...');
    try {
      // Start date
      const startDateInput = await page.$('input[type="date"]');
      if (startDateInput) {
        await startDateInput.click();
        await startDateInput.evaluate(input => input.value = '2025-12-20');
        await startDateInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // End date  
      const endDateInputs = await page.$$('input[type="date"]');
      if (endDateInputs.length > 1) {
        await endDateInputs[1].click();
        await endDateInputs[1].evaluate(input => input.value = '2025-12-20');
        await endDateInputs[1].dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Start time
      const startTimeInput = await page.$('input[type="time"]');
      if (startTimeInput) {
        await startTimeInput.click();
        await startTimeInput.evaluate(input => input.value = '08:00');
        await startTimeInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // End time
      const endTimeInputs = await page.$$('input[type="time"]');
      if (endTimeInputs.length > 1) {
        await endTimeInputs[1].click();
        await endTimeInputs[1].evaluate(input => input.value = '20:00');
        await endTimeInputs[1].dispatchEvent(new Event('change', { bubbles: true }));
      }

      console.log('✅ Event dates and times set');
    } catch (e) {
      console.log('⚠️ Could not set dates:', e.message);
    }

    await page.waitForTimeout(2000);

    // Step 3: Add multiple employees
    console.log('3️⃣ Adding employees...');
    try {
      for (let i = 0; i < 3; i++) {
        const addEmployeeBtn = await page.$('button:has-text("Agregar")');
        if (addEmployeeBtn) {
          await addEmployeeBtn.click();
          await page.waitForTimeout(500);
          console.log(`✅ Employee ${i+1} added`);
        }
      }
    } catch (e) {
      console.log('⚠️ Could not add employees:', e.message);
    }

    // Step 4: Add multiple products
    console.log('4️⃣ Adding products...');
    try {
      // Look for "Agregar" button in Products section
      const productButtons = await page.$$('button:has-text("Agregar")');
      
      for (let i = 0; i < 3; i++) {
        if (productButtons.length > 1) {
          await productButtons[1].click(); // Second "Agregar" button should be for products
          await page.waitForTimeout(500);
          console.log(`✅ Product ${i+1} added`);
        }
      }
    } catch (e) {
      console.log('⚠️ Could not add products:', e.message);
    }

    await page.waitForTimeout(3000);

    console.log('5️⃣ Taking screenshot of configured form...');
    await page.screenshot({ path: 'debug-configured-form.png' });

    // Step 6: Monitor calculations
    console.log('6️⃣ Monitoring calculations and capturing all displayed values...');
    
    const calculationResults = await page.evaluate(() => {
      const results = {
        all_money_values: [],
        calculation_sections: [],
        total_elements: []
      };

      // Find all monetary values
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const text = el.textContent || '';
        
        // Capture all money patterns
        const moneyMatches = text.match(/\$[\s\d,]+\.?\d*/g);
        if (moneyMatches && moneyMatches.length > 0) {
          moneyMatches.forEach(match => {
            results.all_money_values.push({
              value: match.trim(),
              element: el.tagName,
              className: el.className,
              parentText: text.substring(0, 100)
            });
          });
        }

        // Look for calculation sections
        if (text.includes('Total') || text.includes('Subtotal') || text.includes('Margen') || text.includes('Retención')) {
          results.calculation_sections.push({
            text: text.trim().substring(0, 200),
            element: el.tagName,
            className: el.className
          });
        }

        // Look for specific large amounts that could be our problematic values
        if (text.includes('232') || text.includes('224')) {
          results.total_elements.push({
            text: text.trim(),
            element: el.tagName,
            className: el.className,
            type: 'POTENTIAL_PROBLEMATIC_VALUE'
          });
        }
      });

      return results;
    });

    console.log('\n💰 ALL MONEY VALUES FOUND:');
    calculationResults.all_money_values.forEach((v, i) => {
      console.log(`${i+1}. ${v.value} in ${v.element} - "${v.parentText}"`);
    });

    console.log('\n📊 CALCULATION SECTIONS:');
    calculationResults.calculation_sections.forEach((s, i) => {
      console.log(`${i+1}. ${s.text}`);
    });

    if (calculationResults.total_elements.length > 0) {
      console.log('\n🚨 PROBLEMATIC VALUES FOUND:');
      calculationResults.total_elements.forEach((t, i) => {
        console.log(`${i+1}. ${t.text} in ${t.element}`);
      });
    }

    // Step 7: Try to save the quote to trigger any external display issues
    console.log('7️⃣ Attempting to save quote...');
    try {
      const saveButton = await page.$('button:has-text("Guardar"), button:has-text("Save")');
      if (saveButton) {
        await saveButton.click();
        console.log('✅ Save button clicked');
        await page.waitForTimeout(5000);
        
        // Take screenshot after save
        await page.screenshot({ path: 'debug-after-save.png' });
        
        // Check for success message or quote number
        const afterSaveData = await page.evaluate(() => {
          const results = [];
          const elements = document.querySelectorAll('*');
          
          elements.forEach(el => {
            const text = el.textContent || '';
            if (text.includes('SUE-') || text.includes('232') || text.includes('224') || 
                text.includes('guardado') || text.includes('éxito')) {
              results.push({
                text: text.trim().substring(0, 150),
                element: el.tagName
              });
            }
          });
          
          return results;
        });

        console.log('\n💾 AFTER SAVE DATA:');
        afterSaveData.forEach((d, i) => {
          console.log(`${i+1}. ${d.text}`);
        });
      }
    } catch (e) {
      console.log('⚠️ Could not save quote:', e.message);
    }

    // Final report
    const report = {
      timestamp: new Date().toISOString(),
      all_money_values: calculationResults.all_money_values,
      calculation_sections: calculationResults.calculation_sections,
      problematic_values: calculationResults.total_elements
    };

    fs.writeFileSync('bug-reproduction-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n🎯 BUG REPRODUCTION COMPLETE!');
    console.log('📊 Full report: bug-reproduction-report.json');
    console.log('📸 Screenshots: debug-configured-form.png, debug-after-save.png');
    console.log('\n⏸️ Browser staying open for 30 seconds for manual inspection...');
    
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Bug reproduction failed:', error.message);
    await page.screenshot({ path: 'debug-reproduction-error.png' });
  } finally {
    await browser.close();
  }
}

reproduceBug();