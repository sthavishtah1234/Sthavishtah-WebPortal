# Razorpay Live Keys Setup

This guide will help you set up your application to use Razorpay live keys directly.

## Setup Instructions

1. **Copy the Template File**:
   - Copy `.env.local.template` to `.env.local`
   - Replace the placeholders with your actual live keys

2. **Add Your Live Keys**:
   \`\`\`
   RAZORPAY_KEY_ID=rzp_live_your_actual_key
   RAZORPAY_KEY_SECRET=your_actual_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   \`\`\`

3. **Restart Your Application**:
   - After updating the `.env.local` file, restart your Next.js server

## Important Notes When Using Live Keys

1. **Real Transactions**: All payments will process real money
2. **Testing Considerations**:
   - Use small amounts (₹1) for testing to minimize refund hassle
   - You'll need to refund test payments manually
3. **Security**: Keep your live keys secure and never commit them to version control

## Deployment

When deploying to production:

1. **Set Environment Variables on Your Hosting Platform**:
   - Add all variables from `.env.local` to your hosting platform (Vercel, etc.)

2. **Never Commit API Keys to Version Control**:
   - Add `.env.local` to your `.gitignore`

## Troubleshooting

If you encounter issues:

1. Visit `/admin/api-verification` to check your configuration
2. Check the browser console for any JavaScript errors
3. Verify your webhook configuration if you're using webhooks
