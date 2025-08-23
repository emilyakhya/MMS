# 🚀 Quick Start - MMS Pill Counting System

## One-Command Setup

Run the entire system with a single command:

```bash
./start_local.sh
```

This will:
- ✅ Start the backend API server (port 8000)
- ✅ Start the PWA frontend (port 3000) 
- ✅ Start the dashboard (port 3001)
- ✅ Install all dependencies automatically
- ✅ Initialize the database
- ✅ Handle process management and cleanup

## Access Your Applications

Once the script finishes, open **Google Chrome** and navigate to:

- **📱 PWA App**: http://localhost:3000
- **📊 Dashboard**: http://localhost:3001  
- **📚 API Docs**: http://localhost:8000/docs

## Test Login

Use these credentials to test the system:

```
Email: chp1@mms.org
Password: password123
```

## Chrome Tips

1. **Allow Camera Access** - Required for pill detection features
2. **Open Developer Tools** - Press `F12` for debugging
3. **Mobile Simulation** - Click the device icon in DevTools to test mobile view
4. **Full Screen** - Press `F11` for immersive experience
5. **Service Worker** - Check Application tab in DevTools for PWA status

## Troubleshooting

### If `http://localhost:3000` doesn't work:

1. **Check if services are running**:
   ```bash
   lsof -i :3000  # Check PWA
   lsof -i :3001  # Check Dashboard  
   lsof -i :8000  # Check Backend
   ```

2. **Restart everything**:
   ```bash
   # Stop current processes
   Ctrl+C (in the terminal running the script)
   
   # Kill any remaining processes
   lsof -ti:8000 | xargs kill -9
   lsof -ti:3000 | xargs kill -9
   lsof -ti:3001 | xargs kill -9
   
   # Start again
   ./start_local.sh
   ```

3. **Check browser console** - Press `F12` and look for errors

4. **Clear browser cache** - Hard refresh with `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### Common Issues:

- **Port in use**: The script automatically kills existing processes
- **Dependencies missing**: The script installs them automatically
- **Permission denied**: Run `chmod +x start_local.sh` first
- **Database issues**: The script reinitializes if needed

## Stop the System

Press `Ctrl+C` in the terminal where you ran the script to stop all services.

## Manual Start (if needed)

If the script doesn't work, start services manually:

```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Terminal 2: PWA  
cd pwa && npm start

# Terminal 3: Dashboard
cd dashboard && npm start
```

---

**Need help?** Check the detailed guide in `LOCAL_SETUP_GUIDE.md`
