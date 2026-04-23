import { createClient } from '@supabase/supabase-js';
const { chromium } = require('playwright-core');
const chromiumLib = require('@sparticuz/chromium');

export default async function handler(req, res) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    let browser;

    try {
        browser = await chromium.launch({
            args: chromiumLib.args,
            executablePath: await chromiumLib.executablePath(),
            headless: true,
        });

        const context = await browser.newContext();
        const page = await context.newPage();

        // פרטי משתמש פיקטיביים
        const randomStr = Math.random().toString(36).substring(2, 7);
        const email = `amir${randomStr}@maildrop.cc`;
        const password = "Amir" + Math.floor(1000 + Math.random() * 9000) + "!";

        // גלישה לדף ההרשמה
        await page.goto('https://www.terminalx.com/customer/account/create/', { 
            waitUntil: 'domcontentloaded', 
            timeout: 20000 
        });

        // מילוי שדות חובה
        await page.fill('input[name="firstname"]', 'Amir');
        await page.fill('input[name="lastname"]', 'Shaul');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', password);

        // בחירת מגדר (זכר)
        await page.click('input[value="1"]'); // בדרך כלל 1 זה זכר בטרמינל X

        // מילוי תאריך לידה - זה השלב הקריטי לקופון!
        // הבוט יבחר יום הולדת בחודש הבא כדי שהקופון יגיע מהר
        const nextMonth = new Date().getMonth() + 2; 
        await page.selectOption('select[name="day"]', '15');
        await page.selectOption('select[name="month"]', nextMonth.toString());
        await page.selectOption('select[name="year"]', '1995');

        // לחיצה על כפתור ההרשמה
        await page.click('button.submit');
        
        // המתנה קצרה לוודא שההרשמה עברה
        await page.waitForTimeout(4000);

        // שמירה לסופהבייס
        const { error } = await supabase.from('coupons').insert([
            { 
                terminal_email: email, 
                terminal_password: password, 
                inbox_url: `https://maildrop.cc/inbox/?mailbox=${email.split('@')[0]}` 
            }
        ]);

        if (error) throw error;
        return res.status(200).json({ success: true, email });

    } catch (error) {
        console.error("Bot Error:", error.message);
        return res.status(500).send(error.message);
    } finally {
        if (browser) await browser.close();
    }
}
