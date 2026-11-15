import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const result=[];
for(const url of ['https://kitsumi.app/vi/home','http://localhost:3000/vi/home']){
 await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForTimeout(2500);await page.keyboard.press('Escape');
 result.push(await page.evaluate(()=>{const box=e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return {tag:e.tagName,cls:e.className,text:e.innerText.slice(0,90),x:r.x,y:r.y,w:r.width,h:r.height,padding:c.padding,gap:c.gap,font:c.fontSize,line:c.lineHeight,border:c.borderRadius,bg:c.backgroundColor}};const main=document.querySelector('main');return {url:location.href,viewport:innerWidth,main:main&&box(main),headings:[...document.querySelectorAll('main h1,main h2,main h3')].slice(0,12).map(box),panels:[...main.querySelectorAll('[class*="rounded"],.panel')].filter(e=>e.getBoundingClientRect().width>500&&e.getBoundingClientRect().height>50).slice(0,18).map(box),nav:[...document.querySelectorAll('aside a')].slice(0,4).map(box)}}));
}
await fs.writeFile('qa/visual-comparison.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();
