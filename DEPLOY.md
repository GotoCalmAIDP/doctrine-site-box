# Deployment Guide — Doctrine Site

## Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Start development server
npm run serve

# Build for production
npm run build
```

The site will be available at `http://localhost:8080`

---

## Deploy to GitHub Pages

### Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository (e.g., `doctrine-site`)
3. Set visibility to **Private** or **Public** as needed

### Step 2: Push Code to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: doctrine-site structural shell"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/doctrine-site.git

# Push
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The workflow will run automatically on push

### Step 4: Access Your Site

After the workflow completes, your site will be available at:
```
https://YOUR_USERNAME.github.io/doctrine-site/
```

---

## Project Structure

```
doctrine-site/
├── .eleventy.js          # Eleventy configuration
├── package.json          # Dependencies and scripts
├── DEPLOY.md             # This file
├── css/
│   └── style.css         # Minimal clean CSS
├── src/
│   ├── _includes/
│   │   └── base.njk      # Base layout template
│   ├── _data/            # Global data (empty)
│   ├── en/               # English pages
│   │   ├── en.json       # Language config
│   │   ├── index.md
│   │   ├── about.md
│   │   ├── doctrine.md
│   │   ├── cases.md
│   │   ├── method.md
│   │   ├── boundaries.md
│   │   └── contact.md
│   ├── ua/               # Ukrainian pages
│   │   ├── ua.json       # Language config
│   │   └── ... (same structure)
│   └── index.njk         # Root language selector
├── _site/                # Built output (gitignored)
└── .github/
    └── workflows/
        └── deploy.yml    # GitHub Actions workflow
```

---

## Adding Content

1. Edit Markdown files in `src/en/` and `src/ua/`
2. Replace `[PLACEHOLDER]` blocks with actual content
3. Maintain parallel structure between languages
4. Commit and push to trigger deployment

---

## Custom Domain (Optional)

1. Add a `CNAME` file to the `src/` folder with your domain
2. Configure DNS with your domain provider
3. Enable HTTPS in GitHub Pages settings

---

## Troubleshooting

**Build fails:**
- Check Node.js version (requires 18+)
- Run `npm ci` to reinstall dependencies
- Check for syntax errors in Markdown files

**Pages not updating:**
- Wait 2-3 minutes for GitHub Actions to complete
- Check Actions tab for workflow status
- Clear browser cache

**Language switcher broken:**
- Ensure both EN and UA versions of the page exist
- Check URL structure matches `/en/` and `/ua/` pattern
