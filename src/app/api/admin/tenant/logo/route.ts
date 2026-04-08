/**
 * POST /api/admin/tenant/logo
 *
 * Phase 10 — multipart logo upload. PNG only (decision D1). Stores the file
 * in the public `brand-assets` bucket and returns the resulting public URL.
 *
 * The client then calls `PATCH /api/admin/tenant` with `{ logo_url }` to
 * persist the new URL on the singleton row. Splitting upload from PATCH keeps
 * file handling and config writes independent — the PATCH endpoint stays
 * JSON-only and never has to know about Storage.
 */

import { logger } from '@/lib/logger';
import { jsonError } from '@/lib/api-utils';
import { requireAdmin } from '@/features/admin/lib/admin-guard';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'brand-assets';
const ALLOWED_MIME = 'image/png';
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB cap

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) {
    logger.warn({ scope: 'api.admin.tenant.logo', event: 'forbidden' });
    return auth;
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  if (!(file instanceof File)) {
    logger.warn({
      scope: 'api.admin.tenant.logo',
      event: 'invalid',
      reason: 'missing_file',
    });
    return jsonError('Missing file field', 400);
  }
  if (file.type !== ALLOWED_MIME) {
    logger.warn({
      scope: 'api.admin.tenant.logo',
      event: 'invalid',
      reason: 'bad_mime',
      mime: file.type,
    });
    return jsonError('Solo se permite PNG', 400);
  }
  if (file.size > MAX_BYTES) {
    logger.warn({
      scope: 'api.admin.tenant.logo',
      event: 'invalid',
      reason: 'too_large',
      size: file.size,
    });
    return jsonError('El archivo supera los 2 MB', 400);
  }

  const objectPath = `logo-${Date.now()}.png`;
  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: ALLOWED_MIME,
    });

  if (uploadError) {
    logger.error({
      scope: 'api.admin.tenant.logo',
      event: 'failed',
      userId: auth.id,
      err: uploadError,
    });
    return jsonError('Failed to upload logo: ' + uploadError.message, 500);
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);

  logger.info({
    scope: 'api.admin.tenant.logo',
    event: 'created',
    userId: auth.id,
    size: file.size,
    mime: file.type,
    filename: objectPath,
  });
  return Response.json({ logo_url: pub.publicUrl });
}
