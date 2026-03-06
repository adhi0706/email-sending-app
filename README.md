# AI Smart Email Campaign System

A full-stack email campaign management system with AI-powered email generation, client management, and comprehensive tracking capabilities.

## Features

### 1. Authentication
- Secure login and registration system using Supabase Auth
- JWT-based authentication
- Protected routes and API endpoints

### 2. Client Management
- Upload clients via CSV file
- Required CSV columns: `slno`, `name`, `email`, `company`
- View all clients in a clean dashboard
- Delete all clients option

### 3. Email Composer
- Rich email composer with subject and body fields
- AI-powered email generation using OpenAI
- Save drafts for later use
- Load and edit saved drafts
- Delete unwanted drafts

### 4. Recipient Selection
Multiple ways to select email recipients:
- **Checkbox Selection**: Manually select individual clients
- **Range Selection**: Select clients by SL number range (e.g., 1-10, 20-40)
- **SL Number Selection**: Select specific SL numbers (e.g., 1, 5, 10, 15)
- **Select All**: Select all clients at once
- **Clear**: Clear all selections

### 5. Email Personalization
Built-in placeholder support:
- `{{name}}` - Client name
- `{{email}}` - Client email
- `{{company}}` - Client company
- Custom fields: Add your own keywords and values

### 6. Sending System
- Send emails to selected clients only
- Automatic placeholder replacement
- Maximum 100 emails per batch
- 2-second delay between sends
- Comprehensive error handling

### 7. Email Logs
- Track all sent and failed emails
- Filter by status (All, Sent, Failed)
- View detailed error messages
- Statistics dashboard
- Complete email history with timestamps

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for blazing-fast development
- Tailwind CSS for styling
- Lucide React for icons
- Supabase Client for API calls

### Backend
- Supabase (PostgreSQL) for database
- Supabase Edge Functions (Deno runtime)
- Row Level Security (RLS) for data protection
- OpenAI API for email generation

## Project Structure

```
project/
├── src/
│   ├── components/
│   │   └── Layout.tsx          # Main layout with navigation
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication context
│   ├── lib/
│   │   └── supabase.ts         # Supabase client configuration
│   ├── pages/
│   │   ├── AuthPage.tsx        # Login/Register page
│   │   ├── ClientsPage.tsx     # Client management
│   │   ├── ComposerPage.tsx    # Email composer
│   │   └── LogsPage.tsx        # Email logs
│   ├── App.tsx                 # Main app component
│   └── main.tsx                # App entry point
├── supabase/
│   └── functions/
│       ├── generate-email/     # AI email generation function
│       │   └── index.ts
│       └── send-emails/        # Email sending function
│           └── index.ts
└── .env.example                # Environment variables template
```

## Database Schema

### Tables

1. **clients** - Stores client information
   - id, user_id, slno, name, email, company, created_at

2. **email_drafts** - Stores saved email drafts
   - id, user_id, subject, body, created_at, updated_at

3. **custom_fields** - Stores custom placeholder values
   - id, draft_id, keyword, value, created_at

4. **email_logs** - Tracks all sent/failed emails
   - id, user_id, client_id, subject, body, status, error_message, sent_at

All tables are protected with Row Level Security (RLS) policies.

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- A Supabase account and project
- OpenAI API key (for AI email generation)
- Email service credentials (Gmail recommended)

### Step 1: Clone and Install

```bash
# Navigate to project directory
cd project

# Install dependencies
npm install
```

### Step 2: Environment Configuration

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under API.

### Step 3: Configure Edge Function Secrets

The following secrets need to be configured for Edge Functions:

- `OPENAI_API_KEY` - Your OpenAI API key for email generation
- `EMAIL_USER` - Your email address (e.g., your-email@gmail.com)
- `EMAIL_PASS` - Your email password or app-specific password
- `SMTP_HOST` - SMTP server (default: smtp.gmail.com)
- `SMTP_PORT` - SMTP port (default: 587)

### Step 4: Database Setup

The database schema has already been created with the following tables:
- clients
- email_drafts
- custom_fields
- email_logs

All tables have Row Level Security enabled.

### Step 5: Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:5173`

## Usage Guide

### 1. Create an Account
- Open the application
- Click "Sign up"
- Enter your email and password (minimum 6 characters)
- Sign in with your credentials

### 2. Upload Clients
- Navigate to the "Clients" tab
- Prepare a CSV file with columns: `slno,name,email,company`
- Click "Upload CSV" and select your file
- Verify clients are displayed in the table

### 3. Compose an Email

#### Manual Composition
- Navigate to "Email Composer"
- Enter a subject line
- Write your email body
- Use placeholders: `{{name}}`, `{{email}}`, `{{company}}`
- Add custom fields if needed

#### AI Generation
- Click "Generate with AI"
- Describe the email you want (e.g., "Create a professional product introduction email")
- Click "Generate"
- Review and edit the generated content

### 4. Select Recipients
- Choose a selection mode:
  - **Checkbox**: Manually select clients
  - **Range**: Enter start and end SL numbers
  - **By SL No**: Enter comma-separated SL numbers
  - **Select All**: Select all clients
- Review selected count in the send button

### 5. Send Emails
- Click "Send to X Clients"
- Wait for the sending process to complete
- View results in the success message
- Check "Email Logs" for detailed tracking

### 6. Track Email History
- Navigate to "Email Logs"
- Filter by status (All, Sent, Failed)
- View statistics and detailed information
- Check error messages for failed emails

## CSV File Format

Your CSV file should follow this exact format:

```csv
slno,name,email,company
1,John Doe,john@example.com,Acme Corp
2,Jane Smith,jane@example.com,Tech Solutions
3,Bob Johnson,bob@example.com,Innovation Labs
```

**Important:**
- First row must be the header: `slno,name,email,company`
- Each subsequent row is a client record
- Email addresses must be valid
- All fields are required

## Email Placeholder Examples

```
Subject: Special offer for {{company}}

Dear {{name}},

We hope this email finds you well. We're reaching out to {{email}}
because we have an exciting opportunity for {{company}}.

[Your content here]

Best regards,
Your Team
```

With custom fields:
```
Hi {{name}},

Your {{custom_field}} is ready!
```

## Security Features

- JWT-based authentication
- Row Level Security on all database tables
- Secure API endpoints
- Environment variable protection
- Email validation
- Rate limiting (100 emails per batch)

## Limitations

- Maximum 100 emails per batch
- 2-second delay between emails (to prevent spam detection)
- Requires valid email credentials
- OpenAI API usage costs apply for AI generation

## Troubleshooting

### Email Not Sending
1. Verify EMAIL_USER and EMAIL_PASS are correct
2. For Gmail, use an App Password instead of your regular password
3. Enable "Less secure app access" or use OAuth2

### AI Generation Not Working
1. Verify OPENAI_API_KEY is configured
2. Check your OpenAI account has available credits
3. Review the error message in the UI

### CSV Upload Fails
1. Ensure CSV has the correct format
2. Check that email addresses are valid
3. Verify all required columns are present

### Database Errors
1. Check Supabase project is active
2. Verify environment variables are correct
3. Ensure you're authenticated

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues and questions, please check the troubleshooting section or review the code comments for detailed implementation notes.
