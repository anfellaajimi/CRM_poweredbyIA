import os
import re

files = [
    r"c:\Users\laaji\crm-professional\frontend\src\pages\Projects.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\pages\ProjectDetails.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\pages\Clients.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\pages\ClientDetails.tsx"
]

def clean_cfg(file_path):
    if not os.path.exists(file_path):
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_cfg = """    'hot 🔥': { bg: '#fee2e2', color: '#dc2626', label: 'Hot 🔥' },
    'chaud 🔥': { bg: '#fee2e2', color: '#dc2626', label: 'Hot 🔥' },
    'hot': { bg: '#fee2e2', color: '#dc2626', label: 'Hot 🔥' },
    'haute 🔥': { bg: '#fee2e2', color: '#dc2626', label: 'Hot 🔥' },
    'haute': { bg: '#fee2e2', color: '#dc2626', label: 'Hot 🔥' },
    'moyen ⚡': { bg: '#fef3c7', color: '#d97706', label: 'Moyen ⚡' },
    'moyen': { bg: '#fef3c7', color: '#d97706', label: 'Moyen ⚡' },
    'moyenne ⚡': { bg: '#fef3c7', color: '#d97706', label: 'Moyen ⚡' },
    'moyenne': { bg: '#fef3c7', color: '#d97706', label: 'Moyen ⚡' },
    'faible 🧊': { bg: '#f3f4f6', color: '#6b7280', label: 'Faible 🧊' },
    'faible': { bg: '#f3f4f6', color: '#6b7280', label: 'Faible 🧊' },
  };"""

    content = re.sub(r"const cfg: Record<string, \{ bg: string; color: string; label: string \}> = \{.*?\};", 
                     f"const cfg: Record<string, {{ bg: string; color: string; label: string }}> = {{\n{new_cfg}", 
                     content, flags=re.DOTALL)
    
    # Ensure fallback uses a valid key
    content = content.replace("cfg[s] || cfg['moyenne']", "cfg[s] || cfg['moyen']")
    content = content.replace("cfg[s] || cfg['moyen ⚡']", "cfg[s] || cfg['moyen']")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Cleaned config in {file_path}")

for f in files:
    clean_cfg(f)
