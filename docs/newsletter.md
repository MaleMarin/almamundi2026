# Newsletter de AlmaMundi

La franja y la casilla de `/contar` solo piden el correo. La persona queda en `pending` hasta que abre el enlace del correo. Al confirmar, entra en la Audience de Resend. Al darse de baja, sale de esa Audience.

## Crear la Audience

Si el servidor no tiene `RESEND_AUDIENCE_ID`, la confirmación se guarda en Firestore y el correo sale, pero el contacto no entra en Resend.

1. Entra en [Audiences](https://resend.com/audiences) (si el panel muestra Segments, crea un segmento: el id se usa igual).
2. Crea una audiencia, por ejemplo «AlmaMundi newsletter».
3. Copia el id.
4. En las variables del proyecto en Vercel, agrega `RESEND_AUDIENCE_ID` con ese id. Lo mismo en el entorno local, sin subirlo a git.
5. El siguiente despliegue desde GitHub ya la usa. No hace falta un deploy desde el computador.

## Enviar un número

1. En Resend, abre Broadcasts y crea un broadcast.
2. Remitente: `Sonder · AlmaMundi`, desde un correo del dominio verificado, por ejemplo `Sonder · AlmaMundi <hola@almamundi.org>`.
3. El asunto empieza con `Sonder ·`.
4. Elige la Audience (o el segmento) cuyo id está en `RESEND_AUDIENCE_ID`.
5. Escribe el número. En el cuerpo, el enlace de baja de cada persona es la propiedad `baja` del contacto:

```
<a href="{{{contact.baja}}}">Darme de baja</a>
```

Esa URL abre `https://www.almamundi.org/newsletter/baja?t=…`, marca `unsubscribed` y quita el contacto de la Audience.

6. Cabeceras del envío, para el enlace de un clic de Gmail y Yahoo (RFC 8058). La propiedad `baja_cabecera` es `POST /api/newsletter/baja?t=…`, que responde 200 y da de baja. Un GET de esa misma URL redirige a la página.

```
List-Unsubscribe: <{{{contact.baja_cabecera}}}>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

Si el editor del broadcast no deja poner cabeceras, créalo por la API con `headers` iguales y `audienceId` de `RESEND_AUDIENCE_ID`. No envíes el número a toda la cuenta: solo a esa Audience.

`{{{RESEND_UNSUBSCRIBE_URL}}}` es la baja propia de Resend. No actualiza Firestore. El número usa `{{{contact.baja}}}`.
