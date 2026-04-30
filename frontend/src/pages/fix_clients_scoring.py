import os
import re

files = [
    r"c:\Users\laaji\crm-professional\frontend\src\pages\Projects.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\pages\ProjectDetails.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\pages\Clients.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\pages\ClientDetails.tsx"
]

def fix_file(file_path):
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}")
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Config map in ScoringBadge (already mostly done but ensuring consistency)
    new_cfg = """    'haute 🔥': { bg: '#fee2e2', color: '#dc2626', label: 'Haute 🔥' },
    'haute': { bg: '#fee2e2', color: '#dc2626', label: 'Haute 🔥' },
    'chaud 🔥': { bg: '#fee2e2', color: '#dc2626', label: 'Haute 🔥' },
    'chaud': { bg: '#fee2e2', color: '#dc2626', label: 'Haute 🔥' },
    'hot 🔥': { bg: '#fee2e2', color: '#dc2626', label: 'Haute 🔥' },
    'hot': { bg: '#fee2e2', color: '#dc2626', label: 'Haute 🔥' },
    'moyenne ⚡': { bg: '#fef3c7', color: '#d97706', label: 'Moyenne ⚡' },
    'moyenne': { bg: '#fef3c7', color: '#d97706', label: 'Moyenne ⚡' },
    'moyen ⚡': { bg: '#fef3c7', color: '#d97706', label: 'Moyenne ⚡' },
    'moyen': { bg: '#fef3c7', color: '#d97706', label: 'Moyenne ⚡' },
    'faible 🧊': { bg: '#f3f4f6', color: '#6b7280', label: 'Faible 🧊' },
    'faible': { bg: '#f3f4f6', color: '#6b7280', label: 'Faible 🧊' },
  };"""
    
    content = re.sub(r"const cfg: Record<string, \{ bg: string; color: string; label: string \}> = \{.*?\};", 
                     f"const cfg: Record<string, {{ bg: string; color: string; label: string }}> = {{\n{new_cfg}", 
                     content, flags=re.DOTALL)
    
    # Generic string replacements for labels and options
    # Handling <option value="...">Label</option>
    content = content.replace('value="Hot 🔥"', 'value="Haute 🔥"')
    content = content.replace('>Hot 🔥<', '>Haute 🔥<')
    content = content.replace('value="Moyen"', 'value="Moyenne ⚡"')
    content = content.replace('>Moyen<', '>Moyenne ⚡<')
    content = content.replace('value="Faible"', 'value="Faible 🧊"')
    content = content.replace('>Faible<', '>Faible 🧊<')
    
    # Handling UI Select component options: { value: '...', label: '...' }
    content = content.replace("value: 'Hot 🔥', label: 'Chaud 🔥'", "value: 'Haute 🔥', label: 'Haute 🔥'")
    content = content.replace("value: 'Moyen', label: 'Moyen ⚡'", "value: 'Moyenne ⚡', label: 'Moyenne ⚡'")
    content = content.replace("value: 'Faible', label: 'Faible 🧊'", "value: 'Faible 🧊', label: 'Faible 🧊'")
    
    # Defaults
    content = content.replace("scoring: 'Moyenne ⚡'", "scoring: 'Moyenne ⚡'") # already done
    content = content.replace("scoring: 'Moyen'", "scoring: 'Moyenne ⚡'")
    content = content.replace("scoring || 'Moyen'", "scoring || 'Moyenne ⚡'")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {file_path}")

for f in files:
    fix_file(f)
