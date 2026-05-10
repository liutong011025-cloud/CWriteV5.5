/**
 * 熱區為相對於「圖片在頁面上實際渲染尺寸」的百分比（左上為原點）。
 * 可用首頁 Resource 打開後加上 ?calibrateResources=1 微調，再把數值貼回此檔。
 */
export type ResourceImageRect = {
  left: number
  top: number
  width: number
  height: number
}

export type ResourceMainKey = "cefr" | "longman" | "srl"

export const RESOURCE_MAIN_HOTSPOTS: Record<ResourceMainKey, ResourceImageRect> = {
  cefr: { left: 10, top: 52, width: 24, height: 38 },
  longman: { left: 38, top: 52, width: 24, height: 38 },
  srl: { left: 66, top: 52, width: 24, height: 38 },
}

/** 三張詳情大圖右上角關閉鈕（畫在圖裡的 X）— 若某一張對不齊可再拆成每圖一組 */
export const RESOURCE_DETAIL_EXIT: ResourceImageRect = {
  left: 86,
  top: 2,
  width: 10,
  height: 12,
}

export const RESOURCE_DETAIL_SRC: Record<ResourceMainKey, string> = {
  cefr: "/cefr.png",
  longman: "/Longman.png",
  srl: "/srl.png",
}
