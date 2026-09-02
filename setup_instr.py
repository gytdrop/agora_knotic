import os
from pathlib import Path

INSTRUCTIONS_DIR = Path("instructions")
MD_FILES = [
    "brain.md",
    "resume.md",
    "agent.md",
    "limits.md",
    "record.md",
    "ledger.md"
]

def scaffold_instructions():
    print(f"[+] Creating '{INSTRUCTIONS_DIR}' directory...")
    INSTRUCTIONS_DIR.mkdir(parents=True, exist_ok=True)

    for filename in MD_FILES:
        file_path = INSTRUCTIONS_DIR / filename
        if not file_path.exists():
            print(f"    -> Creating {filename}")
            # Inject a basic Markdown header to initialize the file
            title = filename.replace(".md", "").capitalize()
            file_path.write_text(f"# {title} Context\n\n<!-- TODO: Define {title} parameters and constraints -->\n")
        else:
            print(f"    [-] {filename} already exists. Skipping.")

if __name__ == "__main__":
    print("Starting Instructions Folder Scaffolding...\n")
    scaffold_instructions()
    print("\nInstructions scaffolding complete.")
