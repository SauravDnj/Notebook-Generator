# 🚀 Vercel Deployment Guide — NoteAI Notebook Generator

## Step 1: Create a GitHub Repository

1. Go to [github.com](https://github.com) → **New Repository**
2. Name it `notebook-generator`
3. Set to **Public** or Private
4. Click **Create Repository**

## Step 2: Push Your Code to GitHub

Open PowerShell in `d:\Saurav\personal\Text\notebook-generator\` and run:

```bash
git init
git add .
git commit -m "Initial commit - NoteAI Notebook Generator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/notebook-generator.git
git push -u origin main
```

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Sign up / Log in** with GitHub
2. Click **"Add New Project"**
3. Select your `notebook-generator` repository
4. Framework will be **auto-detected as Next.js** ✅

## Step 4: Add Environment Variable

In Vercel project settings, before deploying:
- Click **"Environment Variables"**
- Add:
  - **Name**: `GROQ_API_KEY`
  - **Value**: `your_groq_api_key_here`
  - Environment: **Production, Preview, Development**

## Step 5: Deploy

Click **"Deploy"** — Vercel will build and deploy automatically in ~2 minutes!

Your app will be live at: `https://notebook-generator-xxx.vercel.app`

---

## Auto-Redeploy

Every time you push to GitHub, Vercel auto-redeploys. 🎉

```bash
git add .
git commit -m "Update notes generator"
git push
```
