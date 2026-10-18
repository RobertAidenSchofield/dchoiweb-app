import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const isAuthed = await isAuthenticatedAdmin();
    if (!isAuthed) {
      return NextResponse.json(
        { error: 'Unauthorized: Administrative authentication required to upload files.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll('file') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadedImages: { name: string; url: string; size: number; type: string }[] = [];
    const supabase = getSupabaseServerClient();

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      // 1. Try uploading to Supabase Storage bucket 'product-images' if configured
      if (supabase) {
        try {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(safeFilename, buffer, {
              contentType: file.type,
              upsert: true,
            });

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from('product-images')
              .getPublicUrl(safeFilename);

            uploadedImages.push({
              name: file.name,
              url: publicUrlData.publicUrl,
              size: file.size,
              type: file.type,
            });
            continue;
          }
        } catch (storageErr) {
          console.warn('Supabase Storage upload fallback:', storageErr);
        }
      }

      // 2. Graceful fallback to Data URL for local/offline dev mode
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      uploadedImages.push({
        name: file.name,
        url: dataUrl,
        size: file.size,
        type: file.type,
      });
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json(
        { error: 'Only image files (JPEG, PNG, WebP, GIF, AVIF) are permitted' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
      count: uploadedImages.length,
      storageBackend: supabase ? 'supabase-storage' : 'local-data-url',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process upload';
    console.error('Upload error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
