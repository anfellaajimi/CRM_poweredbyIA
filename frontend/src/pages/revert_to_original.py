import os
import re

files = [
    r"c:\Users\laaji\crm-professional\frontend\src\pages\Projects.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\pages\ProjectDetails.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\pages\Clients.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\pages\ClientDetails.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\services\api.ts"
]

def revert_to_chaud(file_path):
    if not os.path.exists(file_path):
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Reverting Hot -> Chaud
    content = content.replace('Hot 🔥', 'Chaud 🔥')
    content = content.replace('hot 🔥', 'chaud 🔥')
    
    # Reverting Moyen ⚡ -> Moyen
    content = content.replace('Moyen ⚡', 'Moyen')
    content = content.replace('moyen ⚡', 'moyen')
    
    # Reverting Faible 🧊 -> Faible
    content = content.replace('Faible 🧊', 'Faible')
    content = content.replace('faible 🧊', 'faible')
    
    # Defaults in api.ts
    content = content.replace("'Moyen ⚡'", "'Moyen'")
    content = content.replace('"Moyen ⚡"', '"Moyen"')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Reverted to Chaud/Moyen/Faible in {file_path}")

for f in files:
    revert_to_chaud(f)
