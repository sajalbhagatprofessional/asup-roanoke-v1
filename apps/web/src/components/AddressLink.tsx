"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MapPin,
  ExternalLink,
  Layers,
  Eye,
  Compass,
  Globe,
  Building,
  Waves,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  buildGoogleMapsUrl,
  buildGoogleSatelliteUrl,
  buildGoogleStreetViewUrl,
  buildAppleMapsUrl,
  buildOpenStreetMapUrl,
  buildGisPortalUrl,
  buildFemaFloodUrl,
  formatFullAddress,
  ResearchTargetParams,
} from "../lib/researchLinks";

export interface AddressLinkProps {
  address?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  fipsCode?: string;
  parcelId?: string;
  latitude?: number;
  longitude?: number;
  className?: string;
  showPinIcon?: boolean;
  size?: "xs" | "sm" | "md";
}

export default function AddressLink({
  address,
  streetAddress,
  city,
  state,
  zipCode,
  county,
  fipsCode,
  parcelId,
  latitude,
  longitude,
  className = "",
  showPinIcon = true,
  size = "sm",
}: AddressLinkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const params: ResearchTargetParams = {
    streetAddress: streetAddress || address,
    city,
    state: state || "VA",
    zipCode,
    county,
    fipsCode,
    parcelId,
    latitude,
    longitude,
  };

  const fullAddress = address || formatFullAddress(params) || "Roanoke, VA";
  const displayAddress = streetAddress
    ? `${streetAddress}${city ? `, ${city}` : ""}${state ? ` ${state}` : ""}`
    : fullAddress;

  const googleMapsUrl = buildGoogleMapsUrl(fullAddress);
  const satelliteUrl = buildGoogleSatelliteUrl(fullAddress);
  const streetViewUrl = buildGoogleStreetViewUrl(fullAddress, latitude, longitude);
  const appleMapsUrl = buildAppleMapsUrl(fullAddress);
  const osmUrl = buildOpenStreetMapUrl(fullAddress);
  const gisUrl = buildGisPortalUrl(params);
  const femaUrl = buildFemaFloodUrl(fullAddress);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const textSize = size === "xs" ? "text-[11px]" : size === "md" ? "text-sm" : "text-xs";
  const iconSize = size === "xs" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <div
      ref={popoverRef}
      className={`relative inline-flex items-center gap-1 group/addr ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Primary Clickable Link: Launches Google Maps in new tab */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Open address in Google Maps (or click arrow for satellite/GIS)"
        className={`inline-flex items-center gap-1.5 font-medium text-zinc-300 hover:text-emerald-400 transition-colors cursor-pointer group-hover/addr:underline underline-offset-2 ${textSize}`}
      >
        {showPinIcon && <MapPin className={`${iconSize} text-emerald-400 shrink-0`} />}
        <span className="truncate max-w-[260px] sm:max-w-[340px]">{displayAddress}</span>
      </a>

      {/* Popover Toggle Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label="View map and satellite options"
        title="View satellite, street view, Apple maps, and county GIS"
        className="p-0.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
      >
        <ChevronDown className="w-3 h-3" />
      </button>

      {/* Floating Interactive Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-72 p-2.5 rounded-xl bg-zinc-900/95 border border-zinc-700/80 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-left font-sans">
          {/* Header with Address & Copy Action */}
          <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-zinc-800">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                Physical Geospatial
              </span>
              <p className="text-xs font-semibold text-white truncate" title={fullAddress}>
                {fullAddress}
              </p>
            </div>
            <button
              onClick={handleCopy}
              title="Copy formatted address"
              className="inline-flex items-center gap-1 px-1.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-medium transition shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-zinc-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Quick-Map Option Links */}
          <div className="space-y-1">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-800/80 text-xs text-zinc-200 hover:text-white transition group/item"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Maps (Standard)</span>
              </div>
              <ExternalLink className="w-3 h-3 text-zinc-500 group-hover/item:text-zinc-300" />
            </a>

            <a
              href={satelliteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-800/80 text-xs text-zinc-200 hover:text-white transition group/item"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Google Satellite Imagery</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">
                AERIAL
              </span>
            </a>

            <a
              href={streetViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-800/80 text-xs text-zinc-200 hover:text-white transition group/item"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Street View (Pano)</span>
              </div>
              <ExternalLink className="w-3 h-3 text-zinc-500 group-hover/item:text-zinc-300" />
            </a>

            <a
              href={appleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-800/80 text-xs text-zinc-200 hover:text-white transition group/item"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                <span>Apple Maps</span>
              </div>
              <ExternalLink className="w-3 h-3 text-zinc-500 group-hover/item:text-zinc-300" />
            </a>

            <a
              href={osmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-800/80 text-xs text-zinc-200 hover:text-white transition group/item"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>OpenStreetMap Topology</span>
              </div>
              <ExternalLink className="w-3 h-3 text-zinc-500 group-hover/item:text-zinc-300" />
            </a>

            <a
              href={gisUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-800/80 text-xs text-zinc-200 hover:text-white transition group/item"
            >
              <div className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                <span>County / City GIS Parcel</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                GPIN
              </span>
            </a>

            <a
              href={femaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-800/80 text-xs text-zinc-200 hover:text-white transition group/item"
            >
              <div className="flex items-center gap-2">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                <span>FEMA Flood Hazard Center</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                FLOOD
              </span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
