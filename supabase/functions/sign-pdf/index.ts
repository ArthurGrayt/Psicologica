import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Buffer } from "node:buffer";

// 1. IMPORTAÇÕES "CIRÚRGICAS" COM ?external
// Isso impede que a biblioteca traga um Buffer duplicado. 
// Ela é forçada a usar o "node:buffer" nativo do Deno.
import P12Signer from "https://esm.sh/node-signpdf@2.0.0?external=node:buffer";
import { plainAddPlaceholder } from "https://esm.sh/node-signpdf@2.0.0/dist/helpers/index.js?external=node:buffer";

// Extração segura da função sign
const sign = P12Signer.sign || P12Signer.default?.sign;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const body = await req.json();
        const { pdf_base64, pfx_base64, pfx_password } = body;

        // --- CHECAGEM DE SANIDADE ---
        // Se a função sign não carregou, paramos aqui.
        if (typeof sign !== 'function') {
            throw new Error("Erro de importação: A função 'sign' não está disponível.");
        }

        if (!pdf_base64 || !pfx_base64 || !pfx_password) {
            throw new Error("Dados incompletos (PDF, PFX ou Senha).");
        }

        // 1. Converter Base64 para Buffer (Via Uint8Array para compatibilidade total)
        const pdfUint8 = Uint8Array.from(atob(pdf_base64), c => c.charCodeAt(0));
        const pdfBuffer = Buffer.from(pdfUint8);

        const pfxUint8 = Uint8Array.from(atob(pfx_base64), c => c.charCodeAt(0));
        const pfxBuffer = Buffer.from(pfxUint8);

        console.log(`Tamanhos - PDF: ${pdfBuffer.length}, PFX: ${pfxBuffer.length}`);

        // 2. Adicionar Placeholder
        // Como usamos ?external=node:buffer, o instanceof Buffer lá dentro vai passar!
        const pdfWithPlaceholder = plainAddPlaceholder({
            pdfBuffer: pdfBuffer,
            reason: 'Assinado Digitalmente',
            signatureLength: 8192,
        });

        console.log("Placeholder adicionado. Assinando...");

        // 3. Assinar
        const signedPdf = sign(pdfWithPlaceholder, pfxBuffer, {
            passphrase: pfx_password,
        });

        console.log("Assinado com sucesso.");

        const signedPdfBase64 = Buffer.from(signedPdf).toString('base64');

        return new Response(
            JSON.stringify({
                message: "Assinado com sucesso",
                signed_pdf_base64: signedPdfBase64
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        );

    } catch (error) {
        console.error("ERRO COMPLETO:", error);
        return new Response(
            JSON.stringify({
                error: "Erro na Edge Function",
                details: error.message || error.toString()
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        );
    }
});