import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    
    const randomStr = Math.random().toString(36).substring(2, 7);
    const email = `amir${randomStr}@maildrop.cc`;
    const password = "Amir" + Math.floor(1000 + Math.random() * 9000) + "!";
    
    // הגדרת תאריך לידה לחודש הבא לקבלת קופון
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() + 1);
    const day = "15";
    const month = (birthDate.getMonth() + 1).toString();
    const year = "1995";

    try {
        // שליחת בקשת הרשמה ישירה לטרמינל X
        const terminalResponse = await fetch('https://www.terminalx.com/api/v2/customer/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                customer: {
                    firstname: "Amir",
                    lastname: "Shaul",
                    email: email,
                    gender: 1, // 1 = Male
                    dob: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                },
                password: password
            })
        });

        // גם אם טרמינל X חוסם את ה-API, אנחנו נשמור את הפרטים לבדיקה
        // ברוב המקרים זה יחזיר 200 או 400 אם המייל קיים
        const terminalData = await terminalResponse.json().catch(() => ({}));

        const { error } = await supabase.from('coupons').insert([
            { 
                terminal_email: email, 
                terminal_password: password, 
                inbox_url: `https://maildrop.cc/inbox/?mailbox=${email.split('@')[0]}` 
            }
        ]);

        if (error) throw error;
        return res.status(200).json({ success: true, email, password });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
