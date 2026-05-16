/**
 * 熱區為相對於「圖片在頁面上實際渲染尺寸」的百分比（左上為原點）。
 * 可用首頁 Resource 打開後加上 ?calibrateResources=1 微調，再把數值貼回此檔。
 *
 * 主畫面為左右兩區（CEFR / SRL）；若換新的 resources.png 請重新校準。
 */
export type ResourceImageRect = {
  left: number
  top: number
  width: number
  height: number
}

export type ResourceMainKey = "cefr" | "srl"

export const RESOURCE_MAIN_HOTSPOTS: Record<ResourceMainKey, ResourceImageRect> = {
  cefr: { left: 6, top: 48, width: 42, height: 44 },
  srl: { left: 52, top: 48, width: 42, height: 44 },
}

/** 詳情大圖右上角關閉鈕（畫在圖裡的 X）— 若某一張對不齊可再拆成每圖一組 */
export const RESOURCE_DETAIL_EXIT: ResourceImageRect = {
  left: 86,
  top: 2,
  width: 10,
  height: 12,
}

export const RESOURCE_DETAIL_SRC: Record<ResourceMainKey, string> = {
  cefr: "/cefr.png",
  srl: "/srl.png",
}
