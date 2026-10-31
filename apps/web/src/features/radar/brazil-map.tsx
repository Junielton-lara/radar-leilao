import maplibregl, {
  type GeoJSONSource,
  type Map as MapLibreMap,
  type MapLayerMouseEvent,
} from 'maplibre-gl';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import type { AuctionMarker } from '@lancex/shared';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMapPinColor } from './category-meta';
import { createMapMarkerElement } from './map-marker-element';

const BRAZIL_CENTER: [number, number] = [-51.9253, -14.235];
const STYLE_URL =
  'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
/** Continental Brazil + margin so “Brasil inteiro” cabe no viewport */
export const BRAZIL_BOUNDS: [[number, number], [number, number]] = [
  [-74.5, -35.5],
  [-32.0, 6.5],
];

const SOURCE_ID = 'auctions';
const CLUSTER_LAYER = 'auctions-clusters';
const CLUSTER_COUNT_LAYER = 'auctions-cluster-count';

type FeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: Record<string, string | number | null | boolean>;
  }>;
};

export interface BrazilMapHandle {
  fitBrazil: () => void;
}

interface BrazilMapProps {
  markers: AuctionMarker[];
  selectedId?: string | null;
  onSelect?: (marker: AuctionMarker) => void;
  onBoundsChange?: (bbox: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
    zoom: number;
  }) => void;
}

function toFeatureCollection(markers: AuctionMarker[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: markers.map((item) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [item.longitude, item.latitude],
      },
      properties: {
        id: item.id,
        title: item.title,
        categorySlug: item.categorySlug,
        categoryName: item.categoryName,
        verificationStatus: item.verificationStatus,
        minimumBid: item.minimumBid,
        state: item.state,
        city: item.city,
        endDate: item.endDate,
        color: getMapPinColor(item.categorySlug, item.title),
        appraisalValue: item.appraisalValue ?? null,
        auctionType: item.auctionType ?? null,
        organizerName: item.organizerName ?? null,
        lotCount: item.lotCount ?? null,
        descriptionSnippet: item.descriptionSnippet ?? null,
        originalUrl: item.originalUrl ?? null,
        approximate: item.approximate ?? false,
      },
    })),
  };
}

function propsToMarker(
  props: Record<string, unknown>,
  coords: [number, number],
): AuctionMarker {
  return {
    id: String(props.id),
    title: String(props.title ?? ''),
    latitude: coords[1],
    longitude: coords[0],
    categorySlug: (props.categorySlug as string | null) ?? null,
    categoryName: (props.categoryName as string | null) ?? null,
    verificationStatus: props.verificationStatus as AuctionMarker['verificationStatus'],
    minimumBid: (props.minimumBid as string | null) ?? null,
    appraisalValue: (props.appraisalValue as string | null) ?? null,
    auctionType: (props.auctionType as AuctionMarker['auctionType']) ?? null,
    organizerName: (props.organizerName as string | null) ?? null,
    lotCount:
      props.lotCount != null ? Number(props.lotCount) : undefined,
    descriptionSnippet: (props.descriptionSnippet as string | null) ?? null,
    originalUrl: (props.originalUrl as string | null) ?? null,
    approximate: Boolean(props.approximate),
    state: (props.state as AuctionMarker['state']) ?? null,
    city: (props.city as string | null) ?? null,
    endDate: (props.endDate as string | null) ?? null,
  };
}

function fitBrazilView(map: MapLibreMap, animated = true) {
  map.fitBounds(BRAZIL_BOUNDS, {
    padding: { top: 48, bottom: 48, left: 48, right: 48 },
    duration: animated ? 650 : 0,
    maxZoom: 4.2,
  });
}

export const BrazilMap = forwardRef<BrazilMapHandle, BrazilMapProps>(
  function BrazilMap(
    { markers, selectedId, onSelect, onBoundsChange },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const onBoundsChangeRef = useRef(onBoundsChange);
    const onSelectRef = useRef(onSelect);
    const markersByIdRef = useRef(new globalThis.Map<string, AuctionMarker>());
    const htmlMarkersRef = useRef(new globalThis.Map<string, maplibregl.Marker>());
    const readyRef = useRef(false);
    const selectedIdRef = useRef(selectedId);

    useEffect(() => {
      onBoundsChangeRef.current = onBoundsChange;
    }, [onBoundsChange]);

    useEffect(() => {
      onSelectRef.current = onSelect;
    }, [onSelect]);

    useEffect(() => {
      selectedIdRef.current = selectedId;
      htmlMarkersRef.current.forEach((marker, id) => {
        const el = marker.getElement();
        el.classList.toggle('map-pin--selected', id === selectedId);
      });
    }, [selectedId]);

    useEffect(() => {
      markersByIdRef.current = new globalThis.Map(markers.map((m) => [m.id, m]));
    }, [markers]);

    useImperativeHandle(ref, () => ({
      fitBrazil: () => {
        const map = mapRef.current;
        if (map) fitBrazilView(map);
      },
    }));

    const syncHtmlMarkers = (map: MapLibreMap) => {
      if (!map.isStyleLoaded() || !map.getSource(SOURCE_ID)) return;

      const features = map.querySourceFeatures(SOURCE_ID, {
        filter: ['!', ['has', 'point_count']],
      });

      const seen = new Set<string>();
      for (const feature of features) {
        const id = String(feature.properties?.id ?? '');
        if (!id || seen.has(id)) continue;
        seen.add(id);

        if (htmlMarkersRef.current.has(id)) continue;

        const geometry = feature.geometry as {
          type: string;
          coordinates: number[];
        };
        if (geometry.type !== 'Point') continue;
        const coords: [number, number] = [
          geometry.coordinates[0],
          geometry.coordinates[1],
        ];
        const cached = markersByIdRef.current.get(id);
        const slug =
          cached?.categorySlug ??
          (feature.properties?.categorySlug as string | null);
        const title =
          cached?.title ?? String(feature.properties?.title ?? 'Leilão');

        const el = createMapMarkerElement(
          slug,
          title,
          cached?.verificationStatus ??
            (feature.properties?.verificationStatus as
              | AuctionMarker['verificationStatus']
              | undefined),
          () => {
          onSelectRef.current?.(
            cached ??
              propsToMarker(
                feature.properties as Record<string, unknown>,
                coords,
              ),
          );
        },
        );
        if (selectedIdRef.current === id) {
          el.classList.add('map-pin--selected');
        }

        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'center',
        })
          .setLngLat(coords)
          .addTo(map);
        htmlMarkersRef.current.set(id, marker);
      }

      for (const [id, marker] of htmlMarkersRef.current) {
        if (!seen.has(id)) {
          marker.remove();
          htmlMarkersRef.current.delete(id);
        }
      }
    };

    useEffect(() => {
      if (!containerRef.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: BRAZIL_CENTER,
        zoom: 3.2,
        minZoom: 2,
        maxZoom: 14,
        maxBounds: BRAZIL_BOUNDS,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.NavigationControl({ visualizePitch: false }),
        'bottom-right',
      );
      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        'bottom-left',
      );

      const emitBounds = () => {
        const b = map.getBounds();
        onBoundsChangeRef.current?.({
          minLng: b.getWest(),
          minLat: b.getSouth(),
          maxLng: b.getEast(),
          maxLat: b.getNorth(),
          zoom: map.getZoom(),
        });
      };

      const ensureLayers = () => {
        if (map.getSource(SOURCE_ID)) return;

        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: toFeatureCollection([]),
          cluster: true,
          clusterMaxZoom: 11,
          clusterRadius: 48,
        });

        map.addLayer({
          id: CLUSTER_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#3B82F6',
              8,
              '#E31B23',
              25,
              '#F59E0B',
            ],
            'circle-radius': ['step', ['get', 'point_count'], 18, 8, 24, 25, 30],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.95,
          },
        });

        map.addLayer({
          id: CLUSTER_COUNT_LAYER,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 12,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        map.on('click', CLUSTER_LAYER, (e: MapLayerMouseEvent) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: [CLUSTER_LAYER],
          });
          const clusterId = features[0]?.properties?.cluster_id as
            | number
            | undefined;
          const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
          if (clusterId == null || !source || !features[0]?.geometry) return;
          const geometry = features[0].geometry as {
            type: string;
            coordinates: number[];
          };
          const coords: [number, number] = [
            geometry.coordinates[0],
            geometry.coordinates[1],
          ];
          void source.getClusterExpansionZoom(clusterId).then((zoom) => {
            map.easeTo({ center: coords, zoom });
          });
        });

        map.on('mouseenter', CLUSTER_LAYER, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', CLUSTER_LAYER, () => {
          map.getCanvas().style.cursor = '';
        });
      };

      map.on('load', () => {
        ensureLayers();
        readyRef.current = true;
        fitBrazilView(map, false);
        emitBounds();
        const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
        source?.setData(
          toFeatureCollection(
            Array.from(markersByIdRef.current.values()),
          ) as never,
        );
        syncHtmlMarkers(map);
      });

      map.on('moveend', () => {
        emitBounds();
        syncHtmlMarkers(map);
      });
      map.on('sourcedata', (e) => {
        if (e.sourceId === SOURCE_ID && e.isSourceLoaded) {
          syncHtmlMarkers(map);
        }
      });

      mapRef.current = map;

      return () => {
        readyRef.current = false;
        htmlMarkersRef.current.forEach((m) => m.remove());
        htmlMarkersRef.current.clear();
        map.remove();
        mapRef.current = null;
      };
    }, []);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !readyRef.current) return;
      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      if (!source) return;
      htmlMarkersRef.current.forEach((m) => m.remove());
      htmlMarkersRef.current.clear();
      source.setData(toFeatureCollection(markers) as never);
      syncHtmlMarkers(map);
    }, [markers]);

    return (
      <div
        className="relative h-full min-h-[420px] w-full overflow-hidden rounded-2xl border border-border bg-[#dbeafe]/30 shadow-inner"
        data-testid="radar-map"
      >
        <div ref={containerRef} className="h-full w-full" />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 shadow-md md:left-auto md:right-14 md:translate-x-0"
          onClick={() => {
            const map = mapRef.current;
            if (map) fitBrazilView(map);
          }}
          data-testid="map-fit-brazil"
        >
          <MapPin className="h-3.5 w-3.5" />
          Ver Brasil inteiro
        </Button>
      </div>
    );
  },
);
