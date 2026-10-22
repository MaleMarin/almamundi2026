import { readFile } from 'node:fs/promises';
import OpenAI from 'openai';
import sharp from 'sharp';
import { z } from 'zod';
import { MODELO_VISION, costoLenguajeUsd } from '@/lib/cintas-v2/modelos';
import { EMOCIONES } from '@/lib/cintas-v2/palette';
import { erroresDe } from '@/lib/cintas-v2/understand/schema';

const RASGOS =
  /\b(rostro|cara|ojos|cabello|pelo|piel|nariz|labios|barba|bigote|cejas|arrugas|complexión|complexion|edad aparente)\b/i;

const VisionSchema = z.object({
  escena: z.string().trim().min(8).max(500),
  atmosfera: z.string().trim().min(4).max(300),
  emociones: z
    .array(
      z.object({
        emocion: z.enum(EMOCIONES),
        peso: z.coerce.number().min(0).max(1),
      })
    )
    .min(1)
    .max(4),
});

export type DescripcionVisual = z.infer<typeof VisionSchema> & {
  tokensEntrada: number;
  tokensSalida: number;
  costoUsd: number;
};

const SISTEMA = `Describes una imagen para AlmaMundi. Devuelves solo JSON:
{ "escena": "", "atmosfera": "", "emociones": [{ "emocion": "calma", "peso": 0 }] }
Emociones permitidas: nostalgia, alegría, tristeza, esperanza, amor, miedo, rabia, calma, orgullo, gratitud, pérdida, asombro.
Habla de lugar, luz, clima, objetos y atmósfera.
Nunca identifiques personas. Nunca describas rasgos físicos, edad, rostro, cuerpo, ropa distintiva ni nombres.
Si hay gente, di solo «hay personas» y sigue con el lugar.`;

function limpiar(mensaje: string): string {
  return mensaje.replace(/sk-[A-Za-z0-9_-]{8,}/g, 'sk-***');
}

async function jpegChico(archivo: string): Promise<Buffer> {
  return sharp(archivo, { failOn: 'none' }).rotate().resize({ width: 768, height: 768, fit: 'inside' }).jpeg({ quality: 80 }).toBuffer();
}

export async function describirImagen(archivo: string, apiKey: string): Promise<DescripcionVisual> {
  const openai = new OpenAI({ apiKey });
  const jpeg = await jpegChico(archivo);
  const dataUrl = `data:image/jpeg;base64,${jpeg.toString('base64')}`;
  let entrada = 0;
  let salida = 0;

  const pedir = async (extra: string) => {
    const completion = await openai.chat.completions.create({
      model: MODELO_VISION,
      temperature: 0,
      response_format: { type: 'json_object' },
      max_tokens: 400,
      messages: [
        { role: 'system', content: SISTEMA },
        {
          role: 'user',
          content: [
            { type: 'text', text: extra },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    });
    entrada += completion.usage?.prompt_tokens ?? 0;
    salida += completion.usage?.completion_tokens ?? 0;
    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    const parsed = VisionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new Error(erroresDe(parsed.error));
    return parsed.data;
  };

  try {
    let data = await pedir('Describe la escena, la atmósfera y las emociones que sugiere. Sin personas identificables.');
    if (RASGOS.test(`${data.escena} ${data.atmosfera}`)) {
      data = await pedir(
        'Otra vez, y sin rasgos físicos. Si aparecen personas, escribe solo «hay personas». No nombres cuerpos ni caras.'
      );
    }
    if (RASGOS.test(`${data.escena} ${data.atmosfera}`)) {
      data = {
        ...data,
        escena: 'Hay un lugar con luz y objetos. Hay personas, sin detalle físico.',
        atmosfera: data.atmosfera.replace(RASGOS, 'presencia'),
      };
    }
    return { ...data, tokensEntrada: entrada, tokensSalida: salida, costoUsd: costoLenguajeUsd(entrada, salida) };
  } catch (error) {
    throw new Error(limpiar(error instanceof Error ? error.message : 'visión falló'));
  }
}

export async function leerImagen(archivo: string): Promise<Buffer> {
  return readFile(archivo);
}
