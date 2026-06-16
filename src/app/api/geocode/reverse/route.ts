import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) return NextResponse.json({ error: "lat et lon requis" }, { status: 400 });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=fr`,
    {
      headers: {
        "User-Agent": "JamBeautyApp/1.0 (contact@jamfeeling.com)",
        "Accept": "application/json",
      },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) return NextResponse.json({ error: "Geocodage échoué" }, { status: 502 });

  const data = await res.json();
  return NextResponse.json({
    address: data.display_name ?? "",
    city:
      data.address?.city ??
      data.address?.town ??
      data.address?.village ??
      data.address?.county ??
      "",
    country: data.address?.country ?? "",
  });
}
