// ─── CHARITY PAGE ─────────────────────────────
// Fetches charity list + user's current selection
// Features: search/filter, charity profile modal, events, donation form
// PRD: §08 charity listing with search, individual profiles, events, independent donations

"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart, Search, Star, MapPin, ExternalLink, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import CharityCard from "@/components/charity/CharityCard";
import ContributionSlider from "@/components/charity/ContributionSlider";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { TOAST_MESSAGES } from "@/constants";
import { cn, formatDate } from "@/lib/utils";
import type { Charity, CharityEvent, UserCharitySelection } from "@/types";

// Charity with nested events (returned by GET /api/charities)
type CharityWithEvents = Charity & { charity_events?: CharityEvent[] };

// ─── CHARITY PROFILE MODAL CONTENT ────────────
// Rendered inside Modal — shows full description, events, donation form
function CharityProfileContent({
  charity,
  onClose,
  onSelect,
  isSelected,
  isLoading,
}: {
  charity: CharityWithEvents;
  onClose: () => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  isLoading: boolean;
}) {
  const [donationAmount, setDonationAmount] = useState("10");
  const [donationError, setDonationError] = useState<string | null>(null);
  const [isDonating, setIsDonating] = useState(false);

  const presets = [5, 10, 25, 50];

  const handleDonate = async () => {
    const amount = parseFloat(donationAmount);
    if (!donationAmount || isNaN(amount) || amount <= 0) {
      setDonationError("Please enter a valid donation amount");
      return;
    }
    setDonationError(null);
    setIsDonating(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ charity_id: charity.id, amount }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      // Redirect to Stripe Checkout
      window.location.href = result.data.url;
    } catch (err) {
      toast.error(TOAST_MESSAGES.GENERIC_ERROR);
      console.error(err);
    } finally {
      setIsDonating(false);
    }
  };

  const upcomingEvents = charity.charity_events?.filter(
    (e) => !e.event_date || new Date(e.event_date) >= new Date()
  ) ?? [];

  return (
    <div className="flex flex-col gap-5">
      {/* Charity image or placeholder */}
      {charity.image_url ? (
        <img
          src={charity.image_url}
          alt={charity.name}
          className="w-full h-44 object-cover rounded-xl"
        />
      ) : (
        <div className="w-full h-32 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
          <Heart className="w-12 h-12 text-[var(--color-primary)]/40" />
        </div>
      )}

      {/* Featured badge + website */}
      <div className="flex items-center gap-3 flex-wrap">
        {charity.is_featured && (
          <span className="badge badge-info text-[10px] uppercase tracking-wider">Featured</span>
        )}
        {charity.website_url && (
          <a
            href={charity.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Visit website
          </a>
        )}
      </div>

      {/* Full description */}
      {charity.description && (
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
          {charity.description}
        </p>
      )}

      {/* ─── EVENTS ──────────────────────────── */}
      {upcomingEvents.length > 0 && (
        <div>
          <h3 className="font-heading text-base font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            Upcoming Events
          </h3>
          <ul className="flex flex-col gap-2">
            {upcomingEvents.map((event) => (
              <li
                key={event.id}
                className="p-3 rounded-xl bg-[var(--color-secondary)]/60 border border-[var(--color-border)] flex flex-col gap-1"
              >
                <p className="font-medium text-sm text-[var(--color-text-primary)]">{event.title}</p>
                {event.event_date && (
                  <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(event.event_date)}
                  </p>
                )}
                {event.location && (
                  <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </p>
                )}
                {event.description && (
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mt-1">
                    {event.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── DONATION FORM ───────────────────── */}
      <div className="border-t border-[var(--color-border)] pt-4">
        <h3 className="font-heading text-base font-bold text-[var(--color-text-primary)] mb-3">
          Make a Direct Donation
        </h3>
        {/* Preset amount buttons */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {presets.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => { setDonationAmount(String(amt)); setDonationError(null); }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                donationAmount === String(amt)
                  ? "bg-[var(--color-primary)] text-[var(--color-text-on-dark)] border-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40"
              )}
            >
              £{amt}
            </button>
          ))}
        </div>
        {/* Custom amount + donate button */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              label="Custom amount (GBP)"
              type="number"
              min="1"
              step="0.01"
              value={donationAmount}
              onChange={(e) => { setDonationAmount(e.target.value); setDonationError(null); }}
              error={donationError ?? undefined}
              placeholder="10.00"
            />
          </div>
          <Button
            variant="secondary"
            size="md"
            isLoading={isDonating}
            loadingText="Redirecting..."
            onClick={handleDonate}
            className="mb-0 flex-shrink-0"
          >
            Donate £{donationAmount || "0"}
          </Button>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          You&apos;ll be redirected to Stripe Checkout to complete your donation securely.
        </p>
      </div>

      {/* ─── SELECT CHARITY FOOTER ───────────── */}
      <div className="border-t border-[var(--color-border)] pt-4 flex justify-end">
        <Button
          variant={isSelected ? "secondary" : "primary"}
          size="md"
          onClick={() => { onSelect(charity.id); onClose(); }}
          disabled={isLoading || isSelected}
          icon={isSelected ? <Heart className="w-4 h-4" /> : undefined}
        >
          {isSelected ? "✓ Currently Selected" : "Select This Charity"}
        </Button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────
export default function CharityPage() {
  const { subscription } = useAuth();

  const [charities, setCharities] = useState<CharityWithEvents[]>([]);
  const [selection, setSelection] = useState<UserCharitySelection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ─── SEARCH + FILTER STATE ────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFeatured, setFilterFeatured] = useState(false);

  // ─── PROFILE MODAL STATE ──────────────────
  const [profileCharity, setProfileCharity] = useState<CharityWithEvents | null>(null);

  const isActive = subscription?.status === "active";

  // ─── DERIVED: filtered charity list ──────
  const filteredCharities = charities
    .filter((c) => !filterFeatured || c.is_featured)
    .filter(
      (c) =>
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // ─── FETCH CHARITIES + SELECTION ─────────
  const fetchCharities = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/charities");
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setCharities(result.data?.charities ?? []);
      setSelection(result.data?.my_selection ?? null);
    } catch {
      toast.error("Failed to load charities");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharities();
  }, [fetchCharities]);

  // ─── DONATION URL FEEDBACK ────────────────
  // Stripe redirects back with ?donation=success or ?donation=cancelled
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("donation") === "success") {
      toast.success("Donation received! Thank you for your generosity. 💚");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("donation") === "cancelled") {
      toast("Donation cancelled.", { icon: "ℹ️" });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // ─── SELECT CHARITY ───────────────────────
  const handleSelect = async (charityId: string) => {
    if (!isActive) {
      toast.error(TOAST_MESSAGES.SUBSCRIPTION_REQUIRED);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/charities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          charity_id: charityId,
          contribution_percentage: selection?.contribution_percentage ?? 10,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setSelection(result.data);
      toast.success(TOAST_MESSAGES.CHARITY_SELECTED);
    } catch {
      toast.error(TOAST_MESSAGES.GENERIC_ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── UPDATE CONTRIBUTION % ────────────────
  const handleUpdatePercentage = async (percentage: number) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/charities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contribution_percentage: percentage }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setSelection((prev) =>
        prev ? { ...prev, contribution_percentage: percentage } : prev
      );
    } catch {
      toast.error(TOAST_MESSAGES.GENERIC_ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading charities..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ─── PAGE HEADER ─────────────────────── */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)]">
          My Charity
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Choose the cause your subscription supports. Minimum 10% of every payment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── CHARITY GRID (2/3 width) ────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-[var(--color-text-primary)]">
              Choose a Charity
            </h2>
          </div>

          {/* ─── SEARCH + FILTER ──────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Search input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search charities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[rgba(26,60,52,0.2)] focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
            {/* Featured filter */}
            <button
              onClick={() => setFilterFeatured((p) => !p)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                filterFeatured
                  ? "bg-[var(--color-primary)] text-[var(--color-text-on-dark)] border-[var(--color-primary)]"
                  : "bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]/40"
              )}
            >
              <Star className="w-3.5 h-3.5" />
              {filterFeatured ? "Featured Only" : "All Charities"}
            </button>
            {/* Result count */}
            {(searchQuery || filterFeatured) && (
              <span className="text-xs text-[var(--color-text-muted)]">
                {filteredCharities.length} result{filteredCharities.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* ─── CHARITY CARDS ────────────────── */}
          {charities.length === 0 ? (
            <EmptyState
              icon={<Heart className="w-10 h-10" />}
              title="No charities available"
              description="Check back soon — new verified charities are added regularly."
            />
          ) : filteredCharities.length === 0 ? (
            <EmptyState
              icon={<Search className="w-10 h-10" />}
              title="No charities match your search"
              description="Try a different name or clear the filter."
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearchQuery(""); setFilterFeatured(false); }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCharities.map((charity) => (
                <CharityCard
                  key={charity.id}
                  charity={charity}
                  isSelected={selection?.charity_id === charity.id}
                  onSelect={handleSelect}
                  onViewProfile={(c) => setProfileCharity(c)}
                  isLoading={isSaving}
                />
              ))}
            </div>
          )}
        </div>

        {/* ─── CONTRIBUTION SLIDER (1/3 width) ─── */}
        <div className="flex flex-col gap-4">
          {selection ? (
            <ContributionSlider
              currentPercentage={selection.contribution_percentage}
              onUpdate={handleUpdatePercentage}
              isLoading={isSaving}
            />
          ) : (
            <div className="card p-6 text-center">
              <Heart className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-3" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                Select a charity first to set your contribution percentage.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── CHARITY PROFILE MODAL ───────────── */}
      <Modal
        isOpen={profileCharity !== null}
        onClose={() => setProfileCharity(null)}
        title={profileCharity?.name ?? ""}
        size="lg"
      >
        {profileCharity && (
          <CharityProfileContent
            charity={profileCharity}
            onClose={() => setProfileCharity(null)}
            onSelect={handleSelect}
            isSelected={selection?.charity_id === profileCharity.id}
            isLoading={isSaving}
          />
        )}
      </Modal>
    </div>
  );
}
