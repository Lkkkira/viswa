import os
import sys
import uuid
import zipfile
import shutil
import datetime
import pandas as pd
import streamlit as st

# Add workspace path to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from backend.app.services.extraction import validate_and_extract_zip, ExtractionError
from backend.app.services.scanner import scan_directory
from backend.app.services.categorizer import categorize_file, DEFAULT_CATEGORY_RULES
from backend.app.services.duplicates import group_duplicates
from backend.app.services.organizer import generate_organization_plan, execute_organization_plan
from backend.app.services.restore import restore_job_workspace

# Page configuration
st.set_page_config(
    page_title="FilePilot — Intelligent File Organizer",
    page_icon="📁",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom visual CSS inject matching visual identity
st.markdown("""
<style>
    /* Global Page Background */
    .stApp {
        background-color: #DCEAF7;
        color: #1B2A4A;
        font-family: 'Inter', system-ui, sans-serif;
    }
    
    /* Main container rounded card styling */
    .main .block-container {
        background-color: #F0F6FB;
        border-radius: 24px;
        padding: 2.5rem;
        border: 1px solid #CDE1F3;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
        margin-top: 1rem;
        margin-bottom: 2rem;
    }
    
    /* Sidebar Styling */
    section[data-testid="stSidebar"] {
        background-color: #F0F6FB !important;
        border-right: 1px solid #D2E3F3 !important;
    }

    /* Headings & Text */
    h1, h2, h3, h4 {
        color: #1B2A4A !important;
        font-weight: 700 !important;
    }

    /* Custom Cards */
    .storage-card {
        background: linear-gradient(135deg, #4F35B9 0%, #3B2596 100%);
        color: white;
        padding: 1.5rem;
        border-radius: 18px;
        margin-bottom: 1.5rem;
        box-shadow: 0 8px 20px rgba(79, 53, 185, 0.2);
    }
    
    .category-card {
        background-color: #ffffff;
        border: 1px solid #DCE8F5;
        border-radius: 16px;
        padding: 1.25rem;
        transition: all 0.2s ease;
    }
    
    /* Primary buttons */
    .stButton > button {
        background-color: #4F35B9;
        color: white;
        border-radius: 12px;
        font-weight: 600;
        border: none;
        padding: 0.5rem 1.25rem;
    }
    .stButton > button:hover {
        background-color: #3E269B;
        color: white;
    }

    /* Download button */
    .stDownloadButton > button {
        background-color: #20BCE5;
        color: white;
        border-radius: 12px;
        font-weight: 700;
        border: none;
    }
</style>
""", unsafe_allow_html=True)

# Helper functions
def format_bytes(bytes_val):
    if not bytes_val or bytes_val == 0:
        return "0 B"
    sizes = ["B", "KB", "MB", "GB"]
    i = 0
    while bytes_val >= 1024 and i < len(sizes) - 1:
        bytes_val /= 1024.0
        i += 1
    return f"{bytes_val:.1f} {sizes[i]}"

# Session State Initialization
if "jobs" not in st.session_state:
    st.session_state.jobs = {}
if "active_job_id" not in st.session_state:
    st.session_state.active_job_id = None
if "settings" not in st.session_state:
    st.session_state.settings = {
        "category_rules": DEFAULT_CATEGORY_RULES,
        "max_upload_size_mb": 500,
    }

WORKSPACE_BASE = os.path.abspath("workspace")

# Sidebar Branding & Navigation
with st.sidebar:
    st.markdown("### 📁 FilePilot v1.0")
    st.caption("Intelligent File Organizer")
    st.markdown("---")

    page = st.radio(
        "Navigation",
        [
            "📊 Dashboard",
            "📤 Upload Files",
            "📑 All Files",
            "👯 Duplicates",
            "🗂️ Organization Plan",
            "🏁 Organization Results",
            "📜 Activity History",
            "⚙️ Settings",
        ],
        index=0,
    )

    st.markdown("---")
    if st.session_state.active_job_id:
        active_job = st.session_state.jobs.get(st.session_state.active_job_id)
        if active_job:
            st.info(f"**Active Job:** {active_job['source_filename']}\n\nStatus: `{active_job['status']}`")

# Active Job Reference
active_job = st.session_state.jobs.get(st.session_state.active_job_id)

# PAGE 1: DASHBOARD
if page == "📊 Dashboard":
    st.title("Dashboard")
    st.caption("Your files, organized intelligently")

    # Storage Banner
    if active_job:
        total_files = active_job.get("total_files", 0)
        total_size = active_job.get("total_size", 0)
        dup_savings = active_job.get("duplicate_savings", 0)
        dup_count = active_job.get("duplicate_count", 0)

        st.markdown(f"""
        <div class="storage-card">
            <h3 style="color: white !important; margin-bottom: 0.25rem;">Storage Overview — {format_bytes(total_size)} Scanned</h3>
            <p style="font-size: 0.85rem; opacity: 0.9;">Archive contains <b>{total_files} total files</b>. Found <b>{dup_count} duplicate copies</b> with <b>{format_bytes(dup_savings)}</b> potential savings.</p>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div class="storage-card">
            <h3 style="color: white !important; margin-bottom: 0.25rem;">Analyze your files</h3>
            <p style="font-size: 0.85rem; opacity: 0.9;">Upload a ZIP archive to calculate real file counts, exact duplicates, and storage category breakdown.</p>
        </div>
        """, unsafe_allow_html=True)

    # Category Cards Grid
    st.subheader("My Folders")
    st.caption("Your files by category")

    cat_summary = active_job.get("categories_summary", {}) if active_job else {}
    files_list = active_job.get("files", []) if active_job else []

    cols = st.columns(4)
    categories = ["Documents", "Images", "Audio", "Videos", "Code", "Archives", "Others"]

    for idx, cat in enumerate(categories[:4]):
        count = cat_summary.get(cat, 0)
        cat_size = sum(f["file_size"] for f in files_list if f["category"] == cat)
        with cols[idx]:
            st.markdown(f"""
            <div class="category-card">
                <span style="font-size: 0.75rem; color: #4F35B9; font-weight: bold;">{format_bytes(cat_size)}</span>
                <h4 style="margin-top: 0.5rem; margin-bottom: 0.25rem;">{cat}</h4>
                <p style="font-size: 0.8rem; color: #6B7C96; margin: 0;">{count} files</p>
            </div>
            """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    c1, c2 = st.columns([2, 1])

    with c1:
        st.subheader("Category Breakdown")
        if cat_summary:
            df_chart = pd.DataFrame(list(cat_summary.items()), columns=["Category", "File Count"])
            st.bar_chart(df_chart.set_index("Category"))
        else:
            st.info("No workspace scanned yet. Upload a ZIP archive to view analytics.")

    with c2:
        st.subheader("Recent Files")
        if files_list:
            for f in files_list[:5]:
                st.markdown(f"📄 **{f['filename']}** (`{format_bytes(f['file_size'])}`)")
        else:
            st.caption("No recent files found.")

# PAGE 2: UPLOAD FILES
elif page == "📤 Upload Files":
    st.title("Upload Files")
    st.caption("Upload a ZIP archive to calculate real file counts and storage usage")

    uploaded_file = st.file_uploader("Choose a ZIP Archive", type=["zip"])

    if uploaded_file is not None:
        st.success(f"Selected file: **{uploaded_file.name}** ({format_bytes(uploaded_file.size)})")

        if st.button("Start Scanning Archive"):
            job_id = f"job_{uuid.uuid4().hex[:10]}"
            job_dir = os.path.join(WORKSPACE_BASE, job_id)
            archive_path = os.path.join(job_dir, "source.zip")
            extracted_dir = os.path.join(job_dir, "extracted")

            os.makedirs(job_dir, exist_ok=True)

            with open(archive_path, "wb") as f:
                f.write(uploaded_file.getbuffer())

            with st.spinner("Extracting archive & scanning files..."):
                try:
                    count = validate_and_extract_zip(archive_path, extracted_dir)
                    raw_records = list(scan_directory(extracted_dir, category_rules=st.session_state.settings["category_rules"]))

                    for r in raw_records:
                        r["id"] = f"file_{uuid.uuid4().hex[:10]}"
                        r["job_id"] = job_id

                    dup_res = group_duplicates(raw_records)
                    processed_files = dup_res["records"]

                    cat_summary = {}
                    total_size = 0
                    for pf in processed_files:
                        total_size += pf["file_size"]
                        cat = pf["category"]
                        cat_summary[cat] = cat_summary.get(cat, 0) + 1

                    plan_actions = generate_organization_plan(processed_files)

                    job_record = {
                        "id": job_id,
                        "source_filename": uploaded_file.name,
                        "status": "planned",
                        "total_files": count,
                        "total_size": total_size,
                        "duplicate_count": dup_res["total_duplicate_count"],
                        "duplicate_savings": dup_res["total_duplicate_savings"],
                        "categories_summary": cat_summary,
                        "files": processed_files,
                        "actions": plan_actions,
                        "extracted_dir": extracted_dir,
                        "organized_dir": os.path.join(job_dir, "organized"),
                        "output_zip_path": os.path.join(job_dir, "organized_output.zip"),
                        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    }

                    st.session_state.jobs[job_id] = job_record
                    st.session_state.active_job_id = job_id

                    st.balloons()
                    st.success(f"Successfully scanned {count} files! Proceed to Organization Plan.")
                except ExtractionError as ee:
                    st.error(str(ee))
                except Exception as e:
                    st.error(f"Failed to process archive: {str(e)}")

# PAGE 3: ALL FILES
elif page == "📑 All Files":
    st.title("All Files")
    st.caption("Search, filter, inspect metadata, and preview scanned files")

    if not active_job:
        st.warning("No active job. Upload an archive first.")
    else:
        files = active_job.get("files", [])
        search_query = st.text_input("Search files by name...", "")
        cat_filter = st.selectbox("Filter by Category", ["All"] + categories)

        filtered = [
            f for f in files
            if (search_query.lower() in f["filename"].lower())
            and (cat_filter == "All" or f["category"] == cat_filter)
        ]

        if filtered:
            df = pd.DataFrame([
                {
                    "Filename": f["filename"],
                    "Category": f["category"],
                    "Size": format_bytes(f["file_size"]),
                    "Path": f["original_path"],
                    "Duplicate": "⚠️ Copy" if f["is_duplicate"] else "✅ Unique",
                    "SHA-256": f["sha256_hash"][:16] + "...",
                }
                for f in filtered
            ])
            st.dataframe(df, use_container_width=True)
        else:
            st.info("No matching files found.")

# PAGE 4: DUPLICATES
elif page == "👯 Duplicates":
    st.title("Duplicates")
    st.caption("Inspect identical files matching SHA-256 binary hash")

    if not active_job:
        st.warning("No active job. Upload an archive first.")
    else:
        dup_count = active_job.get("duplicate_count", 0)
        dup_savings = active_job.get("duplicate_savings", 0)

        st.metric("Duplicate Copies", dup_count, delta=f"-{format_bytes(dup_savings)} recoverable")

        files = active_job.get("files", [])
        dup_files = [f for f in files if f.get("is_duplicate")]

        if dup_files:
            df_dup = pd.DataFrame([
                {
                    "Filename": f["filename"],
                    "Group ID": f["duplicate_group_id"],
                    "Size": format_bytes(f["file_size"]),
                    "Original Path": f["original_path"],
                    "SHA-256": f["sha256_hash"],
                }
                for f in dup_files
            ])
            st.dataframe(df_dup, use_container_width=True)
        else:
            st.success("🎉 No duplicate files detected in this archive!")

# PAGE 5: ORGANIZATION PLAN
elif page == "🗂️ Organization Plan":
    st.title("Organization Plan")
    st.caption("Review proposed directory tree and approve plan before applying changes")

    if not active_job:
        st.warning("No active job. Upload an archive first.")
    else:
        actions = active_job.get("actions", [])
        if actions:
            df_plan = pd.DataFrame([
                {
                    "Original Path": a["original_path"],
                    "Action": a["action"],
                    "Proposed Destination": a["proposed_path"],
                    "Collision Handled": "⚠️ Counter Added" if a.get("conflict_flag") else "OK",
                }
                for a in actions
            ])
            st.dataframe(df_plan, use_container_width=True)

            if st.button("🚀 Approve Plan & Organize Workspace"):
                with st.spinner("Organizing directory structure and creating ZIP..."):
                    res = execute_organization_plan(
                        extracted_dir=active_job["extracted_dir"],
                        organized_dir=active_job["organized_dir"],
                        output_zip_path=active_job["output_zip_path"],
                        actions=actions,
                    )
                    active_job["status"] = "organized"
                    st.success("Workspace successfully organized!")
                    st.balloons()

# PAGE 6: ORGANIZATION RESULTS
elif page == "🏁 Organization Results":
    st.title("Organization Results")
    st.caption("View transformed workspace, download output ZIP, or restore state")

    if not active_job or active_job.get("status") != "organized":
        st.warning("No organized job output available yet. Please approve plan in Organization Plan page.")
    else:
        st.success("🎉 Transformation Complete! Workspace organized cleanly.")

        out_zip = active_job.get("output_zip_path")
        if out_zip and os.path.exists(out_zip):
            with open(out_zip, "rb") as f:
                st.download_button(
                    label="💾 Download Organized ZIP",
                    data=f.read(),
                    file_name=f"organized_{active_job['source_filename']}",
                    mime="application/zip",
                )

        if st.button("🔄 Restore Workspace State"):
            restore_job_workspace(active_job["organized_dir"], active_job["output_zip_path"])
            active_job["status"] = "planned"
            st.info("Workspace restored to pre-organization planned state.")

# PAGE 7: ACTIVITY HISTORY
elif page == "📜 Activity History":
    st.title("Activity History")
    st.caption("Review previous upload and organization jobs")

    if st.session_state.jobs:
        for j_id, j in st.session_state.jobs.items():
            with st.expander(f"📦 {j['source_filename']} — Status: {j['status']} ({j['created_at']})"):
                st.write(f"Total Files: **{j['total_files']}** | Total Size: **{format_bytes(j['total_size'])}**")
                if st.button("Select Job as Active", key=j_id):
                    st.session_state.active_job_id = j_id
                    st.rerun()
    else:
        st.caption("No historical jobs recorded yet.")

# PAGE 8: SETTINGS
elif page == "⚙️ Settings":
    st.title("Settings")
    st.caption("Manage category rules and application preferences")

    st.subheader("Category File Extension Mappings")
    for cat, exts in st.session_state.settings["category_rules"].items():
        val = st.text_input(f"{cat} Extensions", ", ".join(exts))
        st.session_state.settings["category_rules"][cat] = [e.strip() for e in val.split(",") if e.strip()]

    st.success("Settings updated automatically.")
