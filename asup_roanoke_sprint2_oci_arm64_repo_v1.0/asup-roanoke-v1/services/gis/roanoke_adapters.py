from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, ROUND_HALF_EVEN
from typing import Any, Dict, Optional
from packages.core_types import EpistemicTier, ProvenancedValue

CENT = Decimal("0.01")

ROANOKE_COUNTY_TAXVIEW_URL = (
    "https://arcgis.roanokecountyva.gov/arcgisweb/rest/services/TaxView/TaxView/MapServer"
)
ROANOKE_CITY_OPEN_DATA_URL = "https://open-data-portal-roanokeva.hub.arcgis.com/"


@dataclass(frozen=True)
class CanonicalParcel:
    """
    Normalized Silver-layer parcel representation unifying Roanoke County (51161),
    City of Roanoke (51770), and City of Salem (51775) heterogeneous ArcGIS schemas.
    """
    fips_code: str
    jurisdiction_name: str
    parcel_id: str
    owner_name: str
    site_address: str
    zoning_code: str
    acreage: Decimal
    land_assessed_usd: ProvenancedValue[Decimal]
    improvement_assessed_usd: ProvenancedValue[Decimal]
    total_assessed_usd: ProvenancedValue[Decimal]
    latitude: Decimal
    longitude: Decimal
    has_hard_asset_floor: bool


class RoanokeCountyGISAdapter:
    """
    Normalizes JSON feature payloads from Roanoke County TaxView MapServer & Parcels Layer 130
    (FIPS 51161). County fields: GPIN, OWNER1, SITE_ADDR, ZONE_CODE, ACREAGE, LANDVAL, BLDGVAL, TOTALVAL.
    """
    FIPS_CODE = "51161"
    JURISDICTION = "Roanoke County, VA"

    @classmethod
    def normalize_feature(cls, feature_attrs: Dict[str, Any], verified_at: datetime) -> CanonicalParcel:
        gpin = str(feature_attrs["GPIN"]).strip()
        owner = str(feature_attrs.get("OWNER1") or "UNKNOWN OWNER").strip()
        addr = str(feature_attrs.get("SITE_ADDR") or "").strip()
        zone = str(feature_attrs.get("ZONE_CODE") or "UNZONED").strip()
        acres = Decimal(str(feature_attrs.get("ACREAGE", "0.00"))).quantize(CENT, rounding=ROUND_HALF_EVEN)

        land_val = Decimal(str(feature_attrs["LANDVAL"])).quantize(CENT, rounding=ROUND_HALF_EVEN)
        bldg_val = Decimal(str(feature_attrs["BLDGVAL"])).quantize(CENT, rounding=ROUND_HALF_EVEN)
        total_val = Decimal(str(feature_attrs.get("TOTALVAL", land_val + bldg_val))).quantize(
            CENT, rounding=ROUND_HALF_EVEN
        )

        lat = Decimal(str(feature_attrs.get("LAT", "37.2700")))
        lon = Decimal(str(feature_attrs.get("LON", "-79.9900")))

        src_url = f"{ROANOKE_COUNTY_TAXVIEW_URL}/0/query?where=GPIN%3D%27{gpin}%27"
        return CanonicalParcel(
            fips_code=cls.FIPS_CODE,
            jurisdiction_name=cls.JURISDICTION,
            parcel_id=gpin,
            owner_name=owner,
            site_address=addr,
            zoning_code=zone,
            acreage=acres,
            land_assessed_usd=ProvenancedValue(
                value=land_val,
                source_url=src_url,
                verified_at=verified_at,
                confidence_score=Decimal("0.98"),
                epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
            ),
            improvement_assessed_usd=ProvenancedValue(
                value=bldg_val,
                source_url=src_url,
                verified_at=verified_at,
                confidence_score=Decimal("0.98"),
                epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
            ),
            total_assessed_usd=ProvenancedValue(
                value=total_val,
                source_url=src_url,
                verified_at=verified_at,
                confidence_score=Decimal("0.98"),
                epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
            ),
            latitude=lat,
            longitude=lon,
            has_hard_asset_floor=(total_val >= Decimal("150000.00") and bldg_val > Decimal("0.00")),
        )


class RoanokeCityGISAdapter:
    """
    Normalizes JSON feature payloads from City of Roanoke Open Data Hub & WebGIS
    (Independent City FIPS 51770). City fields: PARCEL_ID, OWNER_NAME, PROPERTY_ADDRESS,
    ZONING, ACRES, LAND_VALUE, IMPR_VALUE, TOTAL_ASSESSED.
    """
    FIPS_CODE = "51770"
    JURISDICTION = "City of Roanoke, VA"

    @classmethod
    def normalize_feature(cls, feature_attrs: Dict[str, Any], verified_at: datetime) -> CanonicalParcel:
        pid = str(feature_attrs["PARCEL_ID"]).strip()
        owner = str(feature_attrs.get("OWNER_NAME") or "UNKNOWN OWNER").strip()
        addr = str(feature_attrs.get("PROPERTY_ADDRESS") or "").strip()
        zone = str(feature_attrs.get("ZONING") or "UNZONED").strip()
        acres = Decimal(str(feature_attrs.get("ACRES", "0.00"))).quantize(CENT, rounding=ROUND_HALF_EVEN)

        land_val = Decimal(str(feature_attrs["LAND_VALUE"])).quantize(CENT, rounding=ROUND_HALF_EVEN)
        impr_val = Decimal(str(feature_attrs["IMPR_VALUE"])).quantize(CENT, rounding=ROUND_HALF_EVEN)
        total_val = Decimal(str(feature_attrs.get("TOTAL_ASSESSED", land_val + impr_val))).quantize(
            CENT, rounding=ROUND_HALF_EVEN
        )

        lat = Decimal(str(feature_attrs.get("LATITUDE", "37.2710")))
        lon = Decimal(str(feature_attrs.get("LONGITUDE", "-79.9414")))

        src_url = f"{ROANOKE_CITY_OPEN_DATA_URL}datasets/parcels?parcel_id={pid}"
        return CanonicalParcel(
            fips_code=cls.FIPS_CODE,
            jurisdiction_name=cls.JURISDICTION,
            parcel_id=pid,
            owner_name=owner,
            site_address=addr,
            zoning_code=zone,
            acreage=acres,
            land_assessed_usd=ProvenancedValue(
                value=land_val,
                source_url=src_url,
                verified_at=verified_at,
                confidence_score=Decimal("0.98"),
                epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
            ),
            improvement_assessed_usd=ProvenancedValue(
                value=impr_val,
                source_url=src_url,
                verified_at=verified_at,
                confidence_score=Decimal("0.98"),
                epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
            ),
            total_assessed_usd=ProvenancedValue(
                value=total_val,
                source_url=src_url,
                verified_at=verified_at,
                confidence_score=Decimal("0.98"),
                epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
            ),
            latitude=lat,
            longitude=lon,
            has_hard_asset_floor=(total_val >= Decimal("150000.00") and impr_val > Decimal("0.00")),
        )


def classify_roanoke_valley_coordinates(lat: Decimal, lon: Decimal) -> Optional[str]:
    """
    Deterministic bounding-polygon classifier for tests & fallback geocoding before PostGIS ST_Contains:
    - City of Salem, VA (Independent City FIPS 51775 — Near-Miss): lat [37.2650, 37.3150], lon [-80.1050, -80.0150]
    - City of Roanoke, VA (Independent City FIPS 51770 — In-Box): lat [37.2350, 37.3350], lon [-80.0149, -79.8750]
    - Roanoke County, VA (FIPS 51161 — In-Box): surrounding ring lat [37.1400, 37.4100], lon [-80.2200, -79.8200]
    """
    if Decimal("37.2650") <= lat <= Decimal("37.3150") and Decimal("-80.1050") <= lon <= Decimal("-80.0150"):
        return "51775"  # City of Salem (Near-Miss)
    if Decimal("37.2350") <= lat <= Decimal("37.3350") and Decimal("-80.0149") <= lon <= Decimal("-79.8750"):
        return "51770"  # City of Roanoke (In-Box)
    if Decimal("37.1400") <= lat <= Decimal("37.4100") and Decimal("-80.2200") <= lon <= Decimal("-79.8200"):
        return "51161"  # Roanoke County (In-Box)
    return None
