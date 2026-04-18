from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import json
import os
import zipfile
import io
from pathlib import Path
from typing import List, Dict

app = FastAPI()

# Mount static files (CSS/JS)
app.mount("/static", StaticFiles(directory="app/public/css-js"), name="static")

# Templates
templates = Jinja2Templates(directory="app/html")

# Load mapping configuration
with open("app/mapping.json", "r") as f:
    EMULATOR_CONFIG = json.load(f)

# ROM base path (from docker volume)
ROM_BASE_PATH = "/mnt/media/roms"


def get_available_emulators() -> List[Dict]:
    """Get list of available emulators with ROM counts (only activated ones)"""
    emulators = []
    for emulator_id, config in EMULATOR_CONFIG.items():
        # Skip deactivated emulators
        if not config.get("activated", True):
            continue
            
        rom_path = os.path.join(ROM_BASE_PATH, config["roms"])
        rom_count = 0
        
        if os.path.exists(rom_path):
            # Count ROMs matching extensions (including subdirectories)
            extensions = config.get("extensions", [])
            for root, dirs, files in os.walk(rom_path):
                for file in files:
                    if any(file.lower().endswith(ext.lower()) for ext in extensions):
                        rom_count += 1
        
        emulators.append({
            "id": emulator_id,
            "name": config.get("name", emulator_id),
            "description": config.get("description", ""),
            "image": config.get("image", "🎮"),
            "emulator": config["emulator"],
            "rom_count": rom_count
        })
    
    return emulators


def get_roms_for_emulator(emulator_id: str) -> List[Dict]:
    """Get list of ROMs for a specific emulator (including subdirectories)"""
    if emulator_id not in EMULATOR_CONFIG:
        return []
    
    config = EMULATOR_CONFIG[emulator_id]
    rom_path = os.path.join(ROM_BASE_PATH, config["roms"])
    roms = []
    
    if os.path.exists(rom_path):
        extensions = config.get("extensions", [])
        # Walk through directories recursively
        for root, dirs, files in os.walk(rom_path):
            for file in sorted(files):
                if any(file.lower().endswith(ext.lower()) for ext in extensions):
                    # Get relative path from rom_path
                    full_path = os.path.join(root, file)
                    relative_path = os.path.relpath(full_path, rom_path)
                    
                    # Remove extension for display name
                    display_name = os.path.splitext(file)[0]
                    
                    # If in subdirectory, add folder name to display
                    if os.path.dirname(relative_path):
                        folder = os.path.dirname(relative_path)
                        display_name = f"[{folder}] {display_name}"
                    
                    roms.append({
                        "filename": relative_path,
                        "display_name": display_name,
                        "path": relative_path
                    })
    
    return roms


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Main page - list of emulators"""
    emulators = get_available_emulators()
    return templates.TemplateResponse("index.html", {
        "request": request,
        "emulators": emulators
    })


@app.get("/emulator/{emulator_id}", response_class=HTMLResponse)
async def emulator_games(request: Request, emulator_id: str):
    """List of games for a specific emulator"""
    if emulator_id not in EMULATOR_CONFIG:
        return templates.TemplateResponse("error.html", {
            "request": request,
            "message": f"Emulator '{emulator_id}' not found"
        })
    
    # Check if emulator is activated
    config = EMULATOR_CONFIG[emulator_id]
    if not config.get("activated", True):
        return templates.TemplateResponse("error.html", {
            "request": request,
            "message": f"Emulator '{emulator_id}' is not activated"
        })
    
    roms = get_roms_for_emulator(emulator_id)
    return templates.TemplateResponse("games.html", {
        "request": request,
        "emulator_id": emulator_id,
        "emulator_name": config.get("name", emulator_id),
        "games": roms
    })


@app.get("/play/{emulator_id}/{rom_filename:path}", response_class=HTMLResponse)
async def play_game(request: Request, emulator_id: str, rom_filename: str):
    """Play a specific game"""
    if emulator_id not in EMULATOR_CONFIG:
        return templates.TemplateResponse("error.html", {
            "request": request,
            "message": f"Emulator '{emulator_id}' not found"
        })
    
    config = EMULATOR_CONFIG[emulator_id]
    
    # Check if emulator is activated
    if not config.get("activated", True):
        return templates.TemplateResponse("error.html", {
            "request": request,
            "message": f"Emulator '{emulator_id}' is not activated"
        })
    
    display_name = os.path.splitext(os.path.basename(rom_filename))[0]
    
    return templates.TemplateResponse("player.html", {
        "request": request,
        "emulator_id": emulator_id,
        "emulator_name": config.get("name", emulator_id),
        "emulator_js": config["emulator"],
        "rom_filename": rom_filename,
        "game_name": display_name,
        "controls": json.dumps(config.get("controls", {}))
    })


@app.get("/rom/{emulator_id}/{rom_filename:path}")
async def get_rom(emulator_id: str, rom_filename: str):
    """Serve ROM file (with ZIP extraction support)"""
    if emulator_id not in EMULATOR_CONFIG:
        return {"error": "Emulator not found"}
    
    config = EMULATOR_CONFIG[emulator_id]
    rom_path = os.path.join(ROM_BASE_PATH, config["roms"], rom_filename)
    
    if not os.path.exists(rom_path):
        return {"error": "ROM not found"}
    
    # If it's a ZIP file, extract the first ROM file in memory
    if rom_filename.lower().endswith('.zip'):
        try:
            with zipfile.ZipFile(rom_path, 'r') as zip_ref:
                # Get list of files in the ZIP
                file_list = zip_ref.namelist()
                
                # Filter for ROM files based on emulator extensions
                extensions = config.get("extensions", [])
                rom_files = [f for f in file_list if any(f.lower().endswith(ext.replace('.zip', '').lower()) for ext in extensions)]
                
                if not rom_files:
                    # If no specific ROM found, take the first file
                    rom_files = [f for f in file_list if not f.endswith('/')]
                
                if rom_files:
                    # Extract the first ROM file to memory
                    rom_data = zip_ref.read(rom_files[0])
                    
                    # Determine media type based on file extension
                    media_type = "application/octet-stream"
                    
                    return Response(
                        content=rom_data,
                        media_type=media_type,
                        headers={
                            "Content-Disposition": f'inline; filename="{os.path.basename(rom_files[0])}"'
                        }
                    )
                else:
                    return {"error": "No ROM file found in ZIP archive"}
        except zipfile.BadZipFile:
            return {"error": "Invalid ZIP file"}
        except Exception as e:
            return {"error": f"Error extracting ZIP: {str(e)}"}
    
    # Regular file serving
    return FileResponse(rom_path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=80, reload=True)
