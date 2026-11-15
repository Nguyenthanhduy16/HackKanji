import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
let passed=false;
try{await page.goto('http://localhost:3000/vi/grammar?level=N1',{waitUntil:'networkidle'});await expect(page.getByRole('tab',{name:'JLPT N1',exact:true})).toHaveAttribute('aria-selected','true');await page.getByRole('tab',{name:'JLPT N4',exact:true}).click();await expect(page.getByRole('tab',{name:'JLPT N4',exact:true})).toHaveAttribute('aria-selected','true');passed=true;}finally{await fs.writeFile('qa/grammar-deeplink.json',JSON.stringify({passed}));await browser.close();}
