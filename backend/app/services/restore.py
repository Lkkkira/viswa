import os
import shutil


def restore_job_workspace(organized_dir: str, output_zip_path: str) -> bool:
    """
    Cleans up the organized output directory and output ZIP file,
    allowing the user to reset job state and re-organize cleanly.
    """
    try:
        if organized_dir and os.path.exists(organized_dir):
            shutil.rmtree(organized_dir)
        if output_zip_path and os.path.exists(output_zip_path):
            os.remove(output_zip_path)
        return True
    except Exception:
        return False
