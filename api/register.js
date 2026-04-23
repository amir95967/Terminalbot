import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    
    const randomStr = Math.random().toString(36).substring(2, 7);
    const email = `amir${randomStr}@maildrop.cc`;
    const password = "Amir" + Math.floor(1000 + Math.random() * 9000) + "!";
    
    try {
        const response = await fetch(`https://chrome.browserless.io/content?token=${process.env.BROWSERLESS_KEY}`, {
            method: 'POST',
            body: JSON.stringify({ 
                url: "https://www.terminalx.com/customer/account/create/",
                waitForSelector: { selector: "input[name='firstname']" } // תיקון כאן: הפכנו לאובייקט
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Browserless Error: ${errorText}`);
        }

        // שמירה לסופהבייס לאחר אימות שהדף נטען
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
