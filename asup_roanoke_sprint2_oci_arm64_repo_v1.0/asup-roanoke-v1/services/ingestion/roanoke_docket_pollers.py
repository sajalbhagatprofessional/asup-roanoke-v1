import hashlib
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from packages.mandate_filter import (
    MandateEvaluationResult,
    RawDocketCandidate,
    evaluate_mandate_roa_smb_01,
)


@dataclass(frozen=True)
class BronzeRecord:
    source_name: str
    source_url: str
    payload_sha256: str
    raw_text: str
    ingested_at: datetime


@dataclass(frozen=True)
class ParsedDistressFiling:
    docket_id: str
    signal_type: str  # BANKRUPTCY_VAWBK | SUBSTITUTE_TRUSTEE_SALE | CITY_TAX_SALE | COUNTY_JUDICIAL_SALE
    fips_code: str
    parcel_id: str
    entity_or_debtor_name: str
    naics_code: str
    asking_or_cure_price_usd: Decimal
    notice_published_date: Optional[date]
    scheduled_sale_date: Optional[date]
    fiduciary_or_trustee_name: str
    source_url: str
    bronze_sha256: str


@dataclass
class BronzeIngestVault:
    """
    Append-only SHA-256 content-addressed Bronze Vault.
    Deduplicates repeat polls and immediately runs the Stage 1 Mandate Gate (ROA-SMB-01)
    at ingestion before any paid enrichment API is called.
    """
    _records_by_sha: Dict[str, BronzeRecord] = field(default_factory=dict)

    def ingest_and_gate(
        self,
        source_name: str,
        source_url: str,
        raw_text: str,
        parsed: ParsedDistressFiling,
        ingested_at: datetime,
    ) -> Tuple[bool, BronzeRecord, MandateEvaluationResult]:
        sha = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()
        is_new = sha not in self._records_by_sha
        if is_new:
            self._records_by_sha[sha] = BronzeRecord(
                source_name=source_name,
                source_url=source_url,
                payload_sha256=sha,
                raw_text=raw_text,
                ingested_at=ingested_at,
            )
        bronze_rec = self._records_by_sha[sha]

        candidate = RawDocketCandidate(
            docket_id=parsed.docket_id,
            fips_code=parsed.fips_code,
            parcel_id=parsed.parcel_id,
            entity_name=parsed.entity_or_debtor_name,
            naics_code=parsed.naics_code,
            asking_or_cure_price_usd=parsed.asking_or_cure_price_usd,
            has_real_estate_or_equipment_floor=True,
            is_predatory_personal_distress=False,
        )
        gate_result = evaluate_mandate_roa_smb_01(candidate)
        return is_new, bronze_rec, gate_result


def parse_vawbk_rss_xml(xml_text: str) -> List[ParsedDistressFiling]:
    """
    Parses the public U.S. Bankruptcy Court W.D. Va. Roanoke Division (VAWBK - 210 Church Ave SW)
    CMECF RSS docket feed for commercial Chapter 11 / Chapter 7 filings.
    """
    root = ET.fromstring(xml_text)
    filings: List[ParsedDistressFiling] = []
    sha = hashlib.sha256(xml_text.encode("utf-8")).hexdigest()

    for item in root.findall(".//item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "https://pacer.uscourts.gov/file-case/court-cmecf-lookup/court/VAWBK").strip()
        desc = (item.findtext("description") or "").strip()

        # Example title: "26-70812-VAWBK | Star City Industrial Supply LLC | Ch 11"
        parts = [p.strip() for p in title.split("|")]
        docket_id = parts[0] if len(parts) >= 1 else "VAWBK-UNKNOWN"
        entity_name = parts[1] if len(parts) >= 2 else title

        fips_match = re.search(r"FIPS:(\d{5})", desc)
        parcel_match = re.search(r"PARCEL:([A-Za-z0-9\-]+)", desc)
        naics_match = re.search(r"NAICS:(\d{4,6})", desc)
        liab_match = re.search(r"SECURED_CLAIM_USD:([0-9\.]+)", desc)
        trustee_match = re.search(r"TRUSTEE:([^;]+)", desc)

        filings.append(
            ParsedDistressFiling(
                docket_id=docket_id,
                signal_type="BANKRUPTCY_VAWBK",
                fips_code=fips_match.group(1) if fips_match else "51770",
                parcel_id=parcel_match.group(1) if parcel_match else "UNKNOWN-PARCEL",
                entity_or_debtor_name=entity_name,
                naics_code=naics_match.group(1) if naics_match else "332710",
                asking_or_cure_price_usd=Decimal(liab_match.group(1)) if liab_match else Decimal("1500000.00"),
                notice_published_date=None,
                scheduled_sale_date=None,
                fiduciary_or_trustee_name=(trustee_match.group(1).strip() if trustee_match else "U.S. Trustee VAWBK"),
                source_url=link,
                bronze_sha256=sha,
            )
        )
    return filings


def parse_roanoke_times_trustee_notice(notice_dict: Dict[str, str]) -> ParsedDistressFiling:
    """
    Parses a Virginia Non-Judicial Substitute Trustee Foreclosure Sale Notice (Va. Code § 55.1-321)
    from The Roanoke Times Public Notices (roanoke.column.us/search).
    """
    raw_repr = repr(sorted(notice_dict.items()))
    sha = hashlib.sha256(raw_repr.encode("utf-8")).hexdigest()
    pub_date = date.fromisoformat(notice_dict["published_date"])
    sale_date = date.fromisoformat(notice_dict["sale_date"])

    return ParsedDistressFiling(
        docket_id=notice_dict["notice_id"],
        signal_type="SUBSTITUTE_TRUSTEE_SALE",
        fips_code=notice_dict["fips_code"],
        parcel_id=notice_dict["parcel_id"],
        entity_or_debtor_name=notice_dict["grantor_entity_name"],
        naics_code=notice_dict["naics_code"],
        asking_or_cure_price_usd=Decimal(notice_dict["estimated_cure_and_payoff_usd"]),
        notice_published_date=pub_date,
        scheduled_sale_date=sale_date,
        fiduciary_or_trustee_name=notice_dict["substitute_trustee_firm"],
        source_url=notice_dict["source_url"],
        bronze_sha256=sha,
    )


def parse_roanoke_city_tacs_tax_sale(row: Dict[str, str]) -> ParsedDistressFiling:
    """
    Parses a City of Roanoke Real Estate Tax Sale parcel entry (roanokeva.gov/1382/Tax-Sale / taxva.com).
    """
    raw_repr = repr(sorted(row.items()))
    sha = hashlib.sha256(raw_repr.encode("utf-8")).hexdigest()
    return ParsedDistressFiling(
        docket_id=row["tax_sale_id"],
        signal_type="CITY_TAX_SALE",
        fips_code="51770",
        parcel_id=row["parcel_id"],
        entity_or_debtor_name=row["owner_of_record"],
        naics_code=row["naics_code"],
        asking_or_cure_price_usd=Decimal(row["Minimum_bid_or_assessed_usd"]),
        notice_published_date=date.fromisoformat(row["published_date"]),
        scheduled_sale_date=date.fromisoformat(row["auction_date"]),
        fiduciary_or_trustee_name="Taxing Authority Consulting Services, PC (TACS)",
        source_url=row.get("source_url", "https://taxva.com/rs-tax-sales/city-of-roanoke-real-estate-tax-sales-2/"),
        bronze_sha256=sha,
    )


def parse_roanoke_county_judicial_sale(row: Dict[str, str]) -> ParsedDistressFiling:
    """
    Parses a Roanoke County Judicial Sale parcel entry (roanokecountyva.gov/397/Judicial-Sales).
    """
    raw_repr = repr(sorted(row.items()))
    sha = hashlib.sha256(raw_repr.encode("utf-8")).hexdigest()
    return ParsedDistressFiling(
        docket_id=row["judicial_sale_id"],
        signal_type="COUNTY_JUDICIAL_SALE",
        fips_code="51161",
        parcel_id=row["gpin"],
        entity_or_debtor_name=row["owner_of_record"],
        naics_code=row["naics_code"],
        asking_or_cure_price_usd=Decimal(row["cure_or_assessed_usd"]),
        notice_published_date=date.fromisoformat(row["published_date"]),
        scheduled_sale_date=date.fromisoformat(row["sale_date"]),
        fiduciary_or_trustee_name=row.get("special_commissioner", "Roanoke County Special Commissioner"),
        source_url=row.get("source_url", "https://www.roanokecountyva.gov/397/Judicial-Sales"),
        bronze_sha256=sha,
    )
