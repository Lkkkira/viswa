import os
import zipfile
import random

OUT_ZIP = "sample_workspace.zip"

categories_files = {
    "Documents": [
        ("q1_financial_report.pdf", b"%PDF-1.4 Mock Q1 Financial Report Content..."),
        ("meeting_notes_july.docx", b"Meeting Notes with engineering team..."),
        ("project_proposal_v2.pdf", b"%PDF-1.4 Project Proposal for FilePilot..."),
        ("company_budget_2026.xlsx", b"ID,Department,Budget\n1,Engineering,50000\n2,Marketing,20000"),
        ("contract_draft.txt", b"Standard non-disclosure agreement document..."),
        ("thesis_final_draft.pdf", b"%PDF-1.4 Academic thesis research document..."),
        ("resume_2026.pdf", b"%PDF-1.4 John Doe Curriculum Vitae..."),
        ("tax_return_receipt.pdf", b"%PDF-1.4 Official Tax Return Receipt..."),
    ],
    "Images": [
        ("family_vacation_01.jpg", b"JPEG_HEADER_MOCK_DATA_01"),
        ("family_vacation_02.jpg", b"JPEG_HEADER_MOCK_DATA_02"),
        ("screenshot_2026_10_01.png", b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR Mock Screenshot"),
        ("logo_transparent.png", b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR Mock Logo"),
        ("profile_avatar.jpg", b"JPEG_HEADER_MOCK_AVATAR"),
        ("wallpaper_4k.webp", b"WEBP_MOCK_WALLPAPER"),
    ],
    "Audio": [
        ("podcast_episode_12.mp3", b"ID3_MOCK_PODCAST_AUDIO_STREAM_DATA"),
        ("voice_memo_oct9.wav", b"RIFF_MOCK_WAVE_AUDIO_RECORDING"),
        ("background_music.mp3", b"ID3_MOCK_BG_MUSIC_TRACK"),
    ],
    "Videos": [
        ("demo_presentation.mp4", b"FTYP_MP42_MOCK_VIDEO_STREAM_DATA"),
        ("product_walkthrough.mkv", b"EBML_MOCK_MATROSKA_VIDEO_RECORDING"),
    ],
    "Code": [
        ("app_main.py", b"import os\n\ndef run():\n    print('FilePilot Engine Active')\n"),
        ("index.tsx", b"import React from 'react';\nexport const App = () => <div>FilePilot</div>;\n"),
        ("styles.css", b"body { background: #DCEAF7; color: #1B2A4A; font-family: Inter, sans-serif; }\n"),
        ("schema.sql", b"CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));\n"),
        ("config.json", b"{\n  \"appName\": \"FilePilot\",\n  \"version\": \"1.0.0\"\n}\n"),
    ]
}

# Duplicate templates to duplicate across messy filenames
duplicate_payloads = [
    ("Assignment_Final.pdf", b"%PDF-1.4 CRITICAL ASSIGNMENT SUBMISSION DOCUMENT CONTENT"),
    ("Budget_Approved_2026.xlsx", b"EXCEL_BINARY_BUDGET_SHEET_DATA_2026_TOTALS"),
    ("Family_Photo_Beach.jpg", b"JPEG_BINARY_DATA_FAMILY_PHOTO_BEACH_SUMMER"),
]

def generate():
    files_to_write = []
    
    # 1. Standard category files with random messy folders
    folders = ["Unorganized", "Downloads", "Old Desktop", "New Folder (3)", "Misc/Stuff", "Drafts/Temp"]
    
    for cat, item_list in categories_files.items():
        for filename, content in item_list:
            folder = random.choice(folders)
            rel_path = f"{folder}/{filename}"
            files_to_write.append((rel_path, content))

    # 2. Add duplicates with different names in different subfolders
    for idx, (orig_name, content) in enumerate(duplicate_payloads):
        files_to_write.append((f"Downloads/{orig_name}", content))
        files_to_write.append((f"Unorganized/Copy of {orig_name}", content))
        files_to_write.append((f"Old Desktop/BACKUP_{orig_name}", content))

    # 3. Add extra numbered files to reach ~50+ rich test files
    for i in range(1, 25):
        ext_choice = random.choice([".pdf", ".png", ".txt", ".mp3", ".py", ".docx"])
        content = f"Mock file content for file number {i} generated for FilePilot testing.".encode()
        rel_path = f"MessyFolder_{i % 4}/file_test_{i:02d}{ext_choice}"
        files_to_write.append((rel_path, content))

    with zipfile.ZipFile(OUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        for rel_path, content in files_to_write:
            zf.writestr(rel_path, content)

    print(f"Successfully generated '{OUT_ZIP}' with {len(files_to_write)} sample files for testing.")

if __name__ == "__main__":
    generate()
