
class Deduplicator:
  def dedup (self, pois):
    seen = set()
    result = []

    for p in pois:
      if p["place_id"] not in seen:
        seen.add(p["place_id"])
        result.append(p)

    return result