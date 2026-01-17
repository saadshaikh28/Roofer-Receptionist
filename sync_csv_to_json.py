import csv
import json
import subprocess
import sys
from pathlib import Path

CSV_FILE = "data.csv"
OUTPUT_DIR = Path("configs")

def git(cmd):
    subprocess.run(cmd, check=True)

def load_csv():
    data = {}
    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        for row_num, row in enumerate(reader, start=1):
            if len(row) < 2:
                print(f"⚠️ Skipping row {row_num}: not enough columns")
                continue

            title = row[0].strip()
            body = row[1].strip()

            if not title or not body:
                print(f"⚠️ Skipping row {row_num}: empty title or body")
                continue

            try:
                data[title] = json.loads(body)
            except json.JSONDecodeError as e:
                print(f"❌ Invalid JSON on row {row_num}: {e}")
                sys.exit(1)

    return data

def main():
    OUTPUT_DIR.mkdir(exist_ok=True)

    csv_data = load_csv()
    existing_files = {p.stem: p for p in OUTPUT_DIR.glob("*.json")}

    changed = False

    # Create / Update
    for title, content in csv_data.items():
        path = OUTPUT_DIR / f"{title}.json"
        new_text = json.dumps(content, indent=2, ensure_ascii=False)

        if not path.exists() or path.read_text(encoding="utf-8") != new_text:
            path.write_text(new_text, encoding="utf-8")
            print(f"✔ write {path}")
            changed = True

    # Delete removed
    for title, path in existing_files.items():
        if title not in csv_data:
            path.unlink()
            print(f"✖ delete {path}")
            changed = True

    if not changed:
        print("No changes detected. Nothing to commit.")
        return

    git(["git", "add", "configs"])
    git(["git", "commit", "-m", "Sync configs from CSV"])
    git(["git", "push"])

if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as e:
        print("❌ Git command failed:", e)
        sys.exit(1)

