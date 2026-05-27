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
export type ResourceDetailLinkKey = "cefrLevels" | "srlEef" | "srlArticle"

export type ResourceDetailLink = {
  owner: ResourceMainKey
  label: string
  href: string
  rect: ResourceImageRect
}

export const RESOURCE_MAIN_HOTSPOTS: Record<ResourceMainKey, ResourceImageRect> = {
  cefr: { left: 26.2, top: 45.1, width: 22, height: 30.1 },
  srl: { left: 54.5, top: 46, width: 18.8, height: 29.7 },
}

/** 詳情大圖右上角關閉鈕（畫在圖裡的 X）— 若某一張對不齊可再拆成每圖一組 */
export const RESOURCE_DETAIL_EXIT: ResourceImageRect = {
  left: 87.7,
  top: 2.7,
  width: 10,
  height: 12,
}

export const RESOURCE_DETAIL_SRC: Record<ResourceMainKey, string> = {
  cefr: "/cefr.png",
  srl: "/srl.png",
}

export const RESOURCE_DETAIL_LINKS: Record<ResourceDetailLinkKey, ResourceDetailLink> = {
  cefrLevels: {
    owner: "cefr",
    label: "CEFR Level Descriptions",
    href: "https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions",
    rect: { left: 8, top: 78, width: 84, height: 12 },
  },
  srlEef: {
    owner: "srl",
    label: "Education Endowment Foundation",
    href: "https://educationendowmentfoundation.org.uk/",
    rect: { left: 8, top: 70, width: 38, height: 12 },
  },
  srlArticle: {
    owner: "srl",
    label: "Self-Regulated Learning Article",
    href: "https://www.tandfonline.com/doi/abs/10.1207/s15430421tip4102_2",
    rect: { left: 54, top: 70, width: 38, height: 12 },
  },
}
