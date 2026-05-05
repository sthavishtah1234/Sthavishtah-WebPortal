# Sthavishtah Yoga and Wellness

## Setup Instructions

### Adding Logo and QR Code

1. **Logo**: 
   - Place your logo file at: `/public/images/logo.png`
   - Recommended size: 512x512px or larger with a transparent background
   - The logo appears in two places:
     - In the white stripe at the top of the homepage
     - In the hero section of the homepage

2. **WhatsApp QR Code**:
   - Place your WhatsApp QR code at: `/public/images/whatsapp-qr.png`
   - Recommended size: 500x500px

### Contact Information

The website is configured to display the Instagram handle @sthavishtah. If you need to update this, you can modify it in the following files:
- `app/page.tsx` (in the footer section)

### Running the Project

1. Install dependencies:
   \`\`\`
   npm install --legacy-peer-deps
   \`\`\`
   
   If you encounter dependency issues, run:
   \`\`\`
   npm run fix-deps
   \`\`\`
   This will run a script to fix dependency conflicts.

2. Run the development server:
   \`\`\`
   npm run dev
   \`\`\`

3. Build for production:
   \`\`\`
   npm run build
   \`\`\`

4. Start the production server:
   \`\`\`
   npm start
   \`\`\`

### Troubleshooting Dependency Issues

If you encounter errors related to React version conflicts during installation:

1. Make sure you have Node.js version 16 or higher installed
2. Run the fix-deps script:
   \`\`\`
   npm run fix-deps
   \`\`\`
3. Alternatively, you can manually install with:
   \`\`\`
   npm install --legacy-peer-deps
   \`\`\`

## Project Structure

- `/public/images/` - Store all images here
- `/app/` - Next.js app router pages
- `/components/` - Reusable React components
- `/lib/` - Utility functions and helpers
