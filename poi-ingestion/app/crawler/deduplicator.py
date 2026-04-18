
class Deduplicator:
  def dedup (self, pois):
    seen = set()
    result = []

    for p in pois:
        pid = p.get("place_id")
        if not pid:
            continue

        if pid in seen:
            continue

        seen.add(pid)
        result.append(p)
    return result
