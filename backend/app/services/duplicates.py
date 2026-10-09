import uuid
from collections import defaultdict
from typing import List, Dict, Any


def group_duplicates(file_records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Groups file records by sha256_hash.
    Assigns duplicate_group_id and calculates duplicate savings.
    Returns:
      processed_records: updated file records with duplicate flags
      duplicate_groups: dict of group summary
      total_duplicate_count: total duplicate file copies
      total_duplicate_savings: potential bytes saved
    """
    hash_groups = defaultdict(list)
    for record in file_records:
        h = record.get("sha256_hash")
        if h:
            hash_groups[h].append(record)

    total_duplicate_count = 0
    total_duplicate_savings = 0
    duplicate_groups_summary = {}

    for h, group in hash_groups.items():
        if len(group) > 1:
            group_id = f"dup_{uuid.uuid4().hex[:8]}"
            file_size = group[0]["file_size"]
            # First file is primary, rest are duplicates
            count = len(group)
            savings = file_size * (count - 1)
            total_duplicate_count += (count - 1)
            total_duplicate_savings += savings

            duplicate_groups_summary[group_id] = {
                "group_id": group_id,
                "hash": h,
                "count": count,
                "file_size": file_size,
                "potential_savings": savings,
            }

            for idx, rec in enumerate(group):
                rec["duplicate_group_id"] = group_id
                rec["is_duplicate"] = True
                # Keep original/first copy by default, uncheck others if preferred
                rec["is_selected_duplicate"] = (idx == 0)
        else:
            group[0]["duplicate_group_id"] = None
            group[0]["is_duplicate"] = False
            group[0]["is_selected_duplicate"] = True

    return {
        "records": file_records,
        "duplicate_groups": duplicate_groups_summary,
        "total_duplicate_count": total_duplicate_count,
        "total_duplicate_savings": total_duplicate_savings,
    }
