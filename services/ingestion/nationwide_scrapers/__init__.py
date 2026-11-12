"""
Nationwide Sovereign Scrapers & Crawlers Package.
Includes:
- FederalCourtStreamer (94 Federal Bankruptcy CM/ECF Courts)
- StatewidePublicNoticeScraper (50 State Press Association Legal Notice Portals)
- GovernmentAuctionScraper (GovDeals, RealAuction, Bid4Assets, PublicSurplus)
- UniversalArcGISParcelCrawler (County Assessors & GIS REST Servers)
- NationwideIngestionCoordinator & nationwide_coordinator
"""

from .courtlistener_recap_adapter import CourtListenerRecapAdapter, RecapDocumentMetadata
from .federal_court_streamer import FederalCourtDocketItem, FederalCourtStreamer
from .government_auctions import GovernmentAuctionScrapeItem, GovernmentAuctionScraper
from .statewide_public_notices import PublicNoticeScrapeItem, StatewidePublicNoticeScraper
from .universal_arcgis_parcel_crawler import UniversalArcGISParcelCrawler
from .pipeline_coordinator import (
    NationwideIngestionCoordinator,
    NationwideScanResult,
    nationwide_coordinator,
)

__all__ = [
    "CourtListenerRecapAdapter",
    "RecapDocumentMetadata",
    "FederalCourtDocketItem",
    "FederalCourtStreamer",
    "GovernmentAuctionScrapeItem",
    "GovernmentAuctionScraper",
    "PublicNoticeScrapeItem",
    "StatewidePublicNoticeScraper",
    "UniversalArcGISParcelCrawler",
    "NationwideIngestionCoordinator",
    "NationwideScanResult",
    "nationwide_coordinator",
]
