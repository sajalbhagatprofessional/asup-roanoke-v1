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


class SalemCityGISAdapter:
    """
    Normalizes parcel records from City of Salem WebGIS portal (FIPS 51775).
    """
    FIPS_CODE = "51775"
    JURISDICTION = "City of Salem, VA"
    BASE_URL = "https://webgis.net/va/salem/"

    @classmethod
    def normalize_feature(cls, feature_attrs: Dict[str, Any], verified_at: datetime) -> CanonicalParcel:
        pid = str(feature_attrs.get("PARCEL_ID") or feature_attrs.get("MAP_NO", "UNKNOWN_PARCEL")).strip()
        owner = str(feature_attrs.get("OWNER_NAME") or feature_attrs.get("OWNER", "UNKNOWN OWNER")).strip()
        addr = str(feature_attrs.get("PROPERTY_ADDRESS") or feature_attrs.get("SITE_ADDR", "")).strip()
        zone = str(feature_attrs.get("ZONING") or feature_attrs.get("ZONE_CODE", "UNZONED")).strip()
        acres = Decimal(str(feature_attrs.get("ACRES", feature_attrs.get("ACREAGE", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)

        land_val = Decimal(str(feature_attrs.get("LAND_VALUE", feature_attrs.get("LANDVAL", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)
        impr_val = Decimal(str(feature_attrs.get("IMPR_VALUE", feature_attrs.get("BLDGVAL", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)
        total_val = Decimal(str(feature_attrs.get("TOTAL_ASSESSED", feature_attrs.get("TOTALVAL", land_val + impr_val)))).quantize(
            CENT, rounding=ROUND_HALF_EVEN
        )

        lat = Decimal(str(feature_attrs.get("LATITUDE", feature_attrs.get("LAT", "37.2935"))))
        lon = Decimal(str(feature_attrs.get("LONGITUDE", feature_attrs.get("LON", "-80.0547"))))

        src_url = f"{cls.BASE_URL}?parcel={pid}"
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


class BotetourtCountyGISAdapter:
    """
    Normalizes parcel records from Botetourt County WebGIS portal (FIPS 51023 - Fincastle / Daleville).
    """
    FIPS_CODE = "51023"
    JURISDICTION = "Botetourt County, VA"
    BASE_URL = "https://webgis.net/va/botetourt/"

    @classmethod
    def normalize_feature(cls, feature_attrs: Dict[str, Any], verified_at: datetime) -> CanonicalParcel:
        pid = str(feature_attrs.get("PARCEL_ID") or feature_attrs.get("GPIN", "UNKNOWN_PARCEL")).strip()
        owner = str(feature_attrs.get("OWNER_NAME") or feature_attrs.get("OWNER", "UNKNOWN OWNER")).strip()
        addr = str(feature_attrs.get("PROPERTY_ADDRESS") or feature_attrs.get("SITE_ADDR", "")).strip()
        zone = str(feature_attrs.get("ZONING") or feature_attrs.get("ZONE_CODE", "UNZONED")).strip()
        acres = Decimal(str(feature_attrs.get("ACRES", feature_attrs.get("ACREAGE", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)

        land_val = Decimal(str(feature_attrs.get("LAND_VALUE", feature_attrs.get("LANDVAL", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)
        impr_val = Decimal(str(feature_attrs.get("IMPR_VALUE", feature_attrs.get("BLDGVAL", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)
        total_val = Decimal(str(feature_attrs.get("TOTAL_ASSESSED", feature_attrs.get("TOTALVAL", land_val + impr_val)))).quantize(
            CENT, rounding=ROUND_HALF_EVEN
        )

        lat = Decimal(str(feature_attrs.get("LATITUDE", feature_attrs.get("LAT", "37.5000"))))
        lon = Decimal(str(feature_attrs.get("LONGITUDE", feature_attrs.get("LON", "-79.8700"))))

        src_url = f"{cls.BASE_URL}?parcel={pid}"
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


class FranklinCountyGISAdapter:
    """
    Normalizes parcel records from Franklin County WebGIS portal (FIPS 51067 - Rocky Mount / SML).
    """
    FIPS_CODE = "51067"
    JURISDICTION = "Franklin County, VA"
    BASE_URL = "https://webgis.net/va/franklin/"

    @classmethod
    def normalize_feature(cls, feature_attrs: Dict[str, Any], verified_at: datetime) -> CanonicalParcel:
        pid = str(feature_attrs.get("PARCEL_ID") or feature_attrs.get("GPIN", "UNKNOWN_PARCEL")).strip()
        owner = str(feature_attrs.get("OWNER_NAME") or feature_attrs.get("OWNER", "UNKNOWN OWNER")).strip()
        addr = str(feature_attrs.get("PROPERTY_ADDRESS") or feature_attrs.get("SITE_ADDR", "")).strip()
        zone = str(feature_attrs.get("ZONING") or feature_attrs.get("ZONE_CODE", "UNZONED")).strip()
        acres = Decimal(str(feature_attrs.get("ACRES", feature_attrs.get("ACREAGE", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)

        land_val = Decimal(str(feature_attrs.get("LAND_VALUE", feature_attrs.get("LANDVAL", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)
        impr_val = Decimal(str(feature_attrs.get("IMPR_VALUE", feature_attrs.get("BLDGVAL", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)
        total_val = Decimal(str(feature_attrs.get("TOTAL_ASSESSED", feature_attrs.get("TOTALVAL", land_val + impr_val)))).quantize(
            CENT, rounding=ROUND_HALF_EVEN
        )

        lat = Decimal(str(feature_attrs.get("LATITUDE", feature_attrs.get("LAT", "37.0000"))))
        lon = Decimal(str(feature_attrs.get("LONGITUDE", feature_attrs.get("LON", "-79.8900"))))

        src_url = f"{cls.BASE_URL}?parcel={pid}"
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


class BedfordCountyGISAdapter:
    """
    Normalizes parcel records from Bedford County WebGIS portal (FIPS 51019 - Bedford / Forest).
    """
    FIPS_CODE = "51019"
    JURISDICTION = "Bedford County, VA"
    BASE_URL = "https://webgis.net/va/bedford/"

    @classmethod
    def normalize_feature(cls, feature_attrs: Dict[str, Any], verified_at: datetime) -> CanonicalParcel:
        pid = str(feature_attrs.get("PARCEL_ID") or feature_attrs.get("GPIN", "UNKNOWN_PARCEL")).strip()
        owner = str(feature_attrs.get("OWNER_NAME") or feature_attrs.get("OWNER", "UNKNOWN OWNER")).strip()
        addr = str(feature_attrs.get("PROPERTY_ADDRESS") or feature_attrs.get("SITE_ADDR", "")).strip()
        zone = str(feature_attrs.get("ZONING") or feature_attrs.get("ZONE_CODE", "UNZONED")).strip()
        acres = Decimal(str(feature_attrs.get("ACRES", feature_attrs.get("ACREAGE", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)

        land_val = Decimal(str(feature_attrs.get("LAND_VALUE", feature_attrs.get("LANDVAL", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)
        impr_val = Decimal(str(feature_attrs.get("IMPR_VALUE", feature_attrs.get("BLDGVAL", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)
        total_val = Decimal(str(feature_attrs.get("TOTAL_ASSESSED", feature_attrs.get("TOTALVAL", land_val + impr_val)))).quantize(
            CENT, rounding=ROUND_HALF_EVEN
        )

        lat = Decimal(str(feature_attrs.get("LATITUDE", feature_attrs.get("LAT", "37.3300"))))
        lon = Decimal(str(feature_attrs.get("LONGITUDE", feature_attrs.get("LON", "-79.5200"))))

        src_url = f"{cls.BASE_URL}?parcel={pid}"
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


class MontgomeryCountyGISAdapter:
    """
    Normalizes parcel records from Montgomery County WebGIS portal (FIPS 51121 - Blacksburg / Christiansburg).
    """
    FIPS_CODE = "51121"
    JURISDICTION = "Montgomery County, VA"
    BASE_URL = "https://webgis.net/va/montgomery/"

    @classmethod
    def normalize_feature(cls, feature_attrs: Dict[str, Any], verified_at: datetime) -> CanonicalParcel:
        pid = str(feature_attrs.get("PARCEL_ID") or feature_attrs.get("GPIN", "UNKNOWN_PARCEL")).strip()
        owner = str(feature_attrs.get("OWNER_NAME") or feature_attrs.get("OWNER", "UNKNOWN OWNER")).strip()
        addr = str(feature_attrs.get("PROPERTY_ADDRESS") or feature_attrs.get("SITE_ADDR", "")).strip()
        zone = str(feature_attrs.get("ZONING") or feature_attrs.get("ZONE_CODE", "UNZONED")).strip()
        acres = Decimal(str(feature_attrs.get("ACRES", feature_attrs.get("ACREAGE", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)

        land_val = Decimal(str(feature_attrs.get("LAND_VALUE", feature_attrs.get("LANDVAL", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)
        impr_val = Decimal(str(feature_attrs.get("IMPR_VALUE", feature_attrs.get("BLDGVAL", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)
        total_val = Decimal(str(feature_attrs.get("TOTAL_ASSESSED", feature_attrs.get("TOTALVAL", land_val + impr_val)))).quantize(
            CENT, rounding=ROUND_HALF_EVEN
        )

        lat = Decimal(str(feature_attrs.get("LATITUDE", feature_attrs.get("LAT", "37.1300"))))
        lon = Decimal(str(feature_attrs.get("LONGITUDE", feature_attrs.get("LON", "-80.4100"))))

        src_url = f"{cls.BASE_URL}?parcel={pid}"
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


class RegionalValleyGISAdapter:
    """
    Fallback adapter for other regional counties and cities (Radford 51750, Craig 51045, Floyd 51063).
    """
    JURISDICTION_MAP = {
        "51750": "City of Radford, VA",
        "51045": "Craig County, VA",
        "51063": "Floyd County, VA",
    }

    @classmethod
    def normalize_feature(cls, fips_code: str, feature_attrs: Dict[str, Any], verified_at: datetime) -> CanonicalParcel:
        pid = str(feature_attrs.get("PARCEL_ID") or feature_attrs.get("GPIN", "UNKNOWN_PARCEL")).strip()
        owner = str(feature_attrs.get("OWNER_NAME") or feature_attrs.get("OWNER", "UNKNOWN OWNER")).strip()
        addr = str(feature_attrs.get("PROPERTY_ADDRESS") or feature_attrs.get("SITE_ADDR", "")).strip()
        zone = str(feature_attrs.get("ZONING") or feature_attrs.get("ZONE_CODE", "UNZONED")).strip()
        acres = Decimal(str(feature_attrs.get("ACRES", feature_attrs.get("ACREAGE", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)

        land_val = Decimal(str(feature_attrs.get("LAND_VALUE", feature_attrs.get("LANDVAL", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)
        impr_val = Decimal(str(feature_attrs.get("IMPR_VALUE", feature_attrs.get("BLDGVAL", "0.00")))).quantize(CENT, rounding=ROUND_HALF_EVEN)
        total_val = Decimal(str(feature_attrs.get("TOTAL_ASSESSED", feature_attrs.get("TOTALVAL", land_val + impr_val)))).quantize(
            CENT, rounding=ROUND_HALF_EVEN
        )

        lat = Decimal(str(feature_attrs.get("LATITUDE", feature_attrs.get("LAT", "37.2000"))))
        lon = Decimal(str(feature_attrs.get("LONGITUDE", feature_attrs.get("LON", "-80.2000"))))

        jurisdiction = cls.JURISDICTION_MAP.get(fips_code, f"Regional County FIPS {fips_code}")
        src_url = f"https://webgis.net/va/regional/?fips={fips_code}&parcel={pid}"

        return CanonicalParcel(
            fips_code=fips_code,
            jurisdiction_name=jurisdiction,
            parcel_id=pid,
            owner_name=owner,
            site_address=addr,
            zoning_code=zone,
            acreage=acres,
            land_assessed_usd=ProvenancedValue(
                value=land_val,
                source_url=src_url,
                verified_at=verified_at,
                confidence_score=Decimal("0.95"),
                epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
            ),
            improvement_assessed_usd=ProvenancedValue(
                value=impr_val,
                source_url=src_url,
                verified_at=verified_at,
                confidence_score=Decimal("0.95"),
                epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
            ),
            total_assessed_usd=ProvenancedValue(
                value=total_val,
                source_url=src_url,
                verified_at=verified_at,
                confidence_score=Decimal("0.95"),
                epistemic_tier=EpistemicTier.TIER_B_PUBLIC_RECORD,
            ),
            latitude=lat,
            longitude=lon,
            has_hard_asset_floor=(total_val >= Decimal("150000.00") and impr_val > Decimal("0.00")),
        )


def get_regional_gis_adapter(fips_code: str) -> Any:
    """
    Returns the appropriate GIS adapter class for a given FIPS code in the Roanoke Valley & neighboring region.
    """
    adapters = {
        "51161": RoanokeCountyGISAdapter,
        "51770": RoanokeCityGISAdapter,
        "51775": SalemCityGISAdapter,
        "51023": BotetourtCountyGISAdapter,
        "51067": FranklinCountyGISAdapter,
        "51019": BedfordCountyGISAdapter,
        "51121": MontgomeryCountyGISAdapter,
    }
    return adapters.get(fips_code, RegionalValleyGISAdapter)

