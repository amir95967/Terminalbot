import { createClient } from '@supabase/supabase-js';
const { chromium } = require('playwright-core');
const chromiumLib = require('@sparticuz/chromium');

export default async function handler(req, res) {
    // הגדרת המפתחות מתוך ה-Environment Variables של Vercel
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    let browser;
    try {
        // הגדרות דפדפן קלות במיוחד כדי לא לחרוג מהזיכרון של Vercel
        browser = await chromium.launch({
            args: chromiumLib.args,
            executablePath: await chromiumLib.executablePath(),
            headless: true,
        });

        const context = await browser.newContext();
        const page = await context.newPage();

        // יצירת אימייל זמני
        const randomStr = Math.random().toString(36).substring(2, 8);
        const email = `user${randomStr}@maildrop.cc`;
        const password = "Pass" + Math.floor(1000 + Math.random() * 9000) + "!";

        // גלישה לטרמינל X - עם Timeout קצר יותר
        await page.goto('https://www.terminalx.com/customer/account/create/', { waitUntil: 'networkidle', timeout: 30000 });

        // מילוי הטופס (התאמה לשדות של טרמינל X)
        await page.fill('input[name="firstname"]', 'Amir');
        await page.fill('input[name="lastname"]', 'Bot');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', password);
        
        // בחירת תאריך לידה (כדי לקבל קופון יומולדת)
        // כאן הבוט יבחר תאריך רנדומלי
        await page.click('.birthday-field'); // דוגמה, יש לוודא סלקטור מדויק

        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000); // מחכה שיישלח

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
        console.error(error);
        return res.status(500).send("Bot Error: " + error.message);
    } finally {
        if (browser) await browser.close();
    }
}
