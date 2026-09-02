import { normalizeCustomAlias, normalizeExpiration, validateTargetUrl } from '../../links/link-rules';

export interface BatchShortenItemDto {
  url: string;
  customAlias?: string | null;
  expiresAt?: string | null;
}

export interface BatchShortenDto {
  links: BatchShortenItemDto[];
}

export interface ValidatedBatchShortenItem {
  url: string;
  customAlias: string | null;
  expiresAt: Date | null;
}

export function validateBatchShortenDto(
  input: BatchShortenDto,
  now = new Date(),
): ValidatedBatchShortenItem[] {
  if (!Array.isArray(input.links) || input.links.length < 1 || input.links.length > 10) {
    throw new Error('Batch must contain between 1 and 10 links');
  }

  return input.links.map((item) => {
    const url = validateTargetUrl(typeof item.url === 'string' ? item.url.trim() : '');
    const customAlias = item.customAlias == null ? null : normalizeCustomAlias(item.customAlias.trim());
    const expiresAt = normalizeExpiration(item.expiresAt ?? null, now);

    return { url, customAlias, expiresAt };
  });
}
