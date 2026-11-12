"""
Argus Probabilistic Entity Resolver.
Inspired by moj-analytical-services/splink (Fellegi-Sunter Probabilistic Record Linkage).
Determines corporate entity, individual principal, and tax record linkage across
court dockets, Virginia SCC corporate records, and Roanoke GIS tax rolls.
Strictly air-gapped, zero-float, pure Decimal precision.
"""

from decimal import Decimal, ROUND_HALF_EVEN
import re
from typing import Dict, Any, Optional

from .models import EntityResolutionMatchResult


class SplinkEntityResolver:
    """
    Fellegi-Sunter probabilistic entity resolution engine.
    Computes Jaro-Winkler similarity, address token-set similarity,
    and composite match probability between corporate and individual records.
    """

    @staticmethod
    def _normalize_name(name: str) -> str:
        """Strip punctuation, legal entity suffixes, and uppercase for comparison."""
        cleaned = name.upper().strip()
        # Remove common corporate suffixes for root matching
        suffixes = [
            r"\bLLC\b", r"\bL\.L\.C\.\b", r"\bINC\b", r"\bINC\.\b",
            r"\bCORP\b", r"\bCORP\.\b", r"\bCORPORATION\b",
            r"\bCO\b", r"\bCO\.\b", r"\bCOMPANY\b", r"\bLTD\b", r"\bLIMITED\b",
            r"\bPC\b", r"\bP\.C\.\b", r"\bPLLC\b", r"\bP\.L\.L\.C\.\b"
        ]
        for s in suffixes:
            cleaned = re.sub(s, "", cleaned)
        cleaned = re.sub(r"[^\w\s]", "", cleaned)
        return " ".join(cleaned.split())

    @staticmethod
    def _normalize_address(addr: str) -> str:
        """Standardize street abbreviations and uppercase."""
        cleaned = addr.upper().strip()
        replacements = {
            r"\bSTREET\b": "ST",
            r"\bAVENUE\b": "AVE",
            r"\bROAD\b": "RD",
            r"\bBOULEVARD\b": "BLVD",
            r"\bDRIVE\b": "DR",
            r"\bLANE\b": "LN",
            r"\bCOURT\b": "CT",
            r"\bNORTH\b": "N",
            r"\bSOUTH\b": "S",
            r"\bEAST\b": "E",
            r"\bWEST\b": "W",
            r"\bSOUTHEAST\b": "SE",
            r"\bSOUTHWEST\b": "SW",
            r"\bNORTHEAST\b": "NE",
            r"\bNORTHWEST\b": "NW",
            r"\bSUITE\b": "STE",
            r"\bAPARTMENT\b": "APT",
        }
        for full, abbr in replacements.items():
            cleaned = re.sub(full, abbr, cleaned)
        cleaned = re.sub(r"[^\w\s]", "", cleaned)
        return " ".join(cleaned.split())

    @classmethod
    def jaro_winkler_score(cls, s1: str, s2: str) -> Decimal:
        """Deterministic Jaro-Winkler similarity score (0.00 to 1.00)."""
        s1_norm = cls._normalize_name(s1)
        s2_norm = cls._normalize_name(s2)

        if not s1_norm or not s2_norm:
            return Decimal("0.00")
        if s1_norm == s2_norm:
            return Decimal("1.00")

        len1, len2 = len(s1_norm), len(s2_norm)
        match_bound = max(len1, len2) // 2 - 1
        if match_bound < 0:
            match_bound = 0

        s1_matches = [False] * len1
        s2_matches = [False] * len2

        matches = 0
        for i in range(len1):
            start = max(0, i - match_bound)
            end = min(i + match_bound + 1, len2)
            for j in range(start, end):
                if s2_matches[j] or s1_norm[i] != s2_norm[j]:
                    continue
                s1_matches[i] = True
                s2_matches[j] = True
                matches += 1
                break

        if matches == 0:
            return Decimal("0.00")

        transpositions = 0
        k = 0
        for i in range(len1):
            if not s1_matches[i]:
                continue
            while not s2_matches[k]:
                k += 1
            if s1_norm[i] != s2_norm[k]:
                transpositions += 1
            k += 1

        m_dec = Decimal(str(matches))
        l1_dec = Decimal(str(len1))
        l2_dec = Decimal(str(len2))
        t_dec = Decimal(str(transpositions // 2))

        # Jaro formula: (m/l1 + m/l2 + (m-t)/m) / 3
        term1 = (m_dec / l1_dec)
        term2 = (m_dec / l2_dec)
        term3 = ((m_dec - t_dec) / m_dec)
        jaro = (term1 + term2 + term3) / Decimal("3.0")

        # Winkler prefix bonus (up to 4 chars, prefix scale = 0.1)
        prefix_len = 0
        max_prefix = min(4, min(len1, len2))
        for p in range(max_prefix):
            if s1_norm[p] == s2_norm[p]:
                prefix_len += 1
            else:
                break

        p_dec = Decimal(str(prefix_len)) * Decimal("0.1")
        jw = jaro + (p_dec * (Decimal("1.0") - jaro))
        return min(Decimal("1.00"), max(Decimal("0.00"), jw.quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)))

    @classmethod
    def address_token_score(cls, a1: str, a2: str) -> Decimal:
        """Deterministic Jaccard token overlap for normalized physical addresses."""
        norm1 = set(cls._normalize_address(a1).split())
        norm2 = set(cls._normalize_address(a2).split())
        if not norm1 or not norm2:
            return Decimal("0.00")
        intersection = len(norm1.intersection(norm2))
        union = len(norm1.union(norm2))
        if union == 0:
            return Decimal("0.00")
        score = Decimal(str(intersection)) / Decimal(str(union))
        return score.quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)

    @classmethod
    def resolve_entity(
        cls,
        source_record: Dict[str, Any],
        candidate_record: Dict[str, Any]
    ) -> EntityResolutionMatchResult:
        """
        Executes Fellegi-Sunter record linkage between a source record and candidate.
        Accepts dicts containing:
        - 'id': str
        - 'name': str
        - 'address': Optional[str]
        - 'tax_id': Optional[str] (EIN or SCC ID)
        """
        source_id = str(source_record.get("id", "SRC-UNKNOWN"))
        candidate_id = str(candidate_record.get("id", "CAND-UNKNOWN"))

        s_name = str(source_record.get("name", ""))
        c_name = str(candidate_record.get("name", ""))
        s_addr = str(source_record.get("address", ""))
        c_addr = str(candidate_record.get("address", ""))
        s_tax = str(source_record.get("tax_id", "")).replace("-", "").strip()
        c_tax = str(candidate_record.get("tax_id", "")).replace("-", "").strip()

        # 1. Exact Tax ID check (Virginia SCC or Federal EIN)
        tax_id_match = False
        if s_tax and c_tax and s_tax == c_tax:
            tax_id_match = True

        # 2. String similarities
        jw_name = cls.jaro_winkler_score(s_name, c_name)
        addr_sim = cls.address_token_score(s_addr, c_addr) if (s_addr and c_addr) else Decimal("0.50")

        # 3. Composite Fellegi-Sunter probability calculation
        if tax_id_match:
            # Deterministic statutory linkage via registered ID
            prob = Decimal("0.99")
            reasoning = f"Direct statutory tax identifier match ({s_tax}). High certainty linkage."
        else:
            # Weighted multi-modal features: 60% name, 40% address
            prob = (jw_name * Decimal("0.60") + addr_sim * Decimal("0.40")).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
            reasoning = f"Probabilistic Fellegi-Sunter link: Jaro-Winkler name score {jw_name}, address similarity {addr_sim}."

        # 4. Tier Classification
        if prob >= Decimal("0.95"):
            tier = "CERTAIN"
            is_merged = True
        elif prob >= Decimal("0.80"):
            tier = "HIGH_PROBABILITY"
            is_merged = True
        elif prob >= Decimal("0.60"):
            tier = "POSSIBLE_ASSOCIATION"
            is_merged = False
        else:
            tier = "DISTINCT"
            is_merged = False

        canonical_id = f"CANONICAL-{source_id}" if is_merged else source_id

        return EntityResolutionMatchResult(
            source_record_id=source_id,
            candidate_record_id=candidate_id,
            match_probability=prob,
            match_tier=tier,
            jaro_winkler_name_score=jw_name,
            address_similarity_score=addr_sim,
            tax_id_exact_match=tax_id_match,
            is_merged=is_merged,
            canonical_entity_id=canonical_id,
            epistemic_reasoning=reasoning
        )


splink_entity_resolver = SplinkEntityResolver()
