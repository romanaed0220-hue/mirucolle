/*
 * つながりのサンプル写真（バックエンドがないので、ほかの人の投稿の代わり）。
 * 写真は Wikimedia Commons の自由ライセンス（CC0／パブリックドメイン／CC BY）。CC BY はクレジット表示が必要
 * （マイページ →「このアプリについて」に出す）。public/samples/photos/<slug>.jpg（長辺 1000px 前後に縮小）。
 *  kind：view＝ほかの人の見え方をそのまま見る／ask＝先に描く、それから見る／odai＝今月のお題（いつも 1 枚目）
 * 見え方（なぞった線）は sampleTraces.json。開発版の「サンプルを描く」で描いて書き出したものを入れる。
 */
export type PhotoKind = 'view' | 'ask' | 'odai';
export type Credit = { title: string; author: string; license: string; url: string };
export type SamplePhoto = { slug: string; kind: PhotoKind; aspect: number; what: string; odaiTitle?: string; credit: Credit };

export const SAMPLE_PHOTOS: SamplePhoto[] = [
  { slug: 'kobu', kind: 'odai', aspect: 1.3333, what: '木のこぶ', odaiTitle: '11月のお題：木のこぶ',
    credit: { title: "Froschmaulähnliche Holzüberwallung.jpg", author: "Rhetos", license: 'CC0', url: "https://commons.wikimedia.org/wiki/File:Froschmaul%C3%A4hnliche_Holz%C3%BCberwallung.jpg" } },
  { slug: 'hanger', kind: 'view', aspect: 1.3333, what: 'かべのフック',
    credit: { title: "Coathangers upside down.JPG", author: "HTO", license: 'CC0', url: "https://commons.wikimedia.org/wiki/File:Coathangers_upside_down.JPG" } },
  { slug: 'egg', kind: 'view', aspect: 1.3333, what: '目玉焼き',
    credit: { title: "1Volskeoko.jpg", author: "Safranek-interia.eu", license: 'CC0', url: "https://commons.wikimedia.org/wiki/File:1Volskeoko.jpg" } },
  { slug: 'cirrus', kind: 'ask', aspect: 1.3333, what: 'すじ雲',
    credit: { title: "Quill-shaped cirrus cloud.jpg", author: "W.carter", license: 'CC0', url: "https://commons.wikimedia.org/wiki/File:Quill-shaped_cirrus_cloud.jpg" } },
  { slug: 'cloud-heart', kind: 'ask', aspect: 1.3333, what: 'まるい雲',
    credit: { title: "Un nuage au-dessus de Crévoux (Hautes-Alpes) proche cascades (mai 2021).jpg", author: "Benoît Prieur", license: 'CC0', url: "https://commons.wikimedia.org/wiki/File:Un_nuage_au-dessus_de_Cr%C3%A9voux_(Hautes-Alpes)_proche_cascades_(mai_2021).jpg" } },
  { slug: 'foxglove', kind: 'ask', aspect: 1.0, what: '花のもよう',
    credit: { title: "Foxglove Mah Jongg (6001023412).jpg", author: "Leslie Seaton from Seattle, WA, USA", license: 'CC BY 2.0', url: "https://commons.wikimedia.org/wiki/File:Foxglove_Mah_Jongg_(6001023412).jpg" } },
  { slug: 'faucet', kind: 'view', aspect: 1.3333, what: 'じゃぐち',
    credit: { title: "A hidden face.jpg", author: "sunshinecity from Italy", license: 'CC BY 2.0', url: "https://commons.wikimedia.org/wiki/File:A_hidden_face.jpg" } },
  { slug: 'socket', kind: 'view', aspect: 0.75, what: 'コンセント',
    credit: { title: "Danish Wall Socket.jpg", author: "Peter Lindberg from Stockholm, Sweden", license: 'CC BY 2.0', url: "https://commons.wikimedia.org/wiki/File:Danish_Wall_Socket.jpg" } },
  { slug: 'cloud-dolphin', kind: 'view', aspect: 1.3333, what: '雲',
    credit: { title: "Dolphin Cloud (137567114).jpg", author: "Domenico Salvagnin from Legnaro, Italy", license: 'CC BY 2.0', url: "https://commons.wikimedia.org/wiki/File:Dolphin_Cloud_(137567114).jpg" } },
  { slug: 'cloud-shark', kind: 'view', aspect: 1.7857, what: '雲',
    credit: { title: "SharkOrSubmarine4024617900.jpg", author: "Brian from Edmonton, Canada", license: 'CC BY 2.0', url: "https://commons.wikimedia.org/wiki/File:SharkOrSubmarine4024617900.jpg" } },
  { slug: 'lorry', kind: 'view', aspect: 1.497, what: 'さびた台車',
    credit: { title: "20190301 Völklingen Ironworks 07.jpg", author: "Flocci Nivis", license: 'CC BY 4.0', url: "https://commons.wikimedia.org/wiki/File:20190301_V%C3%B6lklingen_Ironworks_07.jpg" } },
  { slug: 'manhole', kind: 'view', aspect: 1.3333, what: 'マンホール',
    credit: { title: "Manhole cover pareidolia.jpg", author: "Carlos ZGZ", license: 'CC BY 2.0', url: "https://commons.wikimedia.org/wiki/File:Manhole_cover_pareidolia.jpg" } },
  { slug: 'stump', kind: 'ask', aspect: 1.4993, what: '木の切り株',
    credit: { title: "Barkless - Flickr - Clearly Ambiguous.jpg", author: "Scott Robinson from Rockville, MD, USA", license: 'CC BY 2.0', url: "https://commons.wikimedia.org/wiki/File:Barkless_-_Flickr_-_Clearly_Ambiguous.jpg" } },
  { slug: 'rings', kind: 'ask', aspect: 1.5015, what: '木の断面',
    credit: { title: "Pareidolie Hölzern (34554131310).jpg", author: "kuhnmi", license: 'CC BY 2.0', url: "https://commons.wikimedia.org/wiki/File:Pareidolie_H%C3%B6lzern_(34554131310).jpg" } },
  { slug: 'bark-eye', kind: 'view', aspect: 1.0, what: '木の皮',
    credit: { title: "Tree eye pareidolia in Jackson Park.jpg", author: "AlphaBeta135", license: 'CC BY 4.0', url: "https://commons.wikimedia.org/wiki/File:Tree_eye_pareidolia_in_Jackson_Park.jpg" } },
  { slug: 'panda-stump', kind: 'view', aspect: 1.3333, what: '切り株',
    credit: { title: "Dřevěná-panda1.jpg", author: "Mgr. Zdeněk Kubeš", license: 'CC BY 2.5', url: "https://commons.wikimedia.org/wiki/File:D%C5%99ev%C4%9Bn%C3%A1-panda1.jpg" } },
  { slug: 'mushroom', kind: 'view', aspect: 1.2766, what: 'きのこ',
    credit: { title: "Lion-face mushroom (21839974418).jpg", author: "Peter Stevens from Seattle", license: 'CC BY 2.0', url: "https://commons.wikimedia.org/wiki/File:Lion-face_mushroom_(21839974418).jpg" } },
  { slug: 'rock-bear', kind: 'view', aspect: 1.2837, what: '海辺の岩',
    credit: { title: "Pedra do oso (3680405649).jpg", author: "amaianos from Galicia", license: 'CC BY 2.0', url: "https://commons.wikimedia.org/wiki/File:Pedra_do_oso_(3680405649).jpg" } },
];

const BASE = import.meta.env.BASE_URL;
export const samplePhotoURL = (slug: string) => `${BASE}samples/photos/${slug}.jpg`;
