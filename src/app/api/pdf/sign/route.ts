import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { embedSignatureToPdf } from '@/lib/pdf-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, signatureBase64, fallbackPdfBase64 } = body;

    if (!requestId || !signatureBase64) {
      return NextResponse.json(
        { error: 'Parameter requestId dan signatureBase64 wajib disertakan.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Fetch borrowing request from database
    const { data: request, error: fetchError } = await supabase
      .from('borrowing_requests')
      .select('*, items(*)')
      .eq('id', requestId)
      .single();

    let pdfBytes: ArrayBuffer | Uint8Array;

    if (fetchError || !request) {
      // If not found in DB (e.g. demo mode or mock ID), check fallbackPdfBase64
      if (fallbackPdfBase64) {
        const cleanBase64 = fallbackPdfBase64.replace(/^data:application\/pdf;base64,/, '');
        pdfBytes = Buffer.from(cleanBase64, 'base64');
      } else {
        return NextResponse.json(
          { error: `Data pengajuan dengan ID ${requestId} tidak ditemukan.` },
          { status: 404 }
        );
      }
    } else {
      // 2. Download original PDF from Supabase Storage
      try {
        const pdfResponse = await fetch(request.original_pdf_url);
        if (!pdfResponse.ok) {
          throw new Error(`Gagal mengunduh PDF dari URL: ${pdfResponse.statusText}`);
        }
        pdfBytes = await pdfResponse.arrayBuffer();
      } catch (dlErr: any) {
        if (fallbackPdfBase64) {
          const cleanBase64 = fallbackPdfBase64.replace(/^data:application\/pdf;base64,/, '');
          pdfBytes = Buffer.from(cleanBase64, 'base64');
        } else {
          return NextResponse.json(
            { error: `Gagal mengunduh berkas PDF asli: ${dlErr.message}` },
            { status: 502 }
          );
        }
      }
    }

    const signaturePosX = request?.signature_pos_x ?? 400;
    const signaturePosY = request?.signature_pos_y ?? 80;
    const signaturePage = request?.signature_page ?? 1;

    // 3. Embed digital signature PNG into PDF via pdf-lib
    const signedPdfBytes = await embedSignatureToPdf({
      pdfBytes,
      signatureBase64,
      signaturePosX,
      signaturePosY,
      signaturePage,
      signatureWidth: 120,
      signatureHeight: 60,
    });

    const fileName = `signed_${requestId}.pdf`;
    let signedPdfUrl = '';

    // 4. Upload signed PDF to Supabase Storage bucket 'surpin_docs'
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('surpin_docs')
        .upload(fileName, signedPdfBytes, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('surpin_docs')
          .getPublicUrl(fileName);
        signedPdfUrl = publicUrlData.publicUrl;
      }
    } catch (uploadErr) {
      console.warn('Storage upload warning:', uploadErr);
    }

    const signedPdfBase64 = Buffer.from(signedPdfBytes).toString('base64');
    if (!signedPdfUrl) {
      signedPdfUrl = `data:application/pdf;base64,${signedPdfBase64}`;
    }

    // 5. Update borrowing request status to 'approved'
    if (request) {
      await supabase
        .from('borrowing_requests')
        .update({
          signed_pdf_url: signedPdfUrl,
          status: 'approved',
        })
        .eq('id', requestId);

      // Also update item status to 'borrowed'
      if (request.item_id) {
        await supabase
          .from('items')
          .update({ status: 'borrowed' })
          .eq('id', request.item_id);
      }
    }

    return NextResponse.json({
      success: true,
      url: signedPdfUrl,
      signedPdfBase64: `data:application/pdf;base64,${signedPdfBase64}`,
    });
  } catch (err: any) {
    console.error('Error in /api/pdf/sign:', err);
    return NextResponse.json(
      { error: err?.message || 'Terjadi kesalahan internal server saat penandatanganan PDF.' },
      { status: 500 }
    );
  }
}
