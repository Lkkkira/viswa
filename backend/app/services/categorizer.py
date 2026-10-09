import os

DEFAULT_CATEGORY_RULES = {
    "Documents": [".pdf", ".docx", ".doc", ".txt", ".rtf", ".odt", ".csv", ".xlsx", ".xls", ".pptx", ".ppt", ".md", ".epub"],
    "Images": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp", ".tiff", ".ico", ".raw", ".psd"],
    "Audio": [".mp3", ".wav", ".aac", ".flac", ".ogg", ".m4a", ".wma"],
    "Videos": [".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v"],
    "Code": [".py", ".js", ".jsx", ".ts", ".tsx", ".html", ".css", ".json", ".xml", ".java", ".cpp", ".c", ".cs", ".go", ".rs", ".php", ".sh", ".sql"],
    "Archives": [".zip", ".tar", ".gz", ".rar", ".7z", ".bz2", ".xz"]
}


def categorize_file(filename: str, custom_rules: dict = None) -> str:
    """
    Categorizes a file based on its extension and rules.
    Returns category name: "Documents", "Images", "Audio", "Videos", "Code", "Archives", or "Others".
    """
    ext = os.path.splitext(filename)[1].lower()
    rules = custom_rules or DEFAULT_CATEGORY_RULES

    for category, extensions in rules.items():
        if ext in [e.lower() for e in extensions]:
            return category

    return "Others"
