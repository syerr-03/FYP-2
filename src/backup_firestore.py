import json
import os
from pathlib import Path
from datetime import datetime, timezone
from firebase_admin import credentials, firestore, initialize_app

# Lokasi private key dalam laptop
KEY_FOLDER = Path(r"C:\Users\60133\Firebase_Private")
key_files = list(KEY_FOLDER.glob("*.json"))

if len(key_files) != 1:
    raise RuntimeError(
        "Pastikan folder Firebase_Private mengandungi tepat satu fail JSON."
    )

# Sambung ke Firebase
cred = credentials.Certificate(str(key_files[0]))
initialize_app(cred, {"projectId": "fyp2-28e30"})
db = firestore.client()

# Lokasi backup
backup_folder = Path.home() / "Firebase_Backups"
backup_folder.mkdir(exist_ok=True)

backup_file = backup_folder / (
    "OrderAI_Backup_" + datetime.now().strftime("%Y%m%d_%H%M%S") + ".json"
)

# Backup semua collection dan subcollection
def backup_collection(collection_ref):
    documents = []

    for doc in collection_ref.stream():
        document = {
            "id": doc.id,
            "data": doc.to_dict(),
            "subcollections": {}
        }

        for subcol in doc.reference.collections():
            document["subcollections"][subcol.id] = backup_collection(subcol)

        documents.append(document)

    return documents

backup_data = {
    "project": "fyp2-28e30",
    "backup_date": datetime.now(timezone.utc).isoformat(),
    "collections": {}
}

# Baca semua collection utama
for collection in db.collections():
    print(f"Backing up: {collection.id}")

    documents = backup_collection(collection)
    backup_data["collections"][collection.id] = documents

    print(f"  {len(documents)} documents")

# Simpan backup sebagai JSON
with open(backup_file, "w", encoding="utf-8") as file:
    json.dump(
        backup_data,
        file,
        ensure_ascii=False,
        indent=2,
        default=str
    )

# Semak fail JSON boleh dibaca
with open(backup_file, "r", encoding="utf-8") as file:
    verified = json.load(file)

print("\nBACKUP BERJAYA DISIMPAN")
print("File:", backup_file)
print("Collections:", len(verified["collections"]))