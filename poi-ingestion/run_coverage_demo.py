from app.analytics.coverage import CoverageAnalyzer
from app.crawler.city_grid_builder import CityGridBuilder


def main():
    bbox = {
        "lat_min": 59.80,
        "lat_max": 60.00,
        "lon_min": 30.10,
        "lon_max": 30.50
    }

    resolution = 7

    print(" Generating H3 grid...")

    grid = CityGridBuilder().build(bbox, resolution)
    grid_set = set(grid)

    print(f" Grid cells: {len(grid_set)}")

    analyzer = CoverageAnalyzer(resolution)

    print("\n Coverage report")

    coverage = analyzer.coverage_score(bbox, grid_set)
    density = analyzer.density(bbox, grid_set)
    holes = analyzer.detect_holes(grid_set)

    print(f"Coverage score : {coverage:.4f}")
    print(f"Density        : {density:.2f} cells/km²")
    print(f"Holes detected : {len(holes)}")

    print("\n Sample holes:")
    print(holes[:10])


if __name__ == "__main__":
    main()