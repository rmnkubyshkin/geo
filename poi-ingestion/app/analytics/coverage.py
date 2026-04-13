import h3


class CoverageAnalyzer:
    def __init__(self, resolution: int):
        self.resolution = resolution

    def coverage_score(self, bbox: dict, cells: set[str]) -> float:
        bbox_area = self._bbox_area_km2(bbox)
        grid_area = self._grid_area_km2(cells)

        if bbox_area == 0:
            return 0.0

        return min(grid_area / bbox_area, 1.0)

    def density(self, bbox: dict, cells: set[str]) -> float:
        area = self._bbox_area_km2(bbox)
        if area == 0:
            return 0.0
        return len(cells) / area

    def detect_holes(self, cells: set[str], k: int = 1) -> list[str]:
        holes = []

        for cell in cells:
            neighbors = set(h3.grid_disk(cell, k))
            if len(neighbors.intersection(cells)) <= 2:
                holes.append(cell)

        return holes

    def _grid_area_km2(self, cells: set[str]) -> float:
        total = 0.0
        for c in cells:
            total += h3.cell_area(c, unit="km^2")
        return total

    def _bbox_area_km2(self, bbox: dict) -> float:
        lat_diff = abs(bbox["lat_max"] - bbox["lat_min"])
        lon_diff = abs(bbox["lon_max"] - bbox["lon_min"])
        return lat_diff * lon_diff * 123.0