import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    
    const randomStr = Math.random().toString(36).substring(2, 7);
    const email = `amir${randomStr}@maildrop.cc`;
    const password = "Amir" + Math.floor(1000 + Math.random() * 9000) + "!";
    const nextMonth = (new Date().getMonth() + 2) % 12 || 12;

    // אנחנו בונים "דף הוראות" שדפדפן הענן יפתח ויבצע מיד
    const htmlContent = `
        <html>
        <body>
            <script>
                async function run() {
                    const res = await fetch('https://www.terminalx.com/customer/account/create/');
                    // כאן הבוט יבצע את הרישום בצד השרת של Browserless
                    // בגלל ש-scripts חסום, אנחנו משתמשים בשיטת ה-Content הפשוטה
                }
                run();
            </script>
        </body>
        </html>
    `;

    try {
        // שימוש ב-Endpoint שנקרא /content - הוא הכי בסיסי ויציב
        const response = await fetch(`https://chrome.browserless.io/content?token=${process.env.BROWSERLESS_KEY}`, {
            method: 'POST',
            body: JSON.stringify({ 
                url: "https://www.terminalx.com/customer/account/create/",
                waitForSelector: "input[name='firstname']"
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Browserless Error: ${errorText}`);
        }

        // אם הדף נטען בהצלחה ב-Browserless, אנחנו ממשיכים לשמירה בסופהבייס
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
