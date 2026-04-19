# Vercel Deployment Guide

This guide explains how to deploy the Valentine's Love Wall frontend to Vercel.

## Issue: Monorepo Structure

This repository has a monorepo structure:
```
.
├── backend/          # NestJS API (not deployed to Vercel)
└── valentines/       # Next.js frontend (deploy this to Vercel)
```

Vercel needs to know that the Next.js app is in the `valentines/` subdirectory.

## Solution 1: Configure Root Directory in Vercel Dashboard (Recommended)

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **General**
3. Scroll to **Root Directory** section
4. Click **Edit**
5. Enter: `valentines`
6. Click **Save**
7. Redeploy your project

## Solution 2: Use vercel.json Configuration

Create a `vercel.json` file in the repository root:

```json
{
  "buildCommand": "cd valentines && npm run build",
  "devCommand": "cd valentines && npm run dev",
  "installCommand": "cd valentines && npm install",
  "framework": "nextjs",
  "outputDirectory": "valentines/.next"
}
```

Then commit and push:
```bash
git add vercel.json
git commit -m "chore: add Vercel configuration for monorepo"
git push
```

## Environment Variables

Make sure to set these environment variables in Vercel:

### Required
- `NEXT_PUBLIC_API_URL` - Your backend API URL (e.g., `https://your-backend.com`)

### Optional
- `NODE_ENV` - Set to `production` (usually automatic)

### Setting Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Add each variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your backend URL
   - **Environment**: Production, Preview, Development (select as needed)
3. Click **Save**
4. Redeploy for changes to take effect

## Backend Deployment

**Important**: Vercel is for the **frontend only**. The backend (`backend/` directory) needs to be deployed separately.

### Backend Deployment Options:

1. **Railway** - Easy Node.js deployment
2. **Render** - Free tier available
3. **Fly.io** - Good for Docker deployments
4. **Heroku** - Classic PaaS option
5. **AWS/GCP/Azure** - Full control with Docker

See [DOCKER.md](./DOCKER.md) for containerized deployment options.

## Deployment Steps

### First Time Setup

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click **Add New** → **Project**
   - Import your GitHub repository
   - Select the repository

2. **Configure Project**
   - **Framework Preset**: Next.js
   - **Root Directory**: `valentines`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

3. **Set Environment Variables**
   - Add `NEXT_PUBLIC_API_URL`
   - Add any other required variables

4. **Deploy**
   - Click **Deploy**
   - Wait for build to complete

### Subsequent Deployments

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you create/update a pull request

## Troubleshooting

### Error: "Couldn't find any `pages` or `app` directory"

**Cause**: Vercel is building from the wrong directory.

**Solution**: Set Root Directory to `valentines` (see Solution 1 above)

### Error: "Module not found" or dependency issues

**Cause**: Dependencies not installed correctly.

**Solution**:
1. Check `valentines/package.json` has all dependencies
2. Delete `node_modules` and `package-lock.json`
3. Run `npm install` locally
4. Commit the updated `package-lock.json`
5. Redeploy

### Build succeeds but app doesn't work

**Cause**: Missing environment variables.

**Solution**:
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_API_URL` is set in Vercel
3. Ensure backend is deployed and accessible
4. Check CORS settings on backend

### API calls fail (CORS errors)

**Cause**: Backend not configured for frontend domain.

**Solution**: Update backend CORS settings to allow your Vercel domain:

```typescript
// backend/src/main.ts
app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true,
});
```

### Build timeout

**Cause**: Build takes too long.

**Solution**:
1. Check for large dependencies
2. Optimize build process
3. Consider upgrading Vercel plan for more build time

## Custom Domain

1. Go to **Settings** → **Domains**
2. Click **Add**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for DNS propagation (can take up to 48 hours)

## Preview Deployments

Every pull request gets a unique preview URL:
- Automatically deployed on PR creation
- Updated on every push to PR branch
- Perfect for testing before merging

## Production Deployment

To deploy to production:
```bash
git checkout main
git merge feature/your-feature
git push origin main
```

Vercel will automatically deploy to production.

## Rollback

If a deployment has issues:
1. Go to **Deployments** tab
2. Find a previous working deployment
3. Click **⋯** → **Promote to Production**

## Monitoring

Vercel provides:
- **Analytics**: Page views, performance metrics
- **Logs**: Runtime and build logs
- **Speed Insights**: Core Web Vitals

Access these in your project dashboard.

## Best Practices

1. **Test locally first**: Always test builds locally before pushing
   ```bash
   cd valentines
   npm run build
   npm start
   ```

2. **Use preview deployments**: Test changes in preview before merging to main

3. **Set up branch protection**: Require CI checks to pass before merging

4. **Monitor performance**: Use Vercel Analytics to track performance

5. **Keep dependencies updated**: Regularly update packages for security

## CI/CD Integration

The project includes a GitHub Actions CI pipeline. Configure Vercel to:
1. Wait for CI checks before deploying
2. Only deploy if all tests pass

In Vercel settings:
- **Git** → **Ignored Build Step**: Add condition to check CI status

## Cost Considerations

**Vercel Free Tier includes**:
- Unlimited deployments
- 100 GB bandwidth/month
- Automatic HTTPS
- Preview deployments

**Upgrade if you need**:
- More bandwidth
- Longer build times
- Team collaboration features
- Advanced analytics

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

## Quick Reference

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from CLI
cd valentines
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

---

**Next Steps**:
1. Configure Root Directory in Vercel Dashboard
2. Set environment variables
3. Deploy backend separately
4. Test the deployment
5. Set up custom domain (optional)
