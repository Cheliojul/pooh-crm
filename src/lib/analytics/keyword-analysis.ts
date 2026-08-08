// Title keyword analysis, and the tag-gap panel that falls out of it.
//
// The gap list is the most actionable output in the whole feature: words a shop
// leans on in its titles but never puts in its tags are, by definition, search
// surface it is not competing for.

import type { KeywordAnalysis, KeywordStat, ListingMetrics } from "@/lib/shop-types"

const MIN_TOKEN_LENGTH = 3

const UNIGRAM_LIMIT = 20
const BIGRAM_LIMIT = 15
const TAG_GAP_LIMIT = 12

/** A gap has to show up in at least this share of titles to be worth acting on. */
const TAG_GAP_MIN_SHARE = 0.04
const TAG_GAP_MIN_COUNT = 3

const STOPWORDS = new Set([
  "a", "able", "about", "above", "across", "after", "again", "against", "all",
  "almost", "also", "although", "always", "am", "among", "an", "and", "another",
  "any", "are", "around", "as", "at", "available", "back", "be", "because",
  "been", "before", "being", "below", "best", "better", "between", "both",
  "but", "by", "can", "cannot", "come", "could", "did", "do", "does", "doing",
  "done", "down", "during", "each", "either", "else", "etc", "even", "ever",
  "every", "few", "first", "for", "free", "from", "get", "gets", "give", "go",
  "good", "got", "great", "had", "has", "have", "having", "he", "her", "here",
  "hers", "him", "his", "how", "however", "i", "if", "in", "inch", "inches",
  "into", "is", "it", "its", "just", "keep", "know", "large", "last", "least",
  "less", "let", "like", "little", "long", "look", "made", "make", "makes",
  "making", "many", "may", "me", "might", "mine", "more", "most", "much",
  "must", "my", "need", "never", "new", "next", "no", "none", "nor", "not",
  "now", "of", "off", "on", "once", "one", "only", "onto", "or", "other",
  "others", "our", "ours", "out", "over", "own", "per", "perfect", "please",
  "plus", "quality", "quite", "rather", "really", "same", "see", "set",
  "several", "shall", "she", "should", "since", "size", "small", "so", "some",
  "still", "such", "sure", "take", "than", "that", "the", "their", "theirs",
  "them", "then", "there", "these", "they", "this", "those", "though",
  "through", "to", "too", "top", "two", "under", "until", "up", "upon", "us",
  "use", "used", "using", "very", "want", "was", "way", "we", "well", "were",
  "what", "when", "where", "which", "while", "who", "whom", "why", "will",
  "with", "within", "without", "would", "yet", "you", "your", "yours",
])

interface KeywordAccumulator {
  count: number
  viewsPerDaySum: number
  viewsPerDayCount: number
}

function tokenize(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(
      (token) =>
        token.length >= MIN_TOKEN_LENGTH && !STOPWORDS.has(token) && !/^\d+$/.test(token)
    )
}

function bump(
  accumulators: Map<string, KeywordAccumulator>,
  key: string,
  viewsPerDay: number | null
): void {
  let accumulator = accumulators.get(key)
  if (!accumulator) {
    accumulator = { count: 0, viewsPerDaySum: 0, viewsPerDayCount: 0 }
    accumulators.set(key, accumulator)
  }
  accumulator.count += 1
  if (viewsPerDay !== null) {
    accumulator.viewsPerDaySum += viewsPerDay
    accumulator.viewsPerDayCount += 1
  }
}

function toStats(
  accumulators: Map<string, KeywordAccumulator>,
  totalListings: number,
  isInTags: (keyword: string) => boolean,
  limit: number
): KeywordStat[] {
  return [...accumulators.entries()]
    .map(([keyword, accumulator]) => ({
      keyword,
      count: accumulator.count,
      share: totalListings > 0 ? accumulator.count / totalListings : 0,
      averageViewsPerDay:
        accumulator.viewsPerDayCount > 0
          ? accumulator.viewsPerDaySum / accumulator.viewsPerDayCount
          : null,
      inTags: isInTags(keyword),
    }))
    .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword))
    .slice(0, limit)
}

export function buildKeywordAnalysis(
  listings: ListingMetrics[],
  partial: boolean
): KeywordAnalysis {
  const unigramAccumulators = new Map<string, KeywordAccumulator>()
  const bigramAccumulators = new Map<string, KeywordAccumulator>()

  // Tags are multi-word phrases, so "is this word tagged" needs both the whole
  // phrases and the individual words inside them.
  const tagPhrases = new Set<string>()
  const tagWords = new Set<string>()

  let titleWordTotal = 0
  let titleCharTotal = 0

  for (const listing of listings) {
    for (const rawTag of listing.tags) {
      const tag = rawTag.trim().toLowerCase()
      if (!tag) continue
      tagPhrases.add(tag)
      for (const word of tag.split(/[^a-z0-9]+/)) {
        if (word) tagWords.add(word)
      }
    }

    const tokens = tokenize(listing.title)
    titleWordTotal += tokens.length
    titleCharTotal += listing.title.length

    // Count each keyword once per listing, not once per occurrence — otherwise a
    // repeated word in one title outranks a word used across twenty listings.
    const seenUnigrams = new Set(tokens)
    for (const token of seenUnigrams) {
      bump(unigramAccumulators, token, listing.viewsPerDay)
    }

    const seenBigrams = new Set<string>()
    for (let index = 0; index + 1 < tokens.length; index += 1) {
      seenBigrams.add(`${tokens[index]} ${tokens[index + 1]}`)
    }
    for (const bigram of seenBigrams) {
      bump(bigramAccumulators, bigram, listing.viewsPerDay)
    }
  }

  const totalListings = listings.length
  const unigramInTags = (keyword: string) => tagWords.has(keyword)
  const bigramInTags = (keyword: string) =>
    tagPhrases.has(keyword) || [...tagPhrases].some((phrase) => phrase.includes(keyword))

  const unigrams = toStats(unigramAccumulators, totalListings, unigramInTags, UNIGRAM_LIMIT)
  const bigrams = toStats(bigramAccumulators, totalListings, bigramInTags, BIGRAM_LIMIT)

  const tagGaps = toStats(
    unigramAccumulators,
    totalListings,
    unigramInTags,
    Number.MAX_SAFE_INTEGER
  )
    .filter(
      (stat) =>
        !stat.inTags &&
        stat.count >= TAG_GAP_MIN_COUNT &&
        stat.share >= TAG_GAP_MIN_SHARE
    )
    .slice(0, TAG_GAP_LIMIT)

  return {
    partial,
    unigrams,
    bigrams,
    tagGaps,
    averageTitleWords: totalListings > 0 ? titleWordTotal / totalListings : null,
    averageTitleChars: totalListings > 0 ? titleCharTotal / totalListings : null,
  }
}
