import type { StyleSpecification } from "maplibre-gl";

export const streetMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    streets: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: "streets", type: "raster", source: "streets" }],
};

export const satelliteMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Tiles &copy; Esri and imagery providers",
    },
  },
  layers: [{ id: "satellite", type: "raster", source: "satellite" }],
};

export const londonSatelliteImageStyle: StyleSpecification = {
  version: 8,
  sources: {
    london: {
      type: "image",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=-0.52,51.28,0.32,51.72&bboxSR=4326&size=1400,800&imageSR=4326&format=jpg&f=image",
      coordinates: [
        [-0.52, 51.72],
        [0.32, 51.72],
        [0.32, 51.28],
        [-0.52, 51.28],
      ],
    },
  },
  layers: [{ id: "london", type: "raster", source: "london" }],
};
