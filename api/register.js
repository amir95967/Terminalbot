import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    
    const randomStr = Math.random().toString(36).substring(2, 7);
    const email = `amir${randomStr}@maildrop.cc`;
    const password = "Amir" + Math.floor(1000 + Math.random() * 9000) + "!";
    const nextMonth = (new Date().getMonth() + 2) % 12 || 12;

    // הקוד שירוץ בתוך הדפדפן של Browserless
    const code = `
        module.exports = async ({ page }) => {
            await page.goto('https://www.terminalx.com/customer/account/create/', { waitUntil: 'networkidle0' });
            await page.fill('input[name="firstname"]', 'Amir');
            await page.fill('input[name="lastname"]', 'Shaul');
            await page.fill('input[name="email"]', '${email}');
            await page.fill('input[name="password"]', '${password}');
            await page.click('input[value="1"]');
            await page.selectOption('select[name="day"]', '15');
            await page.selectOption('select[name="month"]', '${nextMonth}');
            await page.selectOption('select[name="year"]', '1995');
            await page.click('button.submit');
            await page.waitForTimeout(5000);
            return { status: 'success' };
        };
    `;

    try {
        const response = await fetch(`https://chrome.browserless.io/function?token=${process.env.BROWSERLESS_KEY}`, {
            method: 'POST',
            body: JSON.stringify({ code }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Browserless Error: ${errorText}`);
        }

        // שמירה לסופהבייס רק אם הבוט הצליח
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
        return res.status(500).json({ error: error.message });
    }
}
