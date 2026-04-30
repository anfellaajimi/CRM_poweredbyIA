import os
import re

files = [
    r"c:\Users\laaji\crm-professional\frontend\src\pages\Projects.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\pages\ProjectDetails.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\pages\Clients.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\pages\ClientDetails.tsx",
    r"c:\Users\laaji\crm-professional\frontend\src\services\api.ts"
]

def revert_file(file_path):
    if not os.path.exists(file_path):
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Reverting labels and values
    # Haute -> Hot
    content = content.replace('Haute 🔥', 'Hot 🔥')
    content = content.replace('haute 🔥', 'hot 🔥')
    
    # Moyenne -> Moyen
    content = content.replace('Moyenne ⚡', 'Moyen ⚡')
    content = content.replace('moyenne ⚡', 'moyen ⚡')
    
    # Faible 🧊 (staying the same but ensuring consistency)
    content = content.replace('Faible 🧊', 'Faible 🧊')
    
    # Special case for the mapping config labels if they were different
    # (The script I ran earlier normalized them to Haute/Moyenne)
    
    # Reverting default value in api.ts
    content = content.replace("'Moyenne ⚡'", "'Moyen ⚡'")
    content = content.replace('"Moyenne ⚡"', '"Moyen ⚡"')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Reverted labels in {file_path}")

for f in files:
    revert_file(f)
