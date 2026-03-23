import { readdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;

function filenameToSpecies(filename: string): string {
  return filename.replace(IMAGE_EXT, "");
}

/**
 * 扫描 public/dramacharacter/，新增图片无需改代码即可出现在 Toy box。
 */
export async function GET() {
  const dir = path.join(process.cwd(), "public", "dramacharacter");
  try {
    const names = await readdir(dir);
    const files = names
      .filter((n) => IMAGE_EXT.test(n) && !n.startsWith("."))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    const presets = files.map((filename) => ({
      species: filenameToSpecies(filename),
      imageUrl: `/dramacharacter/${encodeURIComponent(filename)}`,
    }));

    return NextResponse.json({ presets });
  } catch (e) {
    const message = e instanceof Error ? e.message : "read failed";
    return NextResponse.json({ presets: [], error: message });
  }
}
