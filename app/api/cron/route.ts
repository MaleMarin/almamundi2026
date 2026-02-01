import type { NextRequest } from "next/server";


export function GET(request: NextRequest) {
const auth = request.headers.get("authorization");


if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
return new Response("Unauthorized", { status: 401 });
}


return Response.json({ ok: true });
}