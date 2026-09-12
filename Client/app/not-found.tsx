import Link from "next/link"
import { ButtonLink } from "./_components/ui/button"
import { SiteSearch } from "./_components/site-search"

const QUICK_LINKS = [
  { label: "Listings", href: "/system/listings" },
  { label: "Agents", href: "/system/agents" },
  { label: "Insights", href: "/system/insights" },
  { label: "Contact", href: "/system/contact" },
]

export default function NotFound() {
  return (
    <div className="flex min-h-[64dvh] flex-col items-center justify-center px-3 py-16 text-center md:px-6 md:py-24">
      <div className="cl-k text-neutral-600)">404 · Page not found</div>
      <h1 className="mt-3 mb-0 max-w-[20ch] text-[32px] leading-[1.12] font-normal md:mt-4 md:text-[52px] md:leading-[1.08]">
        That address doesn&rsquo;t check out.
      </h1>
      <p className="text-neutral-700) mt-3 mb-0 max-w-[52ch] text-[14px] leading-[1.7] md:mt-4 md:text-[16px]">
        The link may be old, the listing may have moved on, or the address was
        mistyped. Search for what you were after, or pick somewhere below.
      </p>

      <div className="mt-6 w-full max-w-105 md:mt-7">
        <SiteSearch className="w-full" />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:mt-7">
        <ButtonLink href="/system/listings" variant="primary">
          Browse all listings
        </ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Back to the homepage
        </ButtonLink>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-(--color-divider) pt-5 md:mt-9">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="text-[13px]">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
