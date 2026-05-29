def compute_diff(original: dict, edited: dict) -> dict:
    """Compute a simple field-level diff between two JSON objects."""
    diff = {}
    all_keys = set(list(original.keys()) + list(edited.keys()))
    for key in all_keys:
        if key not in original:
            diff[key] = {"action": "added", "new_value": edited[key]}
        elif key not in edited:
            diff[key] = {"action": "removed", "old_value": original[key]}
        elif original[key] != edited[key]:
            diff[key] = {
                "action": "modified",
                "old_value": original[key],
                "new_value": edited[key],
            }
    return diff
