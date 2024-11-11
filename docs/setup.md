# Setup Instructions

## Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with required variables
4. Initialize database: `npm run db:init`
5. Start development server: `npm run dev`

## Deployment
### GitHub Setup
1. Create a new repository on GitHub
2. Add repository secrets:
   - `GLITCH_PROJECT_ID`
   - `GLITCH_AUTH_TOKEN`
   - `JWT_SECRET`

### Glitch Setup
1. Create new project on Glitch
2. Get project ID from project settings
3. Generate auth token from Glitch user settings
4. Add these to GitHub repository secrets

### Automatic Deployment
1. Push changes to main branch
2. GitHub Actions will automatically deploy to Glitch
3. Monitor deployment in GitHub Actions tab
