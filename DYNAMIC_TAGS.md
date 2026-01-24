# Email Template Dynamic Tags

This document lists all available dynamic tags that can be used in email templates to personalize communications with students.

## Available Tags

### Student Information
| Tag | Description | Example |
|-----|-------------|---------|
| `{name}` | Student's full name | Ahmed Ali |
| `{email}` | Student's email address | ahmed@example.com |
| `{location}` | Student's location | Cairo, Egypt |
| `{language}` | Student's preferred language | English |
| `{note}` | Additional notes about the student | VIP student |

### Cohort & Status
| Tag | Description | Example |
|-----|-------------|---------|
| `{cohort}` | Student's cohort assignment | Cohort 1 |
| `{status}` | Student's current status | Active |

### Contact Information
| Tag | Description | Example |
|-----|-------------|---------|
| `{linkedin}` | Student's LinkedIn profile URL | https://linkedin.com/in/ahmed |
| `{whatsapp}` | Student's WhatsApp number | +20123456789 |
| `{figmaEmail}` | Student's Figma account email | ahmed@figma.com |

### Payment Information
| Tag | Description | Example |
|-----|-------------|---------|
| `{totalAmount}` | Total course fee | 2500 |
| `{paidAmount}` | Amount paid so far | 1500 |
| `{remaining}` | Remaining balance | 1000 |
| `{paymentMethod}` | Method of payment | Credit Card |

## Example Templates

### Example 1: Community Invitation
**Subject:** Join our {cohort} community, {name}!

**Body:**
```
Hi {name},

Welcome to the Design Tokens Bootcamp {cohort}!

We're excited to have you join our learning community. Here are some important links:

📱 WhatsApp Community: [Link to WhatsApp group]
💬 General Discussion: [Link to discussion forum]
🎯 {cohort} Specific Group: [Link to cohort group]

Your registered email: {email}
Location: {location}
Language: {language}

If you have any questions, feel free to reach out!

Best regards,
Design Tokens Team
```

### Example 2: Payment Reminder
**Subject:** Payment Due - {name}

**Body:**
```
Hi {name},

This is a friendly reminder about your outstanding balance.

💰 Payment Summary:
• Total Amount: {totalAmount}
• Already Paid: {paidAmount}
• Remaining Balance: {remaining}

Payment Method: {paymentMethod}

Please complete your payment at your earliest convenience.

Thank you!
Design Tokens Camp
```

### Example 3: Feedback Form
**Subject:** Share Your Experience, {name}!

**Body:**
```
Hi {name},

We hope you enjoyed the {cohort}! Your feedback is invaluable to us.

Please take 5 minutes to fill out our feedback form:
[Link to feedback form]

Your insights help us improve future cohorts.

Thank you for being part of the Design Tokens family!

Best regards,
Design Tokens Team
```

### Example 4: Bootcamp Agreement
**Subject:** Bootcamp Agreement - {name}

**Body:**
```
Hi {name},

Welcome to the Design Tokens Bootcamp {cohort}!

Please review and sign our bootcamp agreement:
[Link to agreement form]

Cohort Information:
• Status: {status}
• Your Email: {email}
• Location: {location}

Once you've signed, you'll get access to all course materials.

See you soon!
Design Tokens Team
```

## Tips for Using Dynamic Tags

1. **Use Tags to Personalize**: Always include `{name}` in the greeting to make emails feel personal.

2. **Conditional Information**: Only use tags if they're likely to have values. For example, `{linkedin}` might be empty for some students.

3. **Professional Tone**: Combine tags with static text to maintain professionalism:
   ```
   Hello {name},
   
   Thank you for registering for {cohort}. Your confirmation email has been sent to {email}.
   ```

4. **Payment Tracking**: Use payment tags together for comprehensive payment reminders:
   ```
   Total: {totalAmount} | Paid: {paidAmount} | Remaining: {remaining}
   ```

5. **Location-Based Content**: Use location tag to customize content:
   ```
   Hello {name},
   
   We noticed you're from {location}. Here are some local resources for {cohort}...
   ```

## Testing Tags

When creating a new template:
1. Go to **Settings** → **Email Templates**
2. Click **Create New Template**
3. Use the dynamic tags in both Subject and Body
4. Go to **Students** and click ✈️ on a student to send a test email
5. Check the email to verify all tags were replaced correctly

---

**Last Updated:** January 24, 2026
