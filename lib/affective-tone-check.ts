import OpenAI from 'openai';

export type ToneCheckResult =
  | { allowed: true }
  | { allowed: false; suggestion: string };

/** Mensaje estándar cuando el tono no es constructivo (coincide con la política del producto). */
export const AFFECTIVE_REFORMULATE_HINT =
  'Este espacio busca conectar con afecto. ¿Podrías reformular tu mensaje?';

/**
 * Evalúa si el mensaje es apto para "mensajería afectiva" (respeto, empatía).
 * Sin OPENAI_API_KEY no bloquea (solo validación de longitud en la ruta).
 */
export async function checkAffectiveTone(message: string): Promise<ToneCheckResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { allowed: true };
  }

  const trimmed = message.trim();
  if (!trimmed) return { allowed: false, suggestion: 'Escribe unas palabras antes de enviar.' };

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Actúa como moderador de empatía para AlmaMundi. El usuario escribe un mensaje privado al autor o autora de una historia; debe ser constructivo y respetuoso.

Si el mensaje no es constructivo o respetuoso (insultos, odio, acoso, desprecio, sarcasmo cruel, tono hiriente, deshumanización), debes indicar que no es apto.

Responde SOLO un JSON válido:
- {"respectful":true} si el mensaje es adecuado (respetuoso, empático o neutro, aunque sea breve).
- {"respectful":false,"suggestion":"..."} si no es apto. Usa preferentemente esta frase exacta en "suggestion": "${AFFECTIVE_REFORMULATE_HINT}"
  Solo varía si hace falta un matiz mínimo; mantén el tono cálido y breve.`,
      },
      { role: 'user', content: trimmed.slice(0, 2000) },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 200,
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) return { allowed: true };
  try {
    const parsed = JSON.parse(raw) as { respectful?: boolean; suggestion?: string };
    if (parsed.respectful === true) return { allowed: true };
    const hint =
      typeof parsed.suggestion === 'string' && parsed.suggestion.trim()
        ? parsed.suggestion.trim()
        : AFFECTIVE_REFORMULATE_HINT;
    return { allowed: false, suggestion: hint };
  } catch {
    return { allowed: true };
  }
}
