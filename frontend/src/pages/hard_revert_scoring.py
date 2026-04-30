import os
import re

files = [
    r"c:\Users\laaji\crm-professional\frontend\src\pages\Projects.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\pages\ProjectDetails.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\pages\Clients.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\pages\ClientDetails.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\services\api.ts"
]

def hard_revert(file_path):
    if not os.path.exists(file_path):
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Define the ORIGINAL ScoringBadge config (before today's session)
    # Most components had Hot 🔥/Moyen/Faible
    original_cfg = """    'hot 🔥': { bg: '#fee2e2', color: '#dc2626', label: 'Hot 🔥' },
    'chaud 🔥': { bg: '#fee2e2', color: '#dc2626', label: 'Hot 🔥' },
    'hot': { bg: '#fee2e2', color: '#dc2626', label: 'Hot 🔥' },
    'moyen': { bg: '#fef3c7', color: '#d97706', label: 'Moyen' },
    'faible': { bg: '#f3f4f6', color: '#6b7280', label: 'Faible' },
  };"""

    content = re.sub(r"const cfg: Record<string, \{ bg: string; color: string; label: string \}> = \{.*?\};", 
                     f"const cfg: Record<string, {{ bg: string; color: string; label: string }}> = {{\n{original_cfg}", 
                     content, flags=re.DOTALL)
    
    # Update fallback
    content = content.replace("cfg[s] || cfg['moyen']", "cfg[s] || cfg['moyen']")
    content = content.replace("cfg[s] || cfg['moyenne']", "cfg[s] || cfg['moyen']")
    
    # Update Select options and values
    content = content.replace('Haute 🔥', 'Hot 🔥')
    content = content.replace('haute 🔥', 'hot 🔥')
    content = content.replace('Moyenne ⚡', 'Moyen')
    content = content.replace('moyenne ⚡', 'moyen')
    content = content.replace('Faible 🧊', 'Faible')
    content = content.replace('faible 🧊', 'faible')
    content = content.replace('Moyen ⚡', 'Moyen')
    content = content.replace('moyen ⚡', 'moyen')
    content = content.replace('Chaud 🔥', 'Hot 🔥') # Reverting to Hot if that was original
    
    # Ensure options are clean
    content = content.replace("value: 'Hot 🔥', label: 'Hot 🔥'", "value: 'Hot 🔥', label: 'Chaud 🔥'") # assuming French label
    
    # Defaults
    content = content.replace("scoring: 'Moyenne ⚡'", "scoring: 'Moyen'")
    content = content.replace("scoring: 'Moyen ⚡'", "scoring: 'Moyen'")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Hard reverted labels in {file_path}")

for f in files:
    hard_revert(f)
