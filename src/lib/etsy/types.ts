// Etsy Open API v3 shapes.
//
// `Raw*` mirrors what the API sends back — every field optional, because the
// fixtures are our only evidence until a real key lands and we cannot afford a
// crash on a missing field. `Etsy*` is the normalized shape the rest of the app
// works with; `normalize.ts` is the only bridge between them.

export interface RawEtsyMoney {
  amount?: number
  divisor?: number
  currency_code?: string
}

export interface RawEtsyShop {
  shop_id?: number
  shop_name?: string
  user_id?: number
  create_date?: number
  created_timestamp?: number
  title?: string | null
  announcement?: string | null
  currency_code?: string
  is_vacation?: boolean
  listing_active_count?: number
  digital_listing_count?: number
  login_name?: string
  url?: string
  image_url_760x100?: string | null
  icon_url_fullxfull?: string | null
  num_favorers?: number
  transaction_sold_count?: number
  shipping_from_country_iso?: string | null
  shop_location_country_iso?: string | null
  review_count?: number | null
  review_average?: number | null
}

export interface RawEtsyListingImage {
  listing_image_id?: number
  url_75x75?: string
  url_570xN?: string
  url_fullxfull?: string
}

export interface RawEtsyListing {
  listing_id?: number
  shop_id?: number
  user_id?: number
  title?: string
  description?: string | null
  state?: string
  creation_timestamp?: number
  original_creation_timestamp?: number
  last_modified_timestamp?: number
  updated_timestamp?: number
  quantity?: number
  url?: string
  num_favorers?: number
  views?: number | null
  tags?: string[]
  materials?: string[]
  price?: RawEtsyMoney
  taxonomy_id?: number | null
  shop_section_id?: number | null
  who_made?: string | null
  when_made?: string | null
  listing_type?: string
  is_digital?: boolean
  has_variations?: boolean
  images?: RawEtsyListingImage[]
}

export interface RawPaginated<T> {
  count?: number
  results?: T[]
}

// ---------------------------------------------------------------------------
// Normalized
// ---------------------------------------------------------------------------

export interface EtsyShop {
  shopId: number
  shopName: string
  title: string | null
  announcement: string | null
  url: string
  iconUrl: string | null
  bannerUrl: string | null
  currencyCode: string
  shopLocationCountry: string | null
  shippingFromCountry: string | null
  createdAt: string | null
  isVacation: boolean
  activeListingCount: number
  digitalListingCount: number
  transactionSoldCount: number
  numFavorers: number
  reviewCount: number
  reviewAverage: number | null
}

export interface EtsyListing {
  listingId: number
  title: string
  descriptionExcerpt: string
  url: string
  imageUrl: string | null
  tags: string[]
  materials: string[]
  taxonomyId: number | null
  shopSectionId: number | null
  whoMade: string | null
  whenMade: string | null
  hasVariations: boolean
  isDigital: boolean
  createdAt: string
  lastModifiedAt: string
  quantity: number
  views: number
  numFavorers: number
  /** As reported by Etsy — divide by `priceDivisor`, never by a hardcoded 100. */
  priceMinor: number
  priceDivisor: number
  currencyCode: string
}
