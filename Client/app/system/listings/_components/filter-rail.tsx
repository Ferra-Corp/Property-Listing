import { Button } from "../../../_components/ui/button"
import { FilterCheck, FilterHeading } from "../../../_components/ui/filters"
import { Input, Segmented } from "../../../_components/ui/field"
import type { ListingPurpose, PropertyType } from "../../../_lib/Types/Listing"

export type ListingFilters = {
  purpose: ListingPurpose | null
  category: PropertyType[]
  unitTypes: string[]
  locations: string[]
  floorAreaMin: string
  floorAreaMax: string
  priceMin: string
  priceMax: string
  exclusiveOnly: boolean
}

export const EMPTY_LISTING_FILTERS: ListingFilters = {
  purpose: null,
  category: [],
  unitTypes: [],
  locations: [],
  floorAreaMin: "",
  floorAreaMax: "",
  priceMin: "",
  priceMax: "",
  exclusiveOnly: false,
}

export type FilterOption = { value: string; label: string; count: number }

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

/**
 * The refine rail — a quiet left column on desktop, the body of the filter
 * sheet on small screens. Fully controlled: every option and count comes
 * from the real listings currently loaded.
 */
export function FilterRail({
  compact = false,
  filters,
  onChange,
  onReset,
  categoryOptions,
  unitTypeOptions,
  locationOptions,
  exclusiveCount,
  resultCount,
  onDone,
}: {
  compact?: boolean
  filters: ListingFilters
  onChange: (patch: Partial<ListingFilters>) => void
  onReset: () => void
  categoryOptions: FilterOption[]
  unitTypeOptions: FilterOption[]
  locationOptions: FilterOption[]
  exclusiveCount: number
  resultCount: number
  onDone?: (event: React.MouseEvent<HTMLElement>) => void
}) {
  return (
    <div className="flex w-full flex-col gap-6 md:gap-7">
      <div className="flex w-full items-baseline justify-between border-b border-(--color-divider) pb-3">
        <div className="font-sans text-[10px] tracking-[0.2em] text-neutral-500 uppercase md:text-[11px]">
          Refine Search
        </div>
        <button
          type="button"
          onClick={onReset}
          className="font-serif text-[13px] text-neutral-500 italic transition-colors hover:text-(--color-text)"
        >
          Reset all
        </button>
      </div>

      <div
        className={`w-full ${compact ? "" : "border-b border-(--color-divider) pb-7"}`}
      >
        <Segmented
          name={compact ? "purpose-sheet" : "purpose-rail"}
          options={["Any", "Lease", "Rent", "Buy"]}
          value={
            filters.purpose === "lease"
              ? "Lease"
              : filters.purpose === "rent"
                ? "Rent"
                : filters.purpose === "sale"
                  ? "Buy"
                  : "Any"
          }
          onChange={(value) =>
            onChange({
              purpose:
                value === "Lease"
                  ? "lease"
                  : value === "Rent"
                    ? "rent"
                    : value === "Buy"
                      ? "sale"
                      : null,
            })
          }
          fill
          className="flex w-full *:flex-1"
        />
      </div>

      {categoryOptions.length > 0 ? (
        <div
          className={compact ? "" : "border-b border-(--color-divider) pb-7"}
        >
          <FilterHeading className="mb-4 block font-sans text-[10px] tracking-[0.2em] text-neutral-500 uppercase">
            Property type
          </FilterHeading>
          <div className="flex flex-col gap-3">
            {categoryOptions.map((category) => (
              <FilterCheck
                key={category.value}
                label={category.label}
                count={category.count}
                checked={filters.category.includes(
                  category.value as PropertyType
                )}
                onChange={() =>
                  onChange({
                    category: toggle(
                      filters.category,
                      category.value as PropertyType
                    ),
                  })
                }
              />
            ))}
          </div>
        </div>
      ) : null}

      {unitTypeOptions.length > 0 ? (
        <div
          className={compact ? "" : "border-b border-(--color-divider) pb-7"}
        >
          <FilterHeading className="mb-4 block font-sans text-[10px] tracking-[0.2em] text-neutral-500 uppercase">
            Unit type
          </FilterHeading>
          <div className="flex flex-col gap-3">
            {(compact ? unitTypeOptions.slice(0, 3) : unitTypeOptions).map(
              (type) => (
                <FilterCheck
                  key={type.value}
                  label={type.label}
                  count={type.count}
                  checked={filters.unitTypes.includes(type.value)}
                  onChange={() =>
                    onChange({
                      unitTypes: toggle(filters.unitTypes, type.value),
                    })
                  }
                />
              )
            )}
          </div>
        </div>
      ) : null}

      {compact || locationOptions.length === 0 ? null : (
        <div className="border-b border-(--color-divider) pb-7">
          <FilterHeading className="mb-4 block font-sans text-[10px] tracking-[0.2em] text-neutral-500 uppercase">
            Location
          </FilterHeading>
          <div className="flex flex-col gap-3">
            {locationOptions.map((location) => (
              <FilterCheck
                key={location.value}
                label={location.label}
                count={location.count}
                checked={filters.locations.includes(location.value)}
                onChange={() =>
                  onChange({
                    locations: toggle(filters.locations, location.value),
                  })
                }
              />
            ))}
          </div>
        </div>
      )}

      <div className={compact ? "" : "border-b border-(--color-divider) pb-7"}>
        <FilterHeading className="mb-4 block font-sans text-[10px] tracking-[0.2em] text-neutral-500 uppercase">
          Floor area · sq ft
        </FilterHeading>
        <div className="flex gap-3">
          <Input
            placeholder="From"
            inputMode="numeric"
            value={filters.floorAreaMin}
            onChange={(e) => onChange({ floorAreaMin: e.target.value })}
            className="w-full rounded-none border border-(--color-divider) bg-transparent py-2 text-center font-serif text-[14px] italic focus:ring-0"
          />
          <Input
            placeholder="To"
            inputMode="numeric"
            value={filters.floorAreaMax}
            onChange={(e) => onChange({ floorAreaMax: e.target.value })}
            className="w-full rounded-none border border-(--color-divider) bg-transparent py-2 text-center font-serif text-[14px] italic focus:ring-0"
          />
        </div>
      </div>

      <div className={compact ? "" : "border-b border-(--color-divider) pb-7"}>
        <FilterHeading className="mb-4 block font-sans text-[10px] tracking-[0.2em] text-neutral-500 uppercase">
          Price
        </FilterHeading>
        <div className="flex gap-3">
          <Input
            placeholder="From"
            inputMode="numeric"
            value={filters.priceMin}
            onChange={(e) => onChange({ priceMin: e.target.value })}
            className="w-full rounded-none border border-(--color-divider) bg-transparent py-2 text-center font-serif text-[14px] italic focus:ring-0"
          />
          <Input
            placeholder="To"
            inputMode="numeric"
            value={filters.priceMax}
            onChange={(e) => onChange({ priceMax: e.target.value })}
            className="w-full rounded-none border border-(--color-divider) bg-transparent py-2 text-center font-serif text-[14px] italic focus:ring-0"
          />
        </div>
      </div>

      {exclusiveCount > 0 ? (
        <div className="pt-2">
          <FilterCheck
            label={compact ? "Exclusive only" : "Exclusive mandates only"}
            count={compact ? undefined : exclusiveCount}
            accent
            checked={filters.exclusiveOnly}
            onChange={(checked) => onChange({ exclusiveOnly: checked })}
          />
        </div>
      ) : null}

      <div className="pt-2">
        <Button
          variant="primary"
          block
          onClick={onDone}
          type="button"
          className="w-full rounded-none border border-(--color-text) py-4 font-sans text-[11px] tracking-[0.15em] uppercase shadow-none"
        >
          {compact
            ? `Show ${resultCount} result${resultCount === 1 ? "" : "s"}`
            : `${resultCount} result${resultCount === 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  )
}
