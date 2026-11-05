/**
 * 世田谷区の調査項目。
 * 整理の軸：「せたがやiMap」および「よくあるお問い合わせ（不動産調査の方へ）」
 * 注意：2026年12月以降の二子玉川分庁舎からの大規模移転に関する注記を含みます。
 * （Gemini作成の下書き。公式ページとの照合後に収録すること）
 */
import type { SurveyItem, WardSurvey } from "../survey.ts";

export type StopId =
  | "prep"
  | "gis"
  | "homu"
  | "futako-toshi"
  | "futako-kenchiku"
  | "futako-doro"
  | "futako-shigaichi"
  | "futako-design"
  | "sogo-shisho"
  | "tozei"
  | "metro"
  | "life";

export const SETAGAYA_SOURCE_GUIDE =
  "https://www.city.setagaya.lg.jp/02008/3673.html";

export const SETAGAYA_GIS = "https://www.city.setagaya.lg.jp/01000/8486.html";

export const STOPS: { id: StopId; label: string; where: string }[] = [
  { id: "prep", label: "出る前", where: "社内・オンライン" },
  { id: "gis", label: "せたがやiMap", where: "来庁前に確認・印刷" },
  { id: "homu", label: "法務局", where: "世田谷合同庁舎2階（若林）" },
  { id: "futako-toshi", label: "都市計画", where: "二子玉川分庁舎2階 A21" },
  { id: "futako-kenchiku", label: "建築調整", where: "二子玉川分庁舎2階 B26番" },
  { id: "futako-doro", label: "道路管理", where: "二子玉川分庁舎2階 A24番" },
  { id: "futako-shigaichi", label: "市街地整備", where: "二子玉川分庁舎2階 A22番" },
  { id: "futako-design", label: "都市デザイン", where: "二子玉川分庁舎2階 A28" },
  { id: "sogo-shisho", label: "総合支所", where: "各総合支所 街づくり課" },
  { id: "tozei", label: "都税", where: "世田谷合同庁舎（若林）" },
  { id: "metro", label: "都・国", where: "第二建設事務所など" },
  { id: "life", label: "供給事業者", where: "水道・下水・ガス" },
];

export const CATEGORIES = [
  "物件の特定",
  "都市計画",
  "道路・接道",
  "建築制限・台帳",
  "地区計画・景観",
  "開発・盛土",
  "災害",
  "文化財・土壌",
  "インフラ・生活",
  "税・価格の参考",
] as const;

export const ITEMS: (SurveyItem & { stop: StopId })[] = [
  {
    id: "registry",
    category: "物件の特定",
    title: "登記事項・公図・地積測量図",
    priority: "must",
    channel: "offsite",
    stop: "homu",
    why: "売買の権利関係確認。都税事務所と同じ世田谷合同庁舎内にあります。",
    points: ["全部事項", "公図", "地積測量図"],
    how: "東京法務局世田谷出張所（世田谷合同庁舎2階）にて取得。",
    place: "世田谷区若林4-22-13（世田谷合同庁舎2階）",
    tel: "03-5481-7519",
    href: "https://houmukyoku.moj.go.jp/tokyo/table/shikyokutou/all/setagaya.html",
    hrefLabel: "東京法務局 世田谷出張所",
  },
  {
    id: "youto",
    category: "都市計画",
    title: "都市計画情報全般",
    priority: "must",
    channel: "both",
    stop: "gis",
    why: "用途地域等の確認。",
    points: ["用途地域", "建蔽率", "容積率"],
    how: "基本は「せたがやiMap」で検索可能。窓口が必要な場合は都市計画課へ。",
    place: "都市計画課 二子玉川分庁舎A棟2階 A21",
    tel: "03-6432-7148",
    href: SETAGAYA_GIS,
    hrefLabel: "せたがやiMap",
  },
  {
    id: "road-width",
    category: "道路・接道",
    title: "道路幅員・境界確定図",
    priority: "must",
    channel: "counter",
    stop: "futako-doro",
    why: "区道の現況幅員と認定情報、境界確定の有無。",
    points: ["道路現況平面図", "境界確定図閲覧・証明"],
    how: "せたがやiMapの「道路現況平面図」でも概略確認可能。幅員の詳細な確認は窓口。境界確定図の閲覧・証明はA25窓口（03-6432-7923～7927）。",
    place: "道路管理課 二子玉川分庁舎2階 A24窓口",
    tel: "03-6432-7919～7922",
    href: "https://www.city.setagaya.lg.jp/02009/4643.html",
    hrefLabel: "公道・私道の種別及び幅員に関する窓口",
  },
  {
    id: "gaiyo",
    category: "建築制限・台帳",
    title: "建築計画概要書・台帳証明の発行",
    priority: "must",
    channel: "counter",
    stop: "futako-kenchiku",
    why: "審査履歴と適法性の確認。",
    points: ["建築計画概要書", "台帳記載事項証明"],
    how: "都市整備政策部 建築調整課など。区内各総合支所（世田谷、北沢、玉川、砧、烏山）の街づくり課でも閲覧・発行が可能。",
    place: "建築調整課 二子玉川分庁舎2階 B26番",
    tel: "03-6432-7160",
    href: "https://www.city.setagaya.lg.jp/02034/3782.html",
    hrefLabel: "建築計画概要書等の閲覧・台帳証明の発行",
  },
  {
    id: "kaihatsu",
    category: "開発・盛土",
    title: "開発行為・宅地造成等の履歴",
    priority: "must",
    channel: "both",
    stop: "futako-shigaichi",
    why: "開発許可や宅地造成許可の有無。",
    points: ["開発許可", "宅地造成許可"],
    how: "せたがやiMap（開発行為等を許可した区域）で確認可能。詳細は市街地整備課へ。",
    place: "市街地整備課 二子玉川分庁舎A棟2階 A22番",
    tel: "03-6432-7156",
    href: "https://www.city.setagaya.lg.jp/02039/3691.html",
    hrefLabel: "開発行為・宅地造成等の工事の規制",
  },
  {
    id: "district-plan",
    category: "地区計画・景観",
    title: "地区計画",
    priority: "must",
    channel: "both",
    stop: "sogo-shisho",
    why: "世田谷区内には多数の地区計画が存在し、建蔽率・容積率・壁面後退などの制限が上書きされるため。",
    points: ["地区計画区域", "地区整備計画の内容"],
    how: "せたがやiMapで該当を確認し、詳細な届出要件などは建築地を管轄する総合支所の街づくり課で確認。",
    place: "建築地を管轄する総合支所 街づくり課",
    tel: "地区により異なる（各総合支所へ）",
    href: "https://www.city.setagaya.lg.jp/02008/4174.html",
    hrefLabel: "地区計画",
  },
  {
    id: "keikan",
    category: "地区計画・景観",
    title: "風景づくり（景観計画）",
    priority: "usual",
    channel: "both",
    stop: "futako-design",
    why: "世田谷区風景づくり条例に基づく届出や制限の確認。",
    points: ["風景づくり条例対象区域", "届出対象行為"],
    how: "せたがやiMapまたは公式HPで該当エリアや基準を確認。窓口相談は予約制。",
    place: "都市整備政策部 都市デザイン課 二子玉川分庁舎A棟2階 A28",
    tel: "03-6432-7153",
    href: "https://www.city.setagaya.lg.jp/02092/4211.html",
    hrefLabel: "世田谷区風景づくり条例（景観法）",
  },
  {
    id: "flood",
    category: "災害",
    title: "洪水・内水・土砂災害ハザードマップ",
    priority: "must",
    channel: "online",
    stop: "prep",
    why: "多摩川流域などの浸水想定、及び国分寺崖線等の土砂災害警戒区域の確認。",
    points: ["多摩川・内水等の浸水想定区域", "土砂災害警戒区域"],
    how: "世田谷区公式HP「世田谷区ハザードマップ」または「せたがやiMap」で閲覧。",
    place: "危機管理部 災害対策課",
    tel: "03-5432-2262",
    href: "https://www.city.setagaya.lg.jp/02049/606.html",
    hrefLabel: "世田谷区ハザードマップ",
  },
  {
    id: "bunkazai",
    category: "文化財・土壌",
    title: "埋蔵文化財包蔵地",
    priority: "must",
    channel: "online",
    stop: "prep",
    why: "区内に遺跡が広く分布しており、該当区域での建築等は事前届出が必要となるため。",
    points: ["周知の埋蔵文化財包蔵地"],
    how: "せたがやiMapまたは東京都遺跡地図で確認。",
    place: "教育政策・生涯学習部 生涯学習課 文化財係（弦巻3-16-8 教育会館3階）",
    tel: "03-3429-4264",
    href: "https://www.city.setagaya.lg.jp/02059/3484.html",
    hrefLabel: "埋蔵文化財（遺跡）",
  },
  {
    id: "dojo",
    category: "文化財・土壌",
    title: "土壌汚染に関する区域指定",
    priority: "must",
    channel: "online",
    stop: "prep",
    why: "要措置区域・形質変更時要届出区域の指定状況確認。",
    points: ["土壌汚染対策法に基づく指定区域"],
    how: "東京都環境局HPまたは世田谷区公式HPの指定台帳情報で確認。",
    place: "環境保全課 二子玉川分庁舎2階 B36",
    tel: "03-6432-7137",
    href: "https://www.city.setagaya.lg.jp/01101/4816.html",
    hrefLabel: "土壌汚染対策法等に関すること",
  },
  {
    id: "suido",
    category: "インフラ・生活",
    title: "上下水道の引込み・埋設状況",
    priority: "usual",
    channel: "offsite",
    stop: "life",
    why: "前面道路の管埋設と宅地内への引込み状況の確認。",
    points: ["上水道配水管", "下水道公共桝"],
    how: "東京都水道局および下水道局の世田谷管轄営業所で確認。区役所窓口ではない。",
    place: "東京都水道局・下水道局",
    href: "https://www.waterworks.metro.tokyo.lg.jp/",
    hrefLabel: "東京都水道局（公式）",
  },
  {
    id: "gas",
    category: "インフラ・生活",
    title: "都市ガスの本支管",
    priority: "usual",
    channel: "offsite",
    stop: "life",
    why: "ガスの供給網・引込み有無の確認。",
    points: ["本支管の有無"],
    how: "東京ガス等の供給事業者へ直接照会する。",
    place: "供給事業者",
    href: "https://www.tokyo-gas.co.jp/",
    hrefLabel: "東京ガス",
  },
  {
    id: "kotei",
    category: "税・価格の参考",
    title: "固定資産評価証明・公課証明",
    priority: "must",
    channel: "offsite",
    stop: "tozei",
    why: "税額清算等。",
    points: ["評価証明", "公課証明"],
    how: "世田谷都税事務所の窓口で取得。法務局（世田谷出張所）と同じ建物のため同時に回る。",
    place: "世田谷都税事務所（世田谷区若林4-22-13 合同庁舎）",
    tel: "03-3413-7111",
    href: "https://www.tax.metro.tokyo.lg.jp/jimusho/t_setagaya",
    hrefLabel: "世田谷都税事務所",
  },
];

export const SETAGAYA: WardSurvey = {
  wardId: "setagaya",
  tagline: "SETAGAYA · REAL ESTATE",
  intro: "2026年11月現在、建築・都市計画窓口は「二子玉川分庁舎」にありますが、同年12月〜翌1月にかけて「区役所本庁舎（東棟）」等へ大規模な移転が行われます。来庁前に必ず最新の場所を確認してください。",
  sourceGuide: SETAGAYA_SOURCE_GUIDE,
  sourceGuideLinkLabel: "都市整備領域窓口案内（不動産調査の方へ）",
  stops: STOPS,
  categories: CATEGORIES,
  items: ITEMS,
  route: {
    title: "二子玉川エリアと世田谷（若林）エリアの2拠点調査",
    body: "不動産の役所調査窓口（都市計画・建築・道路）は、現在「二子玉川分庁舎（玉川1-20-1）」に集約されています。一方で、法務局（世田谷出張所）と都税事務所（世田谷都税事務所）は、東急世田谷線沿線の若林エリアにある「世田谷合同庁舎（若林4-22-13）」に同居しています。二子玉川で役所調査を終えた後、電車またはバスを利用して若林の合同庁舎へ向かい、登記・税関係を取得するルートが最も効率的です。",
    tips: [
      "「せたがやiMap」の機能が非常に充実しており、都市計画情報から道路現況平面図、開発許可履歴までオンラインで概略調査が可能です。来庁前の事前チェックを徹底してください。",
      "道路幅員等に関する電話での照会対応は行われていません。必ず窓口へ出向く必要があります。",
      "本庁舎等整備に伴い、令和8年(2026年)12月から令和9年1月にかけて、二子玉川分庁舎の全機能が本庁舎（世田谷4丁目）等へ移転します。訪問日によって窓口の場所が変わるリスクに十分注意してください。",
    ],
  },
  footerNotes: [
    "整理の軸は世田谷区「よくあるお問い合わせ（建築予定・不動産調査の方へ）」等（2026年11月5日時点）です。",
    "移転前（二子玉川分庁舎）の情報をベースに記載しています。移転後（2027年以降）は窓口フロアが大きく変わります。",
    "移転スケジュール（区の案内で確認）：都市デザイン課は2026年12月28日から、都市計画課・建築調整課・道路管理課・市街地整備課は2027年1月4日から本庁舎東棟4階、環境保全課は2027年1月4日から東棟5階。移転後の都市計画課の電話は03-5432-3533・3534（業務開始日から有効）。",
  ],
  exportNotes: [
    "※2026年12月以降順次、調査窓口（二子玉川分庁舎）は世田谷区役所本庁舎等へ移転します。",
  ],
};
